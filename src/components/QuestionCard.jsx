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
        {/* Fila: contador + curso */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-blue-100 text-sm font-medium">
            Pregunta {index + 1} de {total}
          </span>
        </div>

        {/* Etiqueta de curso destacada */}
        {question.curso_nombre && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 bg-white bg-opacity-20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {question.curso_nombre}
            </span>
          </div>
        )}

        <p className="text-white text-base font-medium leading-relaxed">
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
