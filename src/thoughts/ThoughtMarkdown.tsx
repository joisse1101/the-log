import { useMemo, type ReactNode } from 'react'
import MarkdownIt from 'markdown-it'

type Token = ReturnType<InstanceType<typeof MarkdownIt>['parse']>[number]

interface TokenNode {
  token: Token
  children: TokenNode[]
}

/**
 * Raw HTML is switched off (it stays as literal characters), autolinking of bare addresses is
 * off, and a link is only valid when it starts with http:, https: or mailto:.
 */
const SAFE_LINK = /^(?:https?:|mailto:)/i
const md = new MarkdownIt({ html: false, linkify: false, breaks: true })
md.validateLink = (url) => SAFE_LINK.test(url.trim())

/** Turns the flat token list into a tree, so each open token holds what lies between it and its close. */
function buildTree(tokens: Token[]): TokenNode[] {
  const root: TokenNode = { token: tokens[0], children: [] }
  const stack = [root]
  for (const token of tokens) {
    const top = stack[stack.length - 1]
    if (token.nesting === -1) {
      stack.pop()
    } else {
      const node: TokenNode = { token, children: [] }
      top.children.push(node)
      if (token.nesting === 1) stack.push(node)
    }
  }
  return root.children
}

const TASK_MARK = /^\[( |x|X)\][ \t]+/

interface Task {
  done: boolean
}

/** A list item is a task when its first text starts with "[ ] " or "[x] ". */
function taskOf(item: TokenNode): Task | null {
  const inline = item.children[0]?.children[0]
  const first = inline?.token.children?.[0]
  if (first?.type !== 'text') return null
  const found = TASK_MARK.exec(first.content)
  return found ? { done: found[1] !== ' ' } : null
}

function renderInline(nodes: TokenNode[], stripTaskMark: boolean): ReactNode[] {
  return nodes.map((node, index) => {
    const { token } = node
    const key = index
    switch (token.type) {
      case 'text': {
        const content = stripTaskMark && index === 0 ? token.content.replace(TASK_MARK, '') : token.content
        return content
      }
      case 'softbreak':
      case 'hardbreak':
        return <br key={key} />
      case 'code_inline':
        return <code key={key}>{token.content}</code>
      case 'strong_open':
        return <strong key={key}>{renderInline(node.children, false)}</strong>
      case 'em_open':
        return <em key={key}>{renderInline(node.children, false)}</em>
      case 's_open':
        return <s key={key}>{renderInline(node.children, false)}</s>
      case 'link_open': {
        const href = String(token.attrGet('href') ?? '')
        const inner = renderInline(node.children, false)
        if (!SAFE_LINK.test(href)) return <span key={key}>{inner}</span>
        return (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {inner}
          </a>
        )
      }
      case 'image':
        // No remote image is ever requested: the alt text is shown instead.
        return token.content
      default:
        return token.content
    }
  })
}

function renderInlineLeaf(node: TokenNode, stripTaskMark: boolean): ReactNode[] {
  const children = node.token.children ?? []
  return children.length === 0 ? [] : renderInline(buildTree(children), stripTaskMark)
}

function renderBlocks(nodes: TokenNode[]): ReactNode[] {
  return nodes.map((node, index) => renderBlock(node, index))
}

function renderTask(item: TokenNode, task: Task, key: number): ReactNode {
  const [first, ...rest] = item.children
  const text = renderInlineLeaf(first.children[0], true)
  return (
    <li key={key} className="md-task">
      <input type="checkbox" checked={task.done} disabled readOnly aria-label={task.done ? 'Done' : 'Not done'} />
      <span className={task.done ? 'md-task__text md-task__text--done' : 'md-task__text'}>{text}</span>
      {rest.length > 0 && <div className="md-task__more">{renderBlocks(rest)}</div>}
    </li>
  )
}

function renderBlock(node: TokenNode, key: number): ReactNode {
  const { token } = node
  switch (token.type) {
    case 'paragraph_open': {
      const inline = node.children[0] ? renderInlineLeaf(node.children[0], false) : []
      // A paragraph inside a tight list has no <p> of its own.
      return token.hidden ? <span key={key}>{inline}</span> : <p key={key}>{inline}</p>
    }
    case 'heading_open': {
      const level = Number(token.tag.slice(1))
      const inline = renderInlineLeaf(node.children[0], false)
      // The page title is the h1, so header 1 is an h2 and so on; header 6 is a quiet paragraph.
      if (level >= 6) return <p key={key} className="md-h6">{inline}</p>
      const Tag = `h${level + 1}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return <Tag key={key} className={`md-h${level}`}>{inline}</Tag>
    }
    case 'blockquote_open':
      return <blockquote key={key}>{renderBlocks(node.children)}</blockquote>
    case 'bullet_list_open':
    case 'ordered_list_open': {
      const tasks = node.children.map(taskOf)
      // Only a list made wholly of tasks loses its bullets; in a mixed list the other items keep theirs.
      const isTaskList = tasks.every((task) => task !== null)
      const items = node.children.map((item, index) => {
        const task = tasks[index]
        return task ? renderTask(item, task, index) : <li key={index}>{renderBlocks(item.children)}</li>
      })
      if (token.type === 'ordered_list_open') {
        const start = Number(token.attrGet('start') ?? 1)
        return <ol key={key} start={Number.isFinite(start) ? start : 1}>{items}</ol>
      }
      return <ul key={key} className={isTaskList ? 'md-tasks' : undefined}>{items}</ul>
    }
    case 'table_open':
      return <table key={key}>{renderBlocks(node.children)}</table>
    case 'thead_open':
      return <thead key={key}>{renderBlocks(node.children)}</thead>
    case 'tbody_open':
      return <tbody key={key}>{renderBlocks(node.children)}</tbody>
    case 'tr_open':
      return <tr key={key}>{renderBlocks(node.children)}</tr>
    case 'th_open':
      return <th key={key}>{renderInlineLeaf(node.children[0], false)}</th>
    case 'td_open':
      return <td key={key}>{renderInlineLeaf(node.children[0], false)}</td>
    case 'hr':
      return <hr key={key} />
    case 'fence':
    case 'code_block':
      return (
        <pre key={key}>
          <code>{token.content.replace(/\n$/, '')}</code>
        </pre>
      )
    default:
      return <p key={key}>{token.content}</p>
  }
}

interface ThoughtMarkdownProps {
  text: string
  className?: string
}

/**
 * A thought's text as markdown. It is built as React elements from the parsed tokens, never
 * from an HTML string, and only the elements above can appear.
 */
export function ThoughtMarkdown({ text, className }: ThoughtMarkdownProps) {
  const blocks = useMemo(() => {
    const tokens = md.parse(text, {})
    return tokens.length === 0 ? [] : renderBlocks(buildTree(tokens))
  }, [text])
  return <div className={className}>{blocks}</div>
}
