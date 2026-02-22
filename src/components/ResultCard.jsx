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

  const cardBorder = isCorrect ? 'border-emerald-300' : 'border-red-300'
  const headerBg   = isCorrect ? 'bg-emerald-50' : 'bg-red-50'
  const iconBg     = isCorrect ? 'bg-emerald-500' : 'bg-red-500'
  const labelColor = isCorrect ? 'text-emerald-800' : 'text-red-800'
  const answerBg   = isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
  const answerLabel = isCorrect ? 'text-emerald-600' : 'text-red-600'
  const noteBg     = isCorrect ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-900'

  return (
    <div className={'bg-white rounded-2xl border-2 shadow-sm overflow-hidden ' + cardBorder}>
      <div className={'px-5 py-3 flex items-center gap-3 ' + headerBg}>
        <div className={'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + iconBg}>
          {isCorrect ? (
            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
            </svg>
          ) : (
            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M6 18L18 6M6 6l12 12' />
            </svg>
          )}
        </div>
        <span className={'font-semibold text-sm ' + labelColor}>
          Pregunta {index + 1} — {isCorrect ? 'Correcta' : 'Incorrecta'}
        </span>
      </div>

      <div className='p-5 space-y-4'>
        <QuestionText text={question.texto_pregunta} theme="light" />

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
          <div className={'rounded-xl px-4 py-3 border ' + answerBg}>
            <p className={'text-xs font-semibold uppercase tracking-wide mb-1 ' + answerLabel}>Tu respuesta</p>
            {userAnswer ? (
              <p className='text-gray-800 font-medium'><span className='font-bold'>{userAnswer}.</span> {getOptionText(userAnswer)}</p>
            ) : (
              <p className='text-gray-400 italic'>Sin respuesta</p>
            )}
          </div>

          <div className='rounded-xl px-4 py-3 border bg-emerald-50 border-emerald-200'>
            <p className='text-xs font-semibold uppercase tracking-wide mb-1 text-emerald-600'>Clave corregida</p>
            <p className='text-gray-800 font-medium'><span className='font-bold'>{claveCorregida}.</span> {getOptionText(claveCorregida)}</p>
          </div>

          {hayError && (
            <div className='rounded-xl px-4 py-3 border bg-amber-50 border-amber-200 sm:col-span-2'>
              <p className='text-xs font-semibold uppercase tracking-wide mb-1 text-amber-600'>Clave oficial del solucionario (con error)</p>
              <p className='text-gray-800 font-medium'><span className='font-bold'>{claveOficial}.</span> {getOptionText(claveOficial)}</p>
            </div>
          )}
        </div>

        {specialMessage && (
          <div className={'rounded-xl px-4 py-3 border text-sm leading-relaxed ' + noteBg}>
            <span className='font-semibold'>Nota: </span>{specialMessage}
          </div>
        )}

        {showExplanation && question.explicacion_paso_a_paso && (
          <details className='group' open>
            <summary className='cursor-pointer text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 select-none list-none'>
              <svg className='w-4 h-4 transition-transform group-open:rotate-90' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
              Ver explicaci&#xF3;n del solucionario
            </summary>
            <div className='mt-3 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3'>
              <p className='text-sm text-gray-700 leading-relaxed whitespace-pre-line'>{question.explicacion_paso_a_paso}</p>
            </div>
          </details>
        )}

        {!isCorrect && (
          <div className='pt-1 border-t border-gray-100'>
            <TutorIA detail={detail} />
          </div>
        )}
      </div>
    </div>
  )
}