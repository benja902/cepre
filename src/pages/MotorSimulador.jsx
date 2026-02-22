import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Timer from '../components/Timer'
import QuestionCard from '../components/QuestionCard'
import { supabase } from '../lib/supabaseClient'
import { saveSession, loadSession } from '../utils/storage'

const SECONDS_PER_QUESTION = 108  // 3 h para 100 preguntas → 10 800 s / 100

export default function MotorSimulador() {
  const navigate = useNavigate()
  const location = useLocation()

  const [questions, setQuestions] = useState([])
  const [answersById, setAnswersById] = useState({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [semanaId, setSemanaId] = useState(null)
  const [cursoIds, setCursoIds] = useState(null)  // array de ids
  const [finished, setFinished] = useState(false)

  // Bootstrap: intenta restaurar sesión o tomar datos de router state
  useEffect(() => {
    const routerState = location.state
    const session = loadSession()

    if (routerState?.semanaId && (routerState?.cursoIds || routerState?.cursoId)) {
      // Llegamos desde el dashboard
      // Backward compat: cursoId string → wrap en array
      const cIds = routerState.cursoIds
        ? routerState.cursoIds.map(String)
        : [String(routerState.cursoId)]
      setSemanaId(routerState.semanaId)
      setCursoIds(cIds)
      fetchQuestions(routerState.semanaId, cIds)
    } else if (session?.semanaId && (session?.cursoIds || session?.cursoId)) {
      // Reload: restaurar desde sessionStorage
      const cIds = session.cursoIds
        ? session.cursoIds.map(String)
        : [String(session.cursoId)]
      setSemanaId(session.semanaId)
      setCursoIds(cIds)
      setQuestions(session.questions || [])
      setAnswersById(session.answersById || {})
      setCurrentIdx(session.currentIdx || 0)
      setSecondsLeft(session.secondsLeft || 0)
      setLoading(false)
      setTimerActive(true)
    } else {
      // Sin datos: volver al dashboard
      navigate('/', { replace: true })
    }
  }, [])

  // Persistir en sessionStorage cada vez que cambia el estado relevante
  useEffect(() => {
    if (!semanaId || !cursoIds || loading) return
    saveSession({
      semanaId,
      cursoIds,
      questions,
      answersById,
      currentIdx,
      secondsLeft,
    })
  }, [questions, answersById, currentIdx, secondsLeft, semanaId, cursoIds, loading])

  // Auto-finalizar cuando el timer llega a 0
  useEffect(() => {
    if (secondsLeft === 0 && !loading && questions.length > 0 && !finished) {
      handleFinish(true)
    }
  }, [secondsLeft, loading, questions.length, finished])

  async function fetchQuestions(sId, cIds) {
    setLoading(true)
    setError(null)
    try {
      const [preguntasRes, cursosRes] = await Promise.all([
        supabase
          .from('preguntas')
          .select(
            'id, semana_id, curso_id, texto_pregunta, opcion_a, opcion_b, opcion_c, opcion_d, opcion_e, clave_oficial, clave_corregida, hay_error_oficial, explicacion_paso_a_paso'
          )
          .eq('semana_id', sId)
          .in('curso_id', cIds)
          .order('curso_id', { ascending: true })
          .order('id',       { ascending: true }),
        supabase
          .from('cursos')
          .select('id, nombre')
          .in('id', cIds),
      ])

      if (preguntasRes.error) throw preguntasRes.error
      if (cursosRes.error)   throw cursosRes.error

      if (!preguntasRes.data || preguntasRes.data.length === 0) {
        setError('No se encontraron preguntas para esta semana y los cursos seleccionados. Verifica los datos en Supabase.')
        setLoading(false)
        return
      }

      // Mapa id → nombre de curso para enriquecer cada pregunta
      const courseMap = Object.fromEntries(
        (cursosRes.data || []).map((c) => [String(c.id), c.nombre])
      )
      const data = preguntasRes.data.map((q) => ({
        ...q,
        curso_nombre: courseMap[String(q.curso_id)] || null,
      }))

      setQuestions(data)
      const totalSecs = data.length * SECONDS_PER_QUESTION
      setSecondsLeft(totalSecs)
      setLoading(false)
      setTimerActive(true)
    } catch (err) {
      console.error('[CEPREVAL] Error al cargar preguntas:', err)
      setError(err.message || 'Error al cargar preguntas')
      setLoading(false)
    }
  }

  function handleSelect(key) {
    const q = questions[currentIdx]
    setAnswersById((prev) => ({ ...prev, [q.id]: key }))
  }

  function handleFinish(autoFinished = false) {
    setFinished(true)
    setTimerActive(false)
    navigate('/resultados', {
      state: {
        questions,
        answersById,
        autoFinished,
      },
    })
  }

  const answeredCount = Object.keys(answersById).filter((id) =>
    questions.some((q) => String(q.id) === String(id))
  ).length

  const currentQuestion = questions[currentIdx]

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500">Cargando preguntas...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-16 bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">No se pudo cargar el simulador</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Barra de control */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            Respondidas: {' '}
            <span className="text-blue-600">{answeredCount}</span>
            <span className="text-gray-400">/{questions.length}</span>
          </span>
          {/* Barra de progreso */}
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer
            secondsLeft={secondsLeft}
            onTick={setSecondsLeft}
            active={timerActive}
          />
          <button
            onClick={() => handleFinish(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Finalizar
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Panel de navegación */}
        <aside className="hidden md:block w-36 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sticky top-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
              Preguntas
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {questions.map((q, idx) => {
                const answered = answersById[q.id] !== undefined
                const isCurrent = idx === currentIdx
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm scale-105'
                        : answered
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={`Pregunta ${idx + 1}${answered ? ' (respondida)' : ''}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Pregunta actual */}
        <div className="flex-1 min-w-0 space-y-4">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              selected={answersById[currentQuestion.id] || null}
              onSelect={handleSelect}
              index={currentIdx}
              total={questions.length}
            />
          )}

          {/* Navegación anterior / siguiente */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            {/* Navegación móvil compacta */}
            <div className="flex md:hidden gap-1.5 flex-wrap justify-center">
              {questions.map((q, idx) => {
                const answered = answersById[q.id] !== undefined
                const isCurrent = idx === currentIdx
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : answered
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentIdx === questions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
