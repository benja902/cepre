/**
 * MarkdownText
 * Renderer ligero de markdown → React elements.
 * Soporta: **bold**, *italic*, listas numeradas, listas con guión, párrafos.
 * No depende de librerías externas.
 *
 * @param {string} text - texto con posible formato markdown
 * @param {string} className - clases extra para el contenedor
 */
export default function MarkdownText({ text, className = '' }) {
  if (!text) return null

  const blocks = parseBlocks(text)

  return (
    <div className={'space-y-2 ' + className}>
      {blocks.map((block, i) => {
        if (block.type === 'spacer') {
          return <div key={i} className="h-1" />
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="list-decimal ml-5 space-y-1">
              {block.items.map((item, j) => (
                <li key={j} className="text-gray-800">{renderInline(item)}</li>
              ))}
            </ol>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="list-disc ml-5 space-y-1">
              {block.items.map((item, j) => (
                <li key={j} className="text-gray-800">{renderInline(item)}</li>
              ))}
            </ul>
          )
        }
        // paragraph
        return (
          <p key={i} className="text-gray-800 leading-relaxed">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Parser de bloques
// ---------------------------------------------------------------------------
function parseBlocks(text) {
  const rawLines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < rawLines.length) {
    const line = rawLines[i]
    const trimmed = line.trim()

    // Línea vacía → separador
    if (trimmed === '') {
      // Solo agregar spacer si el bloque anterior no es también un spacer
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer' })
      }
      i++
      continue
    }

    // Lista numerada: "1. texto", "1) texto"
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items = []
      while (i < rawLines.length && /^\d+[.)]\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^\d+[.)]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Lista con guión/asterisco/bullet: "- texto", "* texto", "• texto"
    if (/^[-*•]\s+/.test(trimmed)) {
      const items = []
      while (i < rawLines.length && /^[-*•]\s+/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^[-*•]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Encabezados markdown (## Título) → párrafo en negrita
    if (/^#{1,4}\s+/.test(trimmed)) {
      blocks.push({ type: 'paragraph', text: trimmed.replace(/^#{1,4}\s+/, '') })
      i++
      continue
    }

    // Párrafo normal
    blocks.push({ type: 'paragraph', text: trimmed })
    i++
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Renderer de inline (negrita, cursiva)
// ---------------------------------------------------------------------------
function renderInline(text) {
  // Tokenizar: **bold**, *italic*, texto normal
  const tokens = tokenizeInline(text)

  if (tokens.length === 1 && tokens[0].type === 'text') {
    return text // path rápido: sin markup
  }

  return tokens.map((token, i) => {
    if (token.type === 'bold') return <strong key={i} className="font-semibold">{token.content}</strong>
    if (token.type === 'italic') return <em key={i}>{token.content}</em>
    return <span key={i}>{token.content}</span>
  })
}

function tokenizeInline(text) {
  const tokens = []
  // Regex: captura **bold**, *italic* o texto normal entre ellos
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|([^*]+)/g
  let match
  while ((match = re.exec(text)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({ type: 'bold', content: match[1] })
    } else if (match[2] !== undefined) {
      tokens.push({ type: 'italic', content: match[2] })
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'text', content: match[3] })
    }
  }
  return tokens.length > 0 ? tokens : [{ type: 'text', content: text }]
}
