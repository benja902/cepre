import { useEffect, useRef } from 'react'

export default function Timer({ secondsLeft, onTick, active }) {
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!active) return
    if (secondsLeft <= 0) return
    intervalRef.current = setInterval(() => {
      onTick((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [active])

  const hours   = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  const display = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const isLow      = secondsLeft <= 600
  const isCritical = secondsLeft <= 300

  const color       = isCritical ? '#FF4655' : isLow ? '#F6B73C' : '#ECE8E1'
  const borderClass = isCritical ? 'border-val-red bg-val-red-dim' : isLow ? 'border-val-gold bg-val-surface2' : 'border-val-border bg-val-surface'

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border val-clip-sm transition-colors ${borderClass}${isCritical ? ' animate-pulse' : ''}`}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-mono text-sm font-bold tracking-widest" style={{ color }}>{display}</span>
    </div>
  )
}
