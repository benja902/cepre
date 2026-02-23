import TutorIA from './TutorIA'
import QuestionText from './QuestionText'

export default function ResultCard({ detail, index }) {
  const {
    question, userAnswer, claveCorregida,
    claveOficial, hayError, isCorrect, specialMessage, showExplanation,
  } = detail

  const options = [
    { key: 'A', text: question.opcion_a },
    { key: 'B', text: question.opcion_b },
    { key: 'C', text: question.opcion_c },
    { key: 'D', text: question.opcion_d },
    { key: 'E', text: question.opcion_e },
  ].filter((o) => o.text)

  const getOptionText = (key) => options.find((o) => o.key === key)?.text || key

  return (
    <div className={`bg-val-surface border overflow-hidden val-clip ${isCorrect ? 'border-val-green' : 'border-val-red'}`}>

      {/* Header */}
      <div className={`px-5 py-2.5 flex items-center gap-3 border-b ${isCorrect ? 'bg-val-green-dim border-val-green border-opacity-40' : 'bg-val-red-dim border-val-red border-opacity-40'}`}>
        <div className={`w-7 h-7 val-clip-sm flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-val-green' : 'bg-val-red'}`}>
          {isCorrect ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <span className={`font-bold tracking-widest uppercase text-sm ${isCorrect ? 'text-val-green' : 'text-val-red'}`}>
          Pregunta {index + 1} &mdash; {isCorrect ? 'Correcta' : 'Incorrecta'}
        </span>
        {question.curso_nombre && (
          <span className="ml-auto text-xs text-val-muted tracking-widest uppercase font-medium">
            {question.curso_nombre}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <QuestionText text={question.texto_pregunta} theme="dark" />

        {/* Answers grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className={`px-4 py-3 border val-clip-sm ${isCorrect ? 'border-val-green border-opacity-40 bg-val-green-dim' : 'border-val-red border-opacity-40 bg-val-red-dim'}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${isCorrect ? 'text-val-green' : 'text-val-red'}`}>Tu respuesta</p>
            {userAnswer ? (
              <p className="text-val-text font-semibold">
                <span className={`inline-flex items-center justify-center w-5 h-5 mr-1.5 text-xs font-bold ${isCorrect ? 'bg-val-green' : 'bg-val-red'} text-white`}>{userAnswer}</span>
                {getOptionText(userAnswer)}
              </p>
            ) : (
              <p className="text-val-muted italic text-sm">Sin respuesta</p>
            )}
          </div>

          <div className="px-4 py-3 border border-val-green border-opacity-40 bg-val-green-dim val-clip-sm">
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-val-green">Clave corregida</p>
            <p className="text-val-text font-semibold">
              <span className="inline-flex items-center justify-center w-5 h-5 mr-1.5 text-xs font-bold bg-val-green text-white">{claveCorregida}</span>
              {getOptionText(claveCorregida)}
            </p>
          </div>

          {hayError && (
            <div className="px-4 py-3 border border-val-gold border-opacity-40 bg-val-surface2 sm:col-span-2 val-clip-sm">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-val-gold">Clave oficial del solucionario (con error)</p>
              <p className="text-val-text font-semibold">
                <span className="inline-flex items-center justify-center w-5 h-5 mr-1.5 text-xs font-bold bg-val-gold text-val-bg">{claveOficial}</span>
                {getOptionText(claveOficial)}
              </p>
            </div>
          )}
        </div>

        {specialMessage && (
          <div className="px-4 py-3 border border-val-gold border-opacity-40 bg-val-surface2 text-sm text-val-text leading-relaxed val-clip-sm">
            <span className="font-bold text-val-gold uppercase tracking-widest text-xs">Nota: </span>
            {specialMessage}
          </div>
        )}

        {showExplanation && question.explicacion_paso_a_paso && (
          <details className="group" open>
            <summary className="cursor-pointer text-xs font-bold text-val-muted hover:text-val-text uppercase tracking-widest flex items-center gap-2 select-none list-none transition-colors">
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Ver explicaci&#xF3;n del solucionario
            </summary>
            <div className="mt-3 border border-val-border bg-val-bg px-4 py-3 val-clip-sm">
              <p className="text-sm text-val-muted leading-relaxed whitespace-pre-line">{question.explicacion_paso_a_paso}</p>
            </div>
          </details>
        )}

        {!isCorrect && (
          <div className="pt-1 border-t border-val-border border-opacity-50">
            <TutorIA detail={detail} />
          </div>
        )}
      </div>
    </div>
  )
}
