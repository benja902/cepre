import katex from 'katex'
import 'katex/dist/katex.min.css'

function MathBlock({ latex }) {
  let html = ''
  try {
    html = katex.renderToString(latex, { displayMode: true, throwOnError: false })
  } catch {
    html = `<span style="color:#FF4655">[Error LaTeX: ${latex}]</span>`
  }
  return (
    <div
      className="overflow-x-auto py-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// blocks: array de { type: "text", content: string } | { type: "math", latex: string }
// También acepta un string plano (fallback para preguntas sin bloques)
export default function BlockRenderer({ blocks, className = '' }) {
  if (!blocks) return null

  // Si es string: intentar parsear como JSON, si falla renderizar como texto plano
  if (typeof blocks === 'string') {
    try {
      const parsed = JSON.parse(blocks)
      if (parsed?.blocks) return <BlockRenderer blocks={parsed.blocks} className={className} />
    } catch {}
    return (
      <p className={`text-sm text-val-text leading-relaxed whitespace-pre-line ${className}`}>
        {blocks}
      </p>
    )
  }

  // Nuevo formato con array de bloques
  const list = Array.isArray(blocks) ? blocks : blocks.blocks ?? []

  return (
    <div className={`space-y-1 ${className}`}>
      {list.map((block, i) =>
        block.type === 'math' ? (
          <MathBlock key={i} latex={block.latex} />
        ) : (
          <p key={i} className="text-sm text-val-text leading-relaxed">
            {block.content}
          </p>
        )
      )}
    </div>
  )
}
