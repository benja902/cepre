import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase, checkEnvVars } from '../lib/supabaseClient'
import { clearSession } from '../utils/storage'

export default function DashboardSemanal() {
  const navigate = useNavigate()

  const [semanas, setSemanas]                     = useState([])
  const [cursos, setCursos]                       = useState([])
  const [selectedCiclo, setSelectedCiclo]         = useState('')
  const [selectedSemana, setSelectedSemana]       = useState('')
  const [selectedCursos, setSelectedCursos]       = useState([])
  const [cursosDisponibles, setCursosDisponibles] = useState(new Set())
  const [loadingCursos, setLoadingCursos]         = useState(false)
  const [loading, setLoading]                     = useState(true)
  const [error, setError]                         = useState(null)
  const [envErrors, setEnvErrors]                 = useState([])

  useEffect(() => {
    const errs = checkEnvVars()
    if (errs.length > 0) { setEnvErrors(errs); setLoading(false); return }
    clearSession()
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedSemana) { setCursosDisponibles(new Set()); setSelectedCursos([]); return }
    fetchCursosDisponibles(selectedSemana)
  }, [selectedSemana])

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [semanasRes, cursosRes] = await Promise.all([
        supabase.from('semanas').select('id, numero_semana, nombre, ciclo')
          .order('ciclo', { ascending: true }).order('numero_semana', { ascending: true }),
        supabase.from('cursos').select('id, nombre, area')
          .order('area', { ascending: true }).order('nombre', { ascending: true }),
      ])
      if (semanasRes.error) throw semanasRes.error
      if (cursosRes.error)  throw cursosRes.error
      setSemanas(semanasRes.data || [])
      setCursos(cursosRes.data   || [])
    } catch (err) {
      setError(err.message || 'Error al conectar con Supabase')
    } finally { setLoading(false) }
  }

  async function fetchCursosDisponibles(semanaId) {
    setLoadingCursos(true); setSelectedCursos([])
    try {
      const { data, error: err } = await supabase.from('preguntas').select('curso_id').eq('semana_id', semanaId)
      if (err) throw err
      setCursosDisponibles(new Set((data || []).map((r) => String(r.curso_id))))
    } catch { setCursosDisponibles(new Set()) }
    finally { setLoadingCursos(false) }
  }

  const ciclos           = [...new Set(semanas.map((s) => s.ciclo).filter(Boolean))]
  const semanasFiltradas = semanas.filter((s) => s.ciclo === selectedCiclo)
  const cursosActivos    = cursos.filter((c) => cursosDisponibles.has(String(c.id)))
  const areaMap = cursos.reduce((acc, c) => {
    const area = c.area || 'Sin área'
    if (!acc[area]) acc[area] = []
    acc[area].push(c)
    return acc
  }, {})

  function handleCicloSelect(ciclo) {
    setSelectedCiclo(ciclo); setSelectedSemana(''); setSelectedCursos([]); setCursosDisponibles(new Set())
  }
  function handleSemanaChange(val) { setSelectedSemana(val) }
  function toggleCurso(id) {
    const sid = String(id)
    setSelectedCursos((prev) => prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid])
  }
  function handleSeleccionarTodos() { setSelectedCursos(cursosActivos.map((c) => String(c.id))) }
  function handleDeseleccionarTodos() { setSelectedCursos([]) }
  function handleAleatorio() {
    if (cursosActivos.length === 0) return
    const shuffled = [...cursosActivos].sort(() => Math.random() - 0.5)
    const n = Math.max(1, Math.ceil(Math.random() * shuffled.length))
    setSelectedCursos(shuffled.slice(0, n).map((c) => String(c.id)))
  }
  function handleStart() {
    if (!selectedSemana || selectedCursos.length === 0) return
    navigate('/simulador', { state: { semanaId: selectedSemana, cursoIds: selectedCursos } })
  }

  const canStart = selectedSemana && selectedCursos.length > 0

  if (envErrors.length > 0) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-16 bg-val-surface border border-val-red border-opacity-60 val-clip p-6">
          <h2 className="text-val-red font-bold text-lg tracking-widest uppercase mb-4">Error de configuraci&#xF3;n</h2>
          <ul className="space-y-2">
            {envErrors.map((e) => (
              <li key={e} className="text-val-muted text-sm flex items-center gap-2">
                <span className="text-val-red font-bold">&#x2717;</span>
                <code className="bg-val-bg text-val-text px-2 py-0.5">{e}</code>
              </li>
            ))}
          </ul>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>

      {/* Hero */}
      <div className="mb-10 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-0.5 h-8 bg-val-red" />
          <div>
            <p className="text-xs tracking-widest uppercase text-val-red font-bold mb-0.5">// CEPREVAL &mdash; UNHEVAL</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-val-text tracking-wide uppercase leading-tight">
              Selecciona tu Examen
            </h2>
          </div>
        </div>
        <p className="text-val-muted text-sm tracking-wide ml-4 pl-3 border-l border-val-border">
          Elige ciclo, m&#xF3;dulo y cursos para iniciar el simulacro.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-val-border border-t-val-red rounded-full animate-spin" />
          <p className="text-val-muted text-xs tracking-widest uppercase">Cargando datos...</p>
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto bg-val-surface border border-val-red border-opacity-60 val-clip p-5 text-center">
          <p className="text-val-red font-bold uppercase tracking-widest text-sm mb-2">Error de conexi&#xF3;n</p>
          <p className="text-val-muted text-sm mb-4">{error}</p>
          <button onClick={fetchData}
            className="bg-val-red hover:bg-opacity-80 text-white text-xs font-bold px-5 py-2 val-clip-btn-sm tracking-widest uppercase transition-opacity">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-4">

          {/* PASO 1 — Ciclo */}
          <AgentCard number="01" label="Ciclo de Estudio" done={!!selectedCiclo}>
            {ciclos.length === 0 ? (
              <p className="text-xs text-val-muted italic tracking-wide">No hay ciclos registrados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ciclos.map((ciclo) => (
                  <button key={ciclo} onClick={() => handleCicloSelect(ciclo)}
                    className={`px-4 py-2 text-sm font-bold tracking-widest uppercase border val-clip-btn-sm transition-all ${
                      selectedCiclo === ciclo
                        ? 'bg-val-red border-val-red text-white'
                        : 'bg-val-bg border-val-border text-val-muted hover:border-val-red hover:text-val-red'
                    }`}>
                    {ciclo}
                  </button>
                ))}
              </div>
            )}
          </AgentCard>

          {/* PASO 2 — Módulo */}
          <AgentCard number="02" label="M&#xF3;dulo" done={!!selectedSemana} locked={!selectedCiclo}>
            {semanasFiltradas.length === 0 ? (
              <p className="text-xs text-val-muted italic tracking-wide">No hay m&#xF3;dulos para este ciclo.</p>
            ) : (
              <select value={selectedSemana} onChange={(e) => handleSemanaChange(e.target.value)}
                className="w-full bg-val-bg border border-val-border text-val-text text-sm font-medium px-4 py-2.5 focus:outline-none focus:border-val-red transition-colors tracking-wide appearance-none cursor-pointer">
                <option value="">&#x2014; Selecciona un m&#xF3;dulo &#x2014;</option>
                {semanasFiltradas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.numero_semana > 0
                      ? `Semana ${s.numero_semana}${s.nombre ? ` — ${s.nombre}` : ''}`
                      : s.nombre}
                  </option>
                ))}
              </select>
            )}
          </AgentCard>

          {/* PASO 3 — Cursos */}
          <AgentCard
            number="03"
            label={
              <span className="flex items-center gap-2">
                Cursos
                {selectedCursos.length > 0 && (
                  <span className="bg-val-red text-white text-xs font-bold px-2 py-0.5 tracking-widest">
                    {selectedCursos.length}
                  </span>
                )}
              </span>
            }
            done={selectedCursos.length > 0}
            locked={!selectedSemana}
          >
            {loadingCursos ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 border-2 border-val-border border-t-val-red rounded-full animate-spin" />
                <span className="text-xs text-val-muted tracking-widest uppercase">Verificando disponibilidad...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quick actions */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-val-muted tracking-widest uppercase mr-1">Acci&#xF3;n:</span>
                  {[
                    { label: 'Todos',    fn: handleSeleccionarTodos,    disabled: cursosActivos.length === 0, color: 'hover:text-val-text hover:border-val-border' },
                    { label: 'Ninguno',  fn: handleDeseleccionarTodos,  disabled: selectedCursos.length === 0, color: 'hover:text-val-text hover:border-val-border' },
                    { label: 'Aleatorio', fn: handleAleatorio,          disabled: cursosActivos.length === 0, color: 'hover:text-val-red hover:border-val-red' },
                  ].map(({ label, fn, disabled, color }) => (
                    <button key={label} onClick={fn} disabled={disabled}
                      className={`text-xs font-bold border border-val-border bg-val-bg text-val-muted px-3 py-1 val-clip-btn-sm tracking-widest uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${color}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Course grid by area */}
                <div className="space-y-4">
                  {Object.entries(areaMap).map(([area, cursosArea]) => (
                    <div key={area}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-px bg-val-border" />
                        <p className="text-xs font-bold text-val-muted uppercase tracking-widest">{area}</p>
                        <div className="flex-1 h-px bg-val-border" />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cursosArea.map((c) => {
                          const disponible = cursosDisponibles.has(String(c.id))
                          const sel        = selectedCursos.includes(String(c.id))
                          return (
                            <button key={c.id} onClick={() => disponible && toggleCurso(c.id)}
                              disabled={!disponible}
                              title={!disponible ? 'Sin preguntas para este m&#xF3;dulo' : ''}
                              className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase border val-clip-btn-sm transition-all select-none ${
                                !disponible
                                  ? 'border-val-border bg-val-bg text-val-border cursor-not-allowed opacity-30'
                                  : sel
                                  ? 'bg-val-red border-val-red text-white'
                                  : 'bg-val-bg border-val-border text-val-muted hover:border-val-red hover:text-val-red cursor-pointer'
                              }`}>
                              {c.nombre}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                {cursosDisponibles.size > 0 && (
                  <div className="flex items-center gap-4 text-xs text-val-muted pt-1 border-t border-val-border border-opacity-50">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-val-red inline-block" />
                      Seleccionado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 border border-val-border inline-block" />
                      Disponible
                    </span>
                    <span className="flex items-center gap-1.5 opacity-40">
                      <span className="w-2.5 h-2.5 border border-val-border inline-block opacity-30" />
                      Sin preguntas
                    </span>
                  </div>
                )}
              </div>
            )}
          </AgentCard>

          {/* Summary + Start */}
          {canStart && (
            <div className="bg-val-surface border border-val-red border-opacity-50 val-clip relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-val-red" />
              <div className="px-5 py-2 border-b border-val-border">
                <span className="text-xs tracking-widest uppercase font-bold text-val-muted">// CONFIGURACI&#xD3;N DEL SIMULACRO</span>
              </div>
              <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="text-sm text-val-muted space-y-1 tracking-wide">
                  <p><span className="text-val-text font-bold uppercase tracking-widest text-xs">Ciclo: </span>{selectedCiclo}</p>
                  <p><span className="text-val-text font-bold uppercase tracking-widest text-xs">M&#xF3;dulo: </span>{(() => {
                    const s = semanas.find((s) => String(s.id) === String(selectedSemana))
                    if (!s) return ''
                    return s.numero_semana > 0 ? `Semana ${s.numero_semana}${s.nombre ? ` — ${s.nombre}` : ''}` : s.nombre
                  })()}</p>
                  <p><span className="text-val-text font-bold uppercase tracking-widest text-xs">Cursos: </span>
                    {selectedCursos.map((id) => cursos.find((c) => String(c.id) === id)?.nombre).filter(Boolean).join(', ')}
                  </p>
                </div>
                <button onClick={handleStart}
                  className="flex items-center gap-2 bg-val-red hover:bg-opacity-90 text-white font-bold py-2.5 px-6 val-clip-btn text-sm tracking-widest uppercase transition-opacity whitespace-nowrap">
                  INICIAR
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { value: ciclos.length,   label: 'Ciclos'   },
              { value: semanas.length,  label: 'M&#xF3;dulos'  },
              { value: cursos.length,   label: 'Cursos'   },
            ].map(({ value, label }) => (
              <div key={label} className="bg-val-surface border border-val-border p-3 text-center val-clip-sm">
                <p className="text-2xl font-bold text-val-red leading-none">{value}</p>
                <p className="text-xs text-val-muted tracking-widest uppercase mt-1" dangerouslySetInnerHTML={{ __html: label }} />
              </div>
            ))}
          </div>

        </div>
      )}
    </Layout>
  )
}

function AgentCard({ number, label, done, locked, children }) {
  return (
    <div className={`bg-val-surface border val-clip transition-all duration-200 ${
      locked   ? 'border-val-border opacity-40 pointer-events-none'
      : done   ? 'border-val-red border-opacity-70'
               : 'border-val-border'
    }`}>
      <div className={`px-5 py-2.5 border-b flex items-center gap-3 ${done ? 'border-val-red border-opacity-30' : 'border-val-border'}`}>
        <span className={`font-mono text-xs font-bold tracking-widest ${done ? 'text-val-red' : 'text-val-muted'}`}>
          {done ? '✓' : number}
        </span>
        <div className="w-px h-4 bg-val-border" />
        <span className={`text-sm font-bold tracking-widest uppercase ${done ? 'text-val-red' : 'text-val-muted'}`}>
          {label}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
