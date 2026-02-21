import { useEffect, useRef } from 'react'

/**
 * Timer component
 * @param {number} secondsLeft - segundos restantes
 * @param {function} onTick - llamado cada segundo con (secondsLeft - 1)
 * @param {boolean} active - si el timer está corriendo
 */
export default function Timer({ secondsLeft, onTick, active }) {
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!active) return
    if (secondsLeft <= 0) return

    intervalRef.current = setInterval(() => {
      onTick((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [active])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const pct = secondsLeft
  const isLow = secondsLeft <= 60
  const isCritical = secondsLeft <= 30

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-semibold border transition-colors ${
      isCritical
        ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
        : isLow
        ? 'bg-amber-50 border-amber-300 text-amber-700'
        : 'bg-blue-50 border-blue-200 text-blue-700'
    }`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {display}
    </div>
  )
}
