const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** "Today, 09:41", "Yesterday, 21:15" or "Sun 15 Nov, 22:10" (with the year, "Thu 16 Oct 2025, 07:50", when it is not this year), in the browser's local time. */
export function formatThoughtTime(createdAt: string, now: Date): string {
  const created = new Date(createdAt)
  const time = `${pad(created.getHours())}:${pad(created.getMinutes())}`
  const dayMs = 24 * 60 * 60 * 1000
  const daysAgo = Math.round(
    (startOfDay(now).getTime() - startOfDay(created).getTime()) / dayMs,
  )
  if (daysAgo === 0) {
    return `Today, ${time}`
  }
  if (daysAgo === 1) {
    return `Yesterday, ${time}`
  }
  const year = created.getFullYear() === now.getFullYear() ? '' : ` ${created.getFullYear()}`
  return `${WEEKDAYS[created.getDay()]} ${created.getDate()} ${MONTHS[created.getMonth()]}${year}, ${time}`
}
