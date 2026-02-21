import { useState, useRef, useEffect } from 'react'
import { streamTutorExplanation } from '../lib/tutorApi'
import MarkdownText from './MarkdownText'

/**
 * TutorIA
 * Botón "¿Por qué me equivoqué?" con respuesta LLM en streaming.
 * @param {Object} detail - objeto detail de scoreAttempt()
 */
export default function TutorIA({ detail }) {
  const [state, setState] = useState('idle') // idle | loading | streaming | done | error
  const [text, setText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const abortRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll conforme llega el texto
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    }
  }, [text])

  // Cancelar si el componente se desmonta durante streaming
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  async function handleAsk() {
    setText('')
    setErrorMsg('')
    setState('loading')

    const controller = new AbortController()
    abortRef.current = controller

    let stream
    try {
      stream = streamTutorExplanation(detail, controller.signal)
    } catch (err) {
      setState('error')
      setErrorMsg(err.message)
      return
    }

    const reader = stream.getReader()
    setState('streaming')

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setText((prev) => prev + value)
      }
      setState('done')
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        setState('done')
      } else {
        console.error('[TutorIA] Error en stream:', err)
        setErrorMsg(err.message || 'Error al obtener la explicación.')
        setState('error')
      }
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.abort()
    setState('done')
  }

  function handleReset() {
    if (abortRef.current) abortRef.current.abort()
    setText('')
    setErrorMsg('')
    setState('idle')
  }

  return (
    <div className="mt-3">
      {/* Botón principal */}
      {state === 'idle' && (
        <button
          onClick={handleAsk}
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 hover:border-violet-400 px-4 py-2 rounded-xl transition-all duration-150"
        >
          <SparkleIcon />
          ¿Por qué me equivoqué?
        </button>
      )}

      {/* Estado loading (antes de que llegue el primer token) */}
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-violet-600">
          <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin flex-shrink-0" />
          <span>El tutor IA está pensando...</span>
        </div>
      )}

      {/* Respuesta en streaming o finalizada */}
      {(state === 'streaming' || state === 'done') && text && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-200 bg-violet-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-800">
              <SparkleIcon />
              Tutor IA — Explicación personalizada
              {state === 'streaming' && (
                <span className="inline-block w-2 h-4 bg-violet-500 rounded-sm animate-pulse ml-1" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {state === 'streaming' && (
                <button
                  onClick={handleCancel}
                  className="text-xs text-violet-600 hover:text-violet-800 underline"
                >
                  Detener
                </button>
              )}
              {state === 'done' && (
                <button
                  onClick={handleReset}
                  className="text-xs text-violet-500 hover:text-violet-700 transition-colors"
                  title="Cerrar explicación"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Texto del tutor */}
          <div
            ref={textareaRef}
            className="px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto"
          >
            {state === 'streaming' ? (
              <span className="whitespace-pre-wrap">{text}<span className="inline-block w-1.5 h-4 bg-violet-500 rounded-sm animate-pulse align-text-bottom ml-0.5" /></span>
            ) : (
              <MarkdownText text={text} />
            )}
          </div>

          {/* Footer con botón de reintentar */}
          {state === 'done' && (
            <div className="px-4 py-2 border-t border-violet-200 flex justify-end">
              <button
                onClick={handleAsk}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Nueva explicación
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">No se pudo obtener la explicación</p>
              <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium underline"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}
