import MarkdownIt from 'markdown-it'

type Token = ReturnType<InstanceType<typeof MarkdownIt>['parse']>[number]

const md = new MarkdownIt({ html: false, linkify: false, breaks: true })
const TASK_MARK = /^\[( |x|X)\][ \t]+/

export interface PlainThought {
  /** The text of a leading header, with its marks removed; null when the text does not start with one. */
  title: string | null
  /** Every other block as plain lines. */
  body: string
}

/** The words of one inline token, with every mark (bold, links, code ticks) dropped. */
function inlineText(token: Token): string {
  const parts = (token.children ?? []).map((child) => {
    if (child.type === 'softbreak' || child.type === 'hardbreak') return '\n'
    if (child.type === 'text' || child.type === 'code_inline' || child.type === 'image') return child.content
    return ''
  })
  return parts.join('').replace(TASK_MARK, '')
}

/**
 * A thought's text as plain text, built from the markdown-it tokens (text content only, never HTML).
 * A header on the first line comes back as the title; everything else is the body.
 */
export function thoughtToPlainText(text: string): PlainThought {
  const tokens = md.parse(text, {})
  const lines: string[] = []
  let title: string | null = null
  tokens.forEach((token, index) => {
    if (token.type === 'inline') {
      const isLeadingHeading = index === 1 && tokens[0].type === 'heading_open'
      if (isLeadingHeading) title = inlineText(token)
      else lines.push(inlineText(token))
    } else if (token.type === 'fence' || token.type === 'code_block') {
      lines.push(token.content.replace(/\n$/, ''))
    }
  })
  return { title, body: lines.filter((line) => line !== '').join('\n') }
}
