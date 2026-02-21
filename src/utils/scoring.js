/**
 * scoreAttempt
 * Califica un intento de examen usando siempre clave_corregida.
 *
 * @param {Array} questions - Array de preguntas con clave_oficial, clave_corregida, hay_error_oficial
 * @param {Object} answersById - { [questionId]: "A"|"B"|"C"|"D"|"E" }
 * @returns {Object} { correctCount, total, scorePct, details }
 */
export function scoreAttempt(questions, answersById) {
  let correctCount = 0
  const details = questions.map((q) => {
    const userRaw = answersById[q.id]
    const userAnswer = userRaw ? userRaw.trim().toUpperCase() : null
    const claveCorregida = q.clave_corregida ? q.clave_corregida.trim().toUpperCase() : null
    const claveOficial = q.clave_oficial ? q.clave_oficial.trim().toUpperCase() : null
    const hayError = Boolean(q.hay_error_oficial)

    const isCorrect = userAnswer !== null && userAnswer === claveCorregida
    if (isCorrect) correctCount++

    // Construir mensaje especial según reglas
    let specialMessage = null
    if (hayError) {
      if (isCorrect) {
        specialMessage =
          '¡Correcto! Nota: El solucionario de la academia decía la clave oficial, pero estaba equivocado. Tú tienes la razón.'
      } else if (userAnswer === claveOficial) {
        specialMessage = `Incorrecto. Marcaste la clave del solucionario de la academia (${claveOficial}), pero ese solucionario tiene un error de imprenta. La verdadera respuesta es la clave corregida (${claveCorregida}).`
      }
    }

    // Mostrar explicación si respuesta incorrecta o si marcó clave oficial errónea
    const showExplanation = !isCorrect && Boolean(q.explicacion_paso_a_paso)

    return {
      question: q,
      userAnswer,
      claveCorregida,
      claveOficial,
      hayError,
      isCorrect,
      specialMessage,
      showExplanation,
    }
  })

  const total = questions.length
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0

  return { correctCount, total, scorePct, details }
}
