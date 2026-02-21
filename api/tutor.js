/**
 * Vercel Edge Function — Proxy para GitHub Models API
 *
 * El GITHUB_TOKEN vive SOLO aquí (variable de entorno del servidor).
 * El cliente nunca lo ve. Acepta el array de messages del frontend
 * y hace streaming de la respuesta de vuelta al browser tal cual.
 */

export const config = { runtime: 'edge' }

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions'
const MODEL = 'gpt-4o-mini'

export default async function handler(req) {
  // Solo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Token servidor
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error('[tutor] GITHUB_TOKEN no configurado en variables de entorno de Vercel')
    return new Response(
      JSON.stringify({ error: 'El servidor no tiene GITHUB_TOKEN configurado. Agrégalo en Vercel → Settings → Environment Variables.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Parsear body
  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages } = body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Campo "messages" requerido (array)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Llamar a GitHub Models con streaming
  let upstream
  try {
    upstream = await fetch(GITHUB_MODELS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.6,
        max_tokens: 900,
        messages,
      }),
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: `Error conectando a GitHub Models: ${err.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => upstream.statusText)
    return new Response(
      JSON.stringify({ error: `GitHub Models error ${upstream.status}: ${errText}` }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Pipe del stream SSE directamente al cliente
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
