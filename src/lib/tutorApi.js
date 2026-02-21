/**
 * tutorApi.js
 *
 * Llama a /api/tutor (Vercel Edge Function) que hace de proxy seguro.
 * El GITHUB_TOKEN NUNCA sale del servidor — este archivo no lo usa.
 *
 * Para desarrollo local con las API routes activas:
 *   npx vercel dev
 *
 * Para desarrollo local SIN API routes (solo UI):
 *   npm run dev  (el botón mostrará error hasta que haya un servidor Vercel)
 */

const TUTOR_ENDPOINT = '/api/tutor'

/**
 * Construye el array de messages para el LLM a partir del detalle de la pregunta.
 * @param {Object} detail - objeto detail de scoreAttempt()
 * @returns {Array} messages OpenAI-compatible
 */
function buildMessages(detail) {
  const { question, userAnswer, claveCorregida, claveOficial, hayError } = detail

  const opts = [
    { k: 'A', t: question.opcion_a },
    { k: 'B', t: question.opcion_b },
    { k: 'C', t: question.opcion_c },
    { k: 'D', t: question.opcion_d },
    { k: 'E', t: question.opcion_e },
  ]

  const getOptionText = (key) => opts.find((o) => o.k === key)?.t || key

  const opciones = opts
    .filter((o) => o.t)
    .map((o) => `${o.k}) ${o.t}`)
    .join('\n')

  const systemPrompt = `Eres un profesor preuniversitario experto de la academia CEPREVAL (Universidad Nacional Hermilio Valdizan - UNHEVAL). Tu mision es ayudar a los alumnos a entender sus errores en los simulacros de examen de manera clara, amable y didactica. Nunca reganes al alumno. Usa un tono motivador y cercano. Si la pregunta implica calculos, muestra los pasos matematicos numerados. Si es conceptual, explica el concepto clave y luego aplicalo a la pregunta. Responde siempre en espanol.

FORMATO OBLIGATORIO: Responde en texto plano. PROHIBIDO usar asteriscos (*), dobles asteriscos (**), almohadillas (#), guiones bajos (_) o cualquier simbolo de formato markdown. Para listas usa solo numeros: 1. Paso uno. Para enfasis usa MAYUSCULAS. Separa secciones con linea vacia. El texto debe verse bien sin ningun procesamiento adicional.`

  const notaError = hayError
    ? `\nIMPORTANTE: El solucionario oficial de la academia tenia un error tipografico (indicaba la clave ${claveOficial}), pero la respuesta verdadera es ${claveCorregida}. Menciona esto brevemente si es relevante para la explicacion.`
    : ''

  const userPrompt = `Mi alumno acaba de fallar esta pregunta en el simulacro de examen de la CEPREVAL:

PREGUNTA:
${question.texto_pregunta}

OPCIONES:
${opciones}

El alumno marco: ${userAnswer || '(no respondio)'})${userAnswer ? ' ' + getOptionText(userAnswer) : ''}
La respuesta correcta es: ${claveCorregida}) ${getOptionText(claveCorregida)}${notaError}

Explicale paso a paso por que su respuesta${userAnswer ? ` (${userAnswer})` : ''} es incorrecta y cual es el razonamiento correcto para llegar a la respuesta ${claveCorregida}. Se conciso pero completo.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

/**
 * Llama a /api/tutor y retorna un ReadableStream de texto (tokens del LLM).
 * @param {Object} detail - detalle de la pregunta (de scoreAttempt)
 * @param {AbortSignal} signal - para cancelar
 * @returns {ReadableStream}
 */
export function streamTutorExplanation(detail, signal) {
  const messages = buildMessages(detail)

  return new ReadableStream({
    async start(controller) {
      let response
      try {
        response = await fetch(TUTOR_ENDPOINT, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        })
      } catch (err) {
        controller.error(err)
        return
      }

      if (!response.ok) {
        let errMsg = `Error ${response.status}`
        try {
          const data = await response.json()
          errMsg = data.error || errMsg
        } catch {
          errMsg = await response.text().catch(() => errMsg)
        }
        controller.error(new Error(errMsg))
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') {
              controller.close()
              return
            }
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) controller.enqueue(content)
            } catch {
              // chunk incompleto
            }
          }
        }
      } catch (err) {
        controller.error(err)
        return
      }

      controller.close()
    },
  })
}
