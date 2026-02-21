/**
 * QuestionCard — renderiza una pregunta con sus alternativas A–E
 * @param {Object} question
 * @param {string|null} selected - clave seleccionada ("A"|"B"|...) o null
 * @param {function} onSelect - callback(clave)
 * @param {number} index - índice 0-based de la pregunta
 * @param {number} total - total de preguntas
 */
export default function QuestionCard({ question, selected, onSelect, index, total }) {
  const options = [
    { key: 'A', text: question.opcion_a },
    { key: 'B', text: question.opcion_b },
    { key: 'C', text: question.opcion_c },
    { key: 'D', text: question.opcion_d },
    { key: 'E', text: question.opcion_e },
  ].filter((o) => o.text)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-blue-100 text-sm font-medium">
            Pregunta {index + 1} de {total}
          </span>
          {question.curso && (
            <span className="text-xs bg-blue-500 bg-opacity-50 text-white px-2 py-0.5 rounded-full">
              {question.curso_nombre || ''}
            </span>
          )}
        </div>
        <p className="mt-2 text-white text-base font-medium leading-relaxed">
          {question.texto_pregunta}
        </p>
      </div>

      {/* Options */}
      <div className="p-5 space-y-2.5">
        {options.map((opt) => {
          const isSelected = selected === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 text-gray-800'
              }`}
            >
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {opt.key}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed">{opt.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
