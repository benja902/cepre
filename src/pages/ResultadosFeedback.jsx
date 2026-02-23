import { useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import ResultCard from '../components/ResultCard'
import { scoreAttempt } from '../utils/scoring'
import { loadSession, clearSession } from '../utils/storage'

export default function ResultadosFeedback() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const { questions, answersById, autoFinished } = useMemo(() => {
    if (location.state?.questions) return location.state
    const session = loadSession()
    if (session?.questions) return { questions: session.questions, answersById: session.answersById || {}, autoFinished: false }
    return { questions: null, answersById: {}, autoFinished: false }
  }, [])

  useEffect(() => { if (!questions) navigate('/', { replace: true }) }, [questions])

  const { correctCount, total, scorePct, details } = useMemo(() => {
    if (!questions) return { correctCount: 0, total: 0, scorePct: 0, details: [] }
    return scoreAttempt(questions, answersById)
  }, [questions, answersById])

  function handleBack() { clearSession(); navigate('/') }
  if (!questions) return null

  const answeredCount = Object.keys(answersById).filter((id) =>
    questions.some((q) => String(q.id) === String(id))
  ).length
  const unanswered  = total - answeredCount
  const incorrectCount = total - correctCount - unanswered

  const rank =
    scorePct >= 80 ? { label: 'EXCELENTE', color: 'text-val-green',   border: 'border-val-green',  bar: '#3FB549', glow: 'shadow-val-green' }
    : scorePct >= 60 ? { label: 'APROBADO',   color: 'text-val-gold',    border: 'border-val-gold',   bar: '#F6B73C', glow: '' }
    :                  { label: 'POR MEJORAR', color: 'text-val-red',     border: 'border-val-red',    bar: '#FF4655', glow: '' }

  return (
    <Layout>
      {autoFinished && (
        <div className="mb-5 border border-val-gold border-opacity-60 bg-val-surface px-4 py-3 text-sm text-val-gold tracking-wide uppercase font-semibold flex items-center gap-2 val-clip-sm">
          <div className="w-1.5 h-1.5 bg-val-gold" />
          Tiempo agotado — Simulacro finalizado autom&#xE1;ticamente
        </div>
      )}

      {/* ── MATCH SUMMARY banner ─────────────────────────────────────── */}
      <div className={`bg-val-surface border ${rank.border} border-opacity-60 val-clip mb-8 overflow-hidden relative`}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: rank.bar }} />
        <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: rank.bar }} />

        <div className="px-6 py-2 border-b border-val-border">
          <span className="text-xs tracking-widest uppercase font-bold text-val-muted">// RESUMEN DEL SIMULACRO</span>
        </div>

        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#2B3541" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={rank.bar} strokeWidth="8"
                strokeDasharray={`${(scorePct / 100) * 251.3} 251.3`} strokeLinecap="butt" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold font-mono leading-none ${rank.color}`}>{scorePct}</span>
              <span className="text-xs text-val-muted tracking-widest">%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <h2 className={`text-3xl font-bold tracking-widest uppercase ${rank.color}`}>{rank.label}</h2>
            <p className="text-val-muted text-sm tracking-wide">
              <span className="text-val-text font-bold text-lg">{correctCount}</span>
              <span className="mx-1">/</span>
              <span className="text-val-text font-bold text-lg">{total}</span>
              {' '}respuestas correctas
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <ScoreBadge value={correctCount}   label="Correctas"    color="green" />
              <ScoreBadge value={incorrectCount} label="Incorrectas"  color="red"   />
              {unanswered > 0 && <ScoreBadge value={unanswered} label="Sin resp." color="muted" />}
            </div>
          </div>

          {/* Back button */}
          <button onClick={handleBack}
            className="flex items-center gap-2 border border-val-border bg-val-surface2 hover:border-val-red hover:text-val-red text-val-muted font-semibold text-xs px-5 py-2.5 val-clip-btn-sm tracking-widest uppercase transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </button>
        </div>

        {/* XP bar */}
        <div className="px-6 py-3 border-t border-val-border bg-val-bg">
          <div className="flex items-center justify-between text-xs text-val-muted tracking-widest uppercase mb-1.5">
            <span>Rendimiento</span>
            <span style={{ color: rank.bar }}>{scorePct}%</span>
          </div>
          <div className="h-1.5 bg-val-surface2 w-full">
            <div className="h-1.5 transition-all duration-700" style={{ width: `${scorePct}%`, background: rank.bar }} />
          </div>
        </div>
      </div>

      {/* ── Detalle por pregunta ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-0.5 h-5 bg-val-red" />
          <h3 className="text-sm font-bold tracking-widest uppercase text-val-muted">Detalle por pregunta</h3>
        </div>
        {details.map((detail, idx) => (
          <ResultCard key={detail.question.id} detail={detail} index={idx} />
        ))}
      </div>

      {/* ── CTA final ────────────────────────────────────────────────── */}
      <div className="mt-8 text-center">
        <button onClick={handleBack}
          className="inline-flex items-center gap-3 bg-val-red hover:bg-opacity-90 text-white font-bold px-8 py-3 val-clip-btn tracking-widest uppercase text-sm transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Nuevo Simulacro
        </button>
      </div>
    </Layout>
  )
}

function ScoreBadge({ value, label, color }) {
  const styles = {
    green: 'border-val-green border-opacity-50 text-val-green bg-val-green-dim',
    red:   'border-val-red   border-opacity-50 text-val-red   bg-val-red-dim',
    muted: 'border-val-border text-val-muted bg-val-surface2',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border text-xs font-bold tracking-widest uppercase ${styles[color]}`}>
      <span className="text-sm font-bold">{value}</span>
      {label}
    </span>
  )
}
