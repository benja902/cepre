import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase, checkEnvVars } from '../lib/supabaseClient'
import { clearSession } from '../utils/storage'

export default function DashboardSemanal() {
  const navigate = useNavigate()

  const [semanas, setSemanas]                   = useState([])
  const [cursos, setCursos]                     = useState([])
  const [selectedCiclo, setSelectedCiclo]       = useState('')
  const [selectedSemana, setSelectedSemana]     = useState('')
  const [selectedCursos, setSelectedCursos]     = useState([])   // array de ids (string)
  const [cursosDisponibles, setCursosDisponibles] = useState(new Set()) // ids con preguntas
  const [loadingCursos, setLoadingCursos]       = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState(null)
  const [envErrors, setEnvErrors]               = useState([])

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const errs = checkEnvVars()
    if (errs.length > 0) { setEnvErrors(errs); setLoading(false); return }
    clearSession()
    fetchData()
  }, [])

  // Cuando cambia la semana, consultar qué cursos tienen preguntas
  useEffect(() => {
    if (!selectedSemana) {
      setCursosDisponibles(new Set())
      setSelectedCursos([])
      return
    }
    fetchCursosDisponibles(selectedSemana)
  }, [selectedSemana])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [semanasRes, cursosRes] = await Promise.all([
        supabase
          .from('semanas')
          .select('id, numero_semana, nombre, ciclo')
          .order('ciclo',         { ascending: true })
          .order('numero_semana', { ascending: true }),
        supabase
          .from('cursos')
          .select('id, nombre, area')
          .order('area',   { ascending: true })
          .order('nombre', { ascending: true }),
      ])
      if (semanasRes.error) throw semanasRes.error
      if (cursosRes.error)  throw cursosRes.error
      setSemanas(semanasRes.data || [])
      setCursos(cursosRes.data   || [])
    } catch (err) {
      console.error('[CEPREVAL] Error cargando datos:', err)
      setError(err.message || 'Error al conectar con Supabase')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCursosDisponibles(semanaId) {
    setLoadingCursos(true)
    setSelectedCursos([])
    try {
      const { data, error: err } = await supabase
        .from('preguntas')
        .select('curso_id')
        .eq('semana_id', semanaId)
      if (err) throw err
      const ids = new Set((data || []).map((r) => String(r.curso_id)))
      setCursosDisponibles(ids)
    } catch (err) {
      console.error('[CEPREVAL] Error consultando cursos disponibles:', err)
      setCursosDisponibles(new Set())
    } finally {
      setLoadingCursos(false)
    }
  }

  // ── Datos derivados ────────────────────────────────────────────────────────
  const ciclos           = [...new Set(semanas.map((s) => s.ciclo).filter(Boolean))]
  const semanasFiltradas = semanas.filter((s) => s.ciclo === selectedCiclo)
  const cursosActivos    = cursos.filter((c) => cursosDisponibles.has(String(c.id)))

  // Agrupado por área (para el layout visual)
  const areaMap = cursos.reduce((acc, c) => {
    const area = c.area || 'Sin área'
    if (!acc[area]) acc[area] = []
    acc[area].push(c)
    return acc
  }, {})

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleCicloSelect(ciclo) {
    setSelectedCiclo(ciclo)
    setSelectedSemana('')
    setSelectedCursos([])
    setCursosDisponibles(new Set())
  }

  function handleSemanaChange(val) {
    setSelectedSemana(val)
    // selectedCursos se resetea en el useEffect
  }

  function toggleCurso(id) {
    const sid = String(id)
    setSelectedCursos((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    )
  }

  function handleSeleccionarTodos() {
    setSelectedCursos(cursosActivos.map((c) => String(c.id)))
  }

  function handleDeseleccionarTodos() {
    setSelectedCursos([])
  }

  function handleAleatorio() {
    if (cursosActivos.length === 0) return
    const shuffled = [...cursosActivos].sort(() => Math.random() - 0.5)
    // Elige entre 1 y todos los disponibles (mínimo 1, máximo todos)
    const n = Math.max(1, Math.ceil(Math.random() * shuffled.length))
    setSelectedCursos(shuffled.slice(0, n).map((c) => String(c.id)))
  }

  function handleStart() {
    if (!selectedSemana || selectedCursos.length === 0) return
    navigate('/simulador', {
      state: { semanaId: selectedSemana, cursoIds: selectedCursos },
    })
  }

  const step = !selectedCiclo ? 1 : !selectedSemana ? 2 : 3
  const canStart = selectedSemana && selectedCursos.length > 0

  // ── Error env vars ─────────────────────────────────────────────────────────
  if (envErrors.length > 0) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-16">
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
            <h2 className="text-red-800 font-bold text-lg mb-3">Error de configuración</h2>
            <ul className="space-y-1">
              {envErrors.map((e) => (
                <li key={e} className="text-red-700 text-sm flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <code className="bg-red-100 px-1 rounded">{e}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Hero */}
      <div className="text-center mb-10">
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          Simulador oficial
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Prepárate para el examen
        </h2>
        <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
          Elige tu ciclo, módulo y los cursos que quieres practicar.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Error al cargar datos</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button onClick={fetchData}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-4">

          {/* ── PASO 1: Ciclo ──────────────────────────────────────────────── */}
          <StepCard number={1} label="Ciclo de estudio" done={!!selectedCiclo}>
            {ciclos.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay ciclos registrados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ciclos.map((ciclo) => (
                  <button
                    key={ciclo}
                    onClick={() => handleCicloSelect(ciclo)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                      selectedCiclo === ciclo
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                    }`}
                  >
                    {ciclo}
                  </button>
                ))}
              </div>
            )}
          </StepCard>

          {/* ── PASO 2: Módulo ─────────────────────────────────────────────── */}
          <StepCard number={2} label="Módulo" done={!!selectedSemana} locked={!selectedCiclo}>
            {semanasFiltradas.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay módulos para este ciclo.</p>
            ) : (
              <select
                value={selectedSemana}
                onChange={(e) => handleSemanaChange(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
              >
                <option value="">— Selecciona un módulo —</option>
                {semanasFiltradas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.numero_semana > 0
                      ? `Semana ${s.numero_semana}${s.nombre ? ` – ${s.nombre}` : ''}`
                      : s.nombre}
                  </option>
                ))}
              </select>
            )}
          </StepCard>

          {/* ── PASO 3: Cursos ─────────────────────────────────────────────── */}
          <StepCard
            number={3}
            label={
              <span className="flex items-center gap-2">
                Cursos
                {selectedCursos.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedCursos.length} seleccionado{selectedCursos.length > 1 ? 's' : ''}
                  </span>
                )}
              </span>
            }
            done={selectedCursos.length > 0}
            locked={!selectedSemana}
          >
            {loadingCursos ? (
              <div className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Verificando disponibilidad...</span>
              </div>
            ) : cursos.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay cursos registrados.</p>
            ) : (
              <div className="space-y-4">
                {/* Acciones rápidas */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">Acción rápida:</span>
                  <button
                    onClick={handleSeleccionarTodos}
                    disabled={cursosActivos.length === 0}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                  >
                    Todos
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    onClick={handleDeseleccionarTodos}
                    disabled={selectedCursos.length === 0}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                  >
                    Ninguno
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    onClick={handleAleatorio}
                    disabled={cursosActivos.length === 0}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-lg hover:bg-violet-50 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Aleatorio
                  </button>
                </div>

                {/* Grid de cursos agrupados por área */}
                <div className="space-y-3">
                  {Object.entries(areaMap).map(([area, cursosArea]) => (
                    <div key={area}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        {area}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cursosArea.map((c) => {
                          const disponible = cursosDisponibles.has(String(c.id))
                          const selected   = selectedCursos.includes(String(c.id))
                          return (
                            <button
                              key={c.id}
                              onClick={() => disponible && toggleCurso(c.id)}
                              disabled={!disponible}
                              title={!disponible ? 'Sin preguntas para este módulo' : ''}
                              className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all duration-150 select-none ${
                                !disponible
                                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                  : selected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700 cursor-pointer'
                              }`}
                            >
                              {c.nombre}
                              {!disponible && (
                                <span className="ml-1 text-gray-300 text-xs not-italic no-underline">
                                  —
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Leyenda */}
                {cursosDisponibles.size > 0 && (
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                      Seleccionado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full border-2 border-gray-200 inline-block" />
                      Disponible
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-gray-100 inline-block" />
                      Sin preguntas
                    </span>
                  </div>
                )}
              </div>
            )}
          </StepCard>

          {/* ── Resumen + Botón ────────────────────────────────────────────── */}
          {canStart && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-blue-800 space-y-0.5">
                <p>
                  <span className="font-semibold">Ciclo:</span> {selectedCiclo}
                </p>
                <p>
                  <span className="font-semibold">Módulo:</span>{' '}
                  {(() => {
                    const s = semanas.find((s) => String(s.id) === String(selectedSemana))
                    if (!s) return ''
                    return s.numero_semana > 0
                      ? `Semana ${s.numero_semana}${s.nombre ? ` – ${s.nombre}` : ''}`
                      : s.nombre
                  })()}
                </p>
                <p>
                  <span className="font-semibold">Cursos:</span>{' '}
                  {selectedCursos
                    .map((id) => cursos.find((c) => String(c.id) === id)?.nombre)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              <button
                onClick={handleStart}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap"
              >
                ¡A Practicar! →
              </button>
            </div>
          )}

          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <StatCard value={ciclos.length}  label="Ciclos"  />
            <StatCard value={semanas.length} label="Módulos" />
            <StatCard value={cursos.length}  label="Cursos"  />
          </div>

        </div>
      )}
    </Layout>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function StepCard({ number, label, done, locked, children }) {
  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-200 ${
      locked
        ? 'border-gray-100 opacity-40 pointer-events-none'
        : done
        ? 'border-blue-300 shadow-sm'
        : 'border-gray-200'
    }`}>
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
          done ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {done ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : number}
        </div>
        <span className={`text-sm font-semibold ${done ? 'text-blue-700' : 'text-gray-700'}`}>
          {label}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <p className="text-xl font-bold text-blue-600">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
