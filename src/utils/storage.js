const SESSION_KEY = 'cepreval_simulador'

export function saveSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // sessionStorage no disponible (ej. incognito en algunos browsers)
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // noop
  }
}
