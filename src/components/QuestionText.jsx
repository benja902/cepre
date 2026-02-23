/**
 * QuestionText — renderiza texto de pregunta con formato estructurado.
 * Maneja los \n reales del JSON y detecta patrones comunes de examen:
 *   - Ítems romanos:  I. II. III. IV.
 *   - Ítems alfa:     a. b. c. d.  /  a) b) c) d)
 *   - Ítems numéricos: 1. 2. 3.
 *   - Bloques contexto: [texto entre corchetes]
 *   - Párrafos normales
 */

// Detecta: I. / II. / IV.  (romanos hasta 8 chars, seguido de . o ))
const ROMAN_RE = /^([IVXivx]{1,6}[.)]\s*)(.*)/
// Detecta: a. / b) / A. (una sola letra a-e/A-E seguido de . o ))
const ALPHA_RE  = /^([a-eA-E][.)]\s*)(.*)/
// Detecta: 1. / 2) / 10.
const DIGIT_RE  = /^(\d{1,2}[.)]\s*)(.*)/

function classifyLine(line) {
  const t = line.trim()
  if (!t) return { type: 'spacer' }
  if (t.startsWith('[') && t.endsWith(']'))
    return { type: 'context', content: t.slice(1, -1).trim() }
  let m
  if ((m = t.match(ROMAN_RE))) return { type: 'item', label: m[1].trim(), content: m[2] }
  if ((m = t.match(ALPHA_RE)))  return { type: 'item', label: m[1].trim(), content: m[2] }
  if ((m = t.match(DIGIT_RE)))  return { type: 'item', label: m[1].trim(), content: m[2] }
  return { type: 'paragraph', content: t }
}

/**
 * @param {string} text - texto de la pregunta (con \n reales)
 * @param {'light'|'dark'} theme - reservado para compatibilidad, actualmente no usado
 */
export default function QuestionText({ text, theme = 'dark' }) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let itemBuffer = []

  function flushItems(key) {
    if (itemBuffer.length === 0) return
    elements.push(
      <ul key={'ul-' + key} className="space-y-1 pl-1">
        {itemBuffer.map((item, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="flex-shrink-0 font-bold text-sm min-w-[2rem] text-val-muted font-mono tracking-wider">
              {item.label}
            </span>
            <span className="text-sm leading-relaxed text-val-text">
              {item.content}
            </span>
          </li>
        ))}
      </ul>
    )
    itemBuffer = []
  }

  lines.forEach((line, i) => {
    const node = classifyLine(line)

    if (node.type === 'item') {
      itemBuffer.push(node)
      return
    }

    // Flush pending items before any non-item
    flushItems(i)

    if (node.type === 'spacer') {
      elements.push(<div key={i} className="h-1.5" />)
    } else if (node.type === 'context') {
      elements.push(
        <div
          key={i}
          className="border-l-2 border-val-red pl-3 py-1.5 text-sm italic text-val-muted bg-val-surface2"
        >
          {node.content}
        </div>
      )
    } else {
      // paragraph
      elements.push(
        <p key={i} className="text-sm leading-relaxed text-val-text">
          {node.content}
        </p>
      )
    }
  })

  // Flush any trailing items
  flushItems('end')

  return <div className="space-y-2">{elements}</div>
}
