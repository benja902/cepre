import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase, checkEnvVars } from '../lib/supabaseClient'
import { clearSession } from '../utils/storage'

export default function DashboardSemanal() {
  const navigate = useNavigate()
  const [semanas, setSemanas] = useState([])
  const [cursos, setCursos] = useState([])
  const [selectedSemana, setSelectedSemana] = useState('')
  const [selectedCurso, setSelectedCurso] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [envErrors, setEnvErrors] = useState([])

  useEffect(() => {
    const errs = checkEnvVars()
    if (errs.length > 0) {
      setEnvErrors(errs)
      setLoading(false)
      return
    }
    clearSession()
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [semanasRes, cursosRes] = await Promise.all([
        supabase
          .from('semanas')
          .select('id, numero_semana, nombre')
          .order('numero_semana', { ascending: true }),
        supabase
          .from('cursos')
          .select('id, nombre, area')
          .order('area', { ascending: true })
          .order('nombre', { ascending: true }),
      ])
      if (semanasRes.error) throw semanasRes.error
      if (cursosRes.error) throw cursosRes.error
      setSemanas(semanasRes.data || [])
      setCursos(cursosRes.data || [])
    } catch (err) {
      console.error('[CEPREVAL] Error cargando datos:', err)
      setError(err.message || 'Error al conectar con Supabase')
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    if (!selectedSemana || !selectedCurso) return
    navigate('/simulador', {
      state: {
        semanaId: selectedSemana,
        cursoId: selectedCurso,
      },
    })
  }

  // Agrupar cursos por área
  const areaMap = cursos.reduce((acc, c) => {
    const area = c.area || 'Sin área'
    if (!acc[area]) acc[area] = []
    acc[area].push(c)
    return acc
  }, {})

  if (envErrors.length > 0) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-16">
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
            <h2 className="text-red-800 font-bold text-lg mb-3">Error de configuración</h2>
            <p className="text-red-700 text-sm mb-3">
              Faltan variables de entorno requeridas. Edita el archivo{' '}
              <code className="bg-red-100 px-1 rounded">.env.local</code> en la raíz del proyecto:
            </p>
            <ul className="space-y-1">
              {envErrors.map((e) => (
                <li key={e} className="text-red-700 text-sm flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  <code className="bg-red-100 px-1 rounded">{e}</code>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-red-600">
              Luego reinicia el servidor con <code className="bg-red-100 px-1 rounded">npm run dev</code>.
            </p>
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
          Selecciona la semana de estudio y el curso para iniciar tu simulacro personalizado.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando semanas y cursos...</p>
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Error al cargar datos</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">

            {/* Selector semana */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Semana de estudio
              </label>
              {semanas.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No hay semanas registradas en la base de datos.</p>
              ) : (
                <select
                  value={selectedSemana}
                  onChange={(e) => setSelectedSemana(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                >
                  <option value="">— Selecciona una semana —</option>
                  {semanas.map((s) => (
                    <option key={s.id} value={s.id}>
                      Semana {s.numero_semana}{s.nombre ? ` – ${s.nombre}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selector curso */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Curso
              </label>
              {cursos.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No hay cursos registrados en la base de datos.</p>
              ) : (
                <select
                  value={selectedCurso}
                  onChange={(e) => setSelectedCurso(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                >
                  <option value="">— Selecciona un curso —</option>
                  {Object.entries(areaMap).map(([area, cursosArea]) => (
                    <optgroup key={area} label={area}>
                      {cursosArea.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* Info */}
            {selectedSemana && selectedCurso && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                <span className="font-semibold">Tiempo total estimado: </span>
                1.5 min por pregunta. El temporizador se iniciará automáticamente.
              </div>
            )}

            {/* Botón */}
            <button
              onClick={handleStart}
              disabled={!selectedSemana || !selectedCurso}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-150 text-base shadow-sm disabled:shadow-none"
            >
              Iniciar simulador
            </button>
          </div>

          {/* Stats cards */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{semanas.length}</p>
              <p className="text-xs text-gray-500 mt-1">Semanas disponibles</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{cursos.length}</p>
              <p className="text-xs text-gray-500 mt-1">Cursos disponibles</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
