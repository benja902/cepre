import { useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import ResultCard from '../components/ResultCard'
import { scoreAttempt } from '../utils/scoring'
import { loadSession, clearSession } from '../utils/storage'

export default function ResultadosFeedback() {
  const navigate = useNavigate()
  const location = useLocation()

  // Intentar obtener datos del router state; si no, del sessionStorage
  const { questions, answersById, autoFinished } = useMemo(() => {
    if (location.state?.questions) {
      return location.state
    }
    const session = loadSession()
    if (session?.questions) {
      return { questions: session.questions, answersById: session.answersById || {}, autoFinished: false }
    }
    return { questions: null, answersById: {}, autoFinished: false }
  }, [])

  // Si no hay datos, redirigir al dashboard
  useEffect(() => {
    if (!questions) {
      navigate('/', { replace: true })
    }
  }, [questions])

  const { correctCount, total, scorePct, details } = useMemo(() => {
    if (!questions) return { correctCount: 0, total: 0, scorePct: 0, details: [] }
    return scoreAttempt(questions, answersById)
  }, [questions, answersById])

  function handleBack() {
    clearSession()
    navigate('/')
  }

  if (!questions) return null

  const answeredCount = Object.keys(answersById).filter((id) =>
    questions.some((q) => String(q.id) === String(id))
  ).length
  const unanswered = total - answeredCount

  const scoreLabel =
    scorePct >= 80
      ? { text: 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300' }
      : scorePct >= 60
      ? { text: 'Aprobado', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' }
      : { text: 'Por mejorar', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' }

  return (
    <Layout>
      {/* Banner de resultado */}
      <div className="mb-8">
        {autoFinished && (
          <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium text-center">
            El tiempo se agotó. El simulador se finalizó automáticamente.
          </div>
        )}

        <div className={`rounded-2xl border-2 ${scoreLabel.border} ${scoreLabel.bg} p-6 sm:p-8`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Círculo de puntuación */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={scorePct >= 80 ? '#10b981' : scorePct >= 60 ? '#3b82f6' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${(scorePct / 100) * 251.3} 251.3`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-extrabold ${scoreLabel.color}`}>{scorePct}%</span>
              </div>
            </div>

            {/* Texto y stats */}
            <div className="text-center sm:text-left">
              <h2 className={`text-2xl font-extrabold ${scoreLabel.color} mb-1`}>
                {scoreLabel.text}
              </h2>
              <p className="text-gray-700 text-sm mb-4">
                Obtuviste <span className="font-bold text-gray-900">{correctCount}</span> de{' '}
                <span className="font-bold text-gray-900">{total}</span> respuestas correctas.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <StatBadge label="Correctas" value={correctCount} color="emerald" />
                <StatBadge label="Incorrectas" value={total - correctCount - unanswered} color="red" />
                {unanswered > 0 && (
                  <StatBadge label="Sin responder" value={unanswered} color="gray" />
                )}
              </div>
            </div>

            <div className="sm:ml-auto">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Volver al dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle por pregunta */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Detalle por pregunta</h3>
        {details.map((detail, idx) => (
          <ResultCard key={detail.question.id} detail={detail} index={idx} />
        ))}
      </div>

      {/* Botón final */}
      <div className="mt-8 text-center">
        <button
          onClick={handleBack}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm"
        >
          Nuevo simulacro
        </button>
      </div>
    </Layout>
  )
}

function StatBadge({ label, value, color }) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${colors[color]}`}>
      <span className="text-base font-extrabold">{value}</span>
      <span className="font-normal">{label}</span>
    </span>
  )
}
