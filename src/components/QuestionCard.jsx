import QuestionText from './QuestionText'
import BlockRenderer from './BlockRenderer'

export default function QuestionCard({ question, selected, onSelect, index, total }) {
  const options = [
    { key: 'A', text: question.opcion_a },
    { key: 'B', text: question.opcion_b },
    { key: 'C', text: question.opcion_c },
    { key: 'D', text: question.opcion_d },
    { key: 'E', text: question.opcion_e },
  ].filter((o) => o.text)

  return (
    <div className="bg-val-surface border border-val-border overflow-hidden val-clip">

      {/* Header */}
      <div className="border-b border-val-border px-5 py-3 flex items-center justify-between bg-val-surface2 relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-val-red" />
        <span className="text-xs font-semibold tracking-widest uppercase text-val-muted">
          Pregunta <span className="text-val-text font-bold">{index + 1}</span>
          <span className="text-val-border mx-1">/</span>
          {total}
        </span>
        {question.curso_nombre && (
          <span className="flex items-center gap-1.5 bg-val-red bg-opacity-15 border border-val-red border-opacity-40 text-val-red text-xs font-bold uppercase tracking-widest px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 bg-val-red rounded-full" />
            {question.curso_nombre}
          </span>
        )}
      </div>

      {/* Question text */}
      <div className="px-5 pt-4 pb-3 border-b border-val-border border-opacity-50">
        <QuestionText text={question.texto_pregunta} theme="dark" />
        {question.contenido_matematico && (
          <div className="mt-3 border-t border-val-border border-opacity-40 pt-3">
            <BlockRenderer blocks={question.contenido_matematico.blocks ?? question.contenido_matematico} />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="p-4 space-y-2">
        {options.map((opt) => {
          const isSelected = selected === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 border transition-all duration-100 focus:outline-none val-clip-btn-sm ${
                isSelected
                  ? 'border-val-red bg-val-red bg-opacity-10 text-val-text'
                  : 'border-val-border bg-val-bg hover:border-val-red hover:border-opacity-60 hover:bg-val-surface2 text-val-text'
              }`}
            >
              <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors border ${
                isSelected
                  ? 'bg-val-red border-val-red text-white'
                  : 'bg-val-surface2 border-val-border text-val-muted'
              }`}>
                {opt.key}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed font-medium">{opt.text}</span>
            </button>
          )
        })}
      </div>

    </div>
  )
}
