import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// 1. TUS CREDENCIALES SECRETAS
const supabaseUrl = 'https://abjgtqmbehkhbttplmfd.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiamd0cW1iZWhraGJ0dHBsbWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY5NTU3MywiZXhwIjoyMDg3MjcxNTczfQ.jaQRej8TQH3G4fLrrfoyFNBaW3tOHcFBl4Z9N407kSY' 
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 2. CONFIGURACIÓN DEL ARCHIVO QUE VAS A SUBIR
const ARCHIVO_JSON = './datos_crudos/semana_5_biologia.json' // La ruta de tu archivo

// 3. LOS IDs EXACTOS (Cámbialos según lo que estés subiendo)
// Si en tu tabla 'semanas', la Semana 5 tiene el ID 1:
const ID_SEMANA = 4  
// Si en tu tabla 'cursos', Biología tiene el ID 9:
const ID_CURSO = 10   

async function subirPreguntas() {
  console.log(`Leyendo archivo: ${ARCHIVO_JSON}...`)
  
  try {
    // Leer el archivo local
    const dataCruda = fs.readFileSync(ARCHIVO_JSON, 'utf8')
    const arrayPreguntas = JSON.parse(dataCruda)

    console.log(`Encontradas ${arrayPreguntas.length} preguntas. Preparando inyección...`)

    // Mapear los datos para agregar los IDs y que coincidan con tu SQL
    const datosListosParaSubir = arrayPreguntas.map(p => ({
      semana_id: ID_SEMANA,
      curso_id: ID_CURSO,
      texto_pregunta: p.texto_pregunta,
      opcion_a: p.opcion_a,
      opcion_b: p.opcion_b,
      opcion_c: p.opcion_c,
      opcion_d: p.opcion_d,
      opcion_e: p.opcion_e,
      clave_oficial: p.clave_oficial,
      clave_corregida: p.clave_corregida,
      hay_error_oficial: p.hay_error_oficial,
      explicacion_paso_a_paso: p.explicacion_paso_a_paso
    }))

    // Inyectar a la tabla 'preguntas'
    const { data, error } = await supabase
      .from('preguntas')
      .insert(datosListosParaSubir)

    if (error) {
      console.error('❌ Error de Supabase:', error.message)
    } else {
      console.log('✅ ¡Éxito! Base de datos actualizada correctamente.')
    }

  } catch (error) {
    console.error('❌ Error al leer el archivo local:', error.message)
  }
}

subirPreguntas()