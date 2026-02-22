# CEPREVAL — Simulador de Exámenes UNHEVAL

Aplicación web para simular exámenes de la academia preuniversitaria CEPREVAL (UNHEVAL).
Stack: **React + Vite · Tailwind CSS · React Router DOM v7 · Supabase · Vercel**

---

## Stack y decisiones de arquitectura

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React + Vite (JS, sin TypeScript) | Sin librerías UI externas |
| Estilos | Tailwind CSS | PostCSS + autoprefixer |
| Routing | React Router DOM v7 | SPA, rutas en `src/App.jsx` |
| Base de datos | Supabase (PostgreSQL) | Cliente `@supabase/supabase-js` |
| Deploy | Vercel | `framework: "vite"` en vercel.json |
| IA Tutor | GitHub Models API (gpt-4o-mini) | Proxy Edge Function server-side |

---

## Estructura de la base de datos (Supabase)

```
semanas
  id            int PK
  nombre        text        -- "Semana 5"
  numero_semana int         -- 0 = solo mostrar nombre (sin número)
  modulo        text        -- "Examen de Admisión"
  ciclo         text        -- "Ciclo I", "Ciclo II", etc.

cursos
  id            int PK
  nombre        text        -- "Matemáticas", "Inglés", etc.
  semana_id     int FK → semanas.id

preguntas
  id                      int PK
  semana_id               int FK → semanas.id
  curso_id                int FK → cursos.id
  texto_pregunta          text
  opcion_a … opcion_e     text
  clave_oficial           text    -- puede ser "-" si hay error
  clave_corregida         text    -- siempre se usa esta para calificar
  hay_error_oficial       bool
  explicacion_paso_a_paso text
```

---

## Estructura de archivos

```
src/
  pages/
    DashboardSemanal.jsx    -- Selector 3 pasos: ciclo → módulo → cursos
    MotorSimulador.jsx      -- Motor del examen con timer
    ResultadosFeedback.jsx  -- Resultados al finalizar
  components/
    Layout.jsx              -- Wrapper con navbar
    QuestionCard.jsx        -- Tarjeta de pregunta durante el examen
    QuestionText.jsx        -- Parser de texto con \n, ítems y contexto
    ResultCard.jsx          -- Tarjeta de resultado por pregunta
    TutorIA.jsx             -- Componente "¿Por qué me equivoqué?" con streaming
    MarkdownText.jsx        -- Renderer de markdown para respuestas del tutor
    Timer.jsx               -- Cronómetro regresivo H:MM:SS
  lib/
    supabaseClient.js       -- Cliente Supabase + checkEnvVars()
    tutorApi.js             -- Llama a /api/tutor (nunca expone el token)
  utils/
    scoring.js              -- scoreAttempt(questions, answersById)
    storage.js              -- saveSession / loadSession / clearSession
api/
  tutor.js                  -- Vercel Edge Function proxy → GitHub Models API
```

---

## Páginas y flujo

### 1. DashboardSemanal (`/`)
Selector en 3 pasos:
1. **Ciclo** — botones deduplicados de `semanas.ciclo`
2. **Módulo** — `<select>` filtrado por ciclo; `numero_semana=0` muestra solo nombre
3. **Cursos** — toggle buttons; deshabilita cursos sin preguntas en la semana elegida
   - Botones auxiliares: Todos / Ninguno / Aleatorio
   - Badge contador de cursos seleccionados

Navega a `/simulador` con `state: { semanaId, cursoIds: string[] }`.

### 2. MotorSimulador (`/simulador`)
- Restaura sesión desde router state o sessionStorage (backward compat con `cursoId` string)
- Fetch paralelo: preguntas (`.in('curso_id', cIds)`) + nombres de cursos
- Enriquece cada pregunta con `curso_nombre` antes de guardar en estado
- Timer: `108 s/pregunta` → 3 h para 100 preguntas
- Panel lateral de navegación (desktop) + navegación móvil
- Persiste en sessionStorage en cada cambio para sobrevivir recargas

### 3. ResultadosFeedback (`/resultados`)
- Recibe `{ questions, answersById, autoFinished }` via router state
- Calcula puntuación con `scoreAttempt()`
- Muestra resumen (correctas / incorrectas / sin responder)
- `ResultCard` por pregunta con TutorIA en respuestas incorrectas

---

## Lógica de calificación (`scoring.js`)

```js
scoreAttempt(questions, answersById)
// - Siempre califica contra clave_corregida (no clave_oficial)
// - Si hay_error_oficial=true → mensaje especial en el resultado
// - Normaliza claves a mayúsculas
// - Retorna: { results, correctCount, incorrectCount, unansweredCount, score }
```

---

## Tutor IA

Arquitectura de seguridad:
```
Browser → /api/tutor (Edge Function) → GitHub Models API
              ↑ lee GITHUB_TOKEN desde process.env (server-side)
              ↑ nunca llega al bundle de JS del cliente
```

- `tutorApi.js` — construye los mensajes y retorna un `ReadableStream` parseando SSE
- `api/tutor.js` — Edge Function que hace proxy directo (`upstream.body` → response)
- `TutorIA.jsx` — estados: `idle → loading → streaming → done | error`
- Durante streaming: texto crudo con `whitespace-pre-wrap` + cursor parpadeante
- Al completar: renderizado con `<MarkdownText>` (bold, italic, listas)
- System prompt: instruye al modelo a NO usar markdown (doble capa de protección)

---

## QuestionText — renderizado estructurado

Componente que parsea el campo `texto_pregunta` con `\n` reales del JSON:

| Patrón detectado | Renderizado |
|---|---|
| `I.` / `II.` / `III.` | Ítem con etiqueta azul y sangría |
| `a.` / `b.` / `a)` | Ítem con etiqueta azul y sangría |
| `1.` / `2.` | Ítem numerado con sangría |
| `[texto entre corchetes]` | Bloque de contexto gris/azul itálico |
| Línea vacía | Separador de 6px |
| Texto normal | Párrafo |

Soporta `theme="dark"` (sobre fondo azul en QuestionCard) y `theme="light"` (sobre blanco en ResultCard).

**Prompt para formatear JSONs sin `\n`** — pegar en Claude/ChatGPT:
```
Eres un editor de texto académico. Formatea el campo "texto_pregunta" de
un JSON de preguntas de examen universitario peruano (CEPREVAL - UNHEVAL),
agregando saltos de línea (\n) donde corresponda:

1. Después de la instrucción inicial, antes de ítems numerados/letrados.
2. Ítems I. II. III. IV. V. → cada uno en su propia línea con \n previo.
3. Ítems a. b. c. d. / a) b) c) → igual, \n antes de cada uno.
4. Ítems 1. 2. 3. → igual.
5. Si hay texto de lectura + preguntas, sepáralos con \n.
6. Datos tabulares → envuélvelos en [corchetes].
7. NO cambies contenido. NO modifiques opcion_a…e, claves, hay_error_oficial.
8. En explicacion_paso_a_paso con pasos I. II. etc., también agrégales \n.
Devuelve solo JSON válido. Procesar de a 10-20 preguntas por vez.
```

---

## Timer

- `108 s/pregunta` (3 h / 100 preguntas = 10 800 s)
- Display: `H:MM:SS` cuando hay horas, `MM:SS` cuando < 1 hora
- Ámbar: ≤ 10 min restantes
- Rojo + pulso: ≤ 5 min restantes
- Auto-finaliza el examen al llegar a 0

---

## Variables de entorno

```env
# .env.local (NO commitear)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
GITHUB_TOKEN=ghp_...        # SIN prefijo VITE_ — solo server-side
```

En Vercel: configurar las mismas tres variables en Settings → Environment Variables.

---

## Deploy

```bash
# Desarrollo local (con API routes)
vercel dev

# Deploy a producción
git push origin main        # Vercel despliega automáticamente
```

`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [{ "source": "/api/(.*)", "headers": [{ "key": "Cache-Control", "value": "no-store" }] }]
}
```

> **Nota:** No usar `rewrites` en vercel.json — causa error `vite:import-analysis` en `vercel dev`. `framework: "vite"` maneja el routing SPA automáticamente.

---

## Historial de cambios relevantes

### Setup inicial
- Proyecto creado manualmente (directorio no vacío impedía `npm create vite`)
- Instalación: `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `tailwindcss`, `autoprefixer`, `postcss`

### Tutor IA
- Token `GITHUB_TOKEN` movido a server-side (era `VITE_GITHUB_TOKEN` y se exponía en el bundle)
- Edge Function como proxy directo — pipe de `upstream.body` sin reconstruir SSE

### Multi-curso
- `DashboardSemanal`: selector toggle con `cursosDisponibles` (Set desde query a `preguntas`)
- `MotorSimulador`: `.in('curso_id', cIds)` + fetch paralelo de nombres de cursos
- Backward compat: si session/state trae `cursoId` string, se convierte a `[cursoId]`

### UX preguntas
- `QuestionCard`: etiqueta de curso destacada encima del texto de pregunta
- `QuestionText`: parser de `\n` + ítems romanos/alfa/numéricos + contexto `[...]`
- Aplicado también en `ResultCard` (theme light)

### Timer
- `SECONDS_PER_QUESTION`: 90 → 108 (3 h exactas para 100 preguntas)
- Display: `H:MM:SS` / umbrales ámbar ≤10 min, rojo ≤5 min

### Errores resueltos
| Error | Causa | Solución |
|---|---|---|
| `vite:import-analysis` en `vercel dev` | Carácter Unicode `–` en `index.html` | Reemplazar con `&ndash;` |
| `vite:import-analysis` persistía | `rewrites` en vercel.json enrutaba HTML por Vite | Eliminar `rewrites` completamente |
| LLM devolvía markdown con `**` | Sin instrucción explícita | System prompt + `MarkdownText.jsx` |
| `VITE_GITHUB_TOKEN` en bundle | Prefijo `VITE_` expone la var al cliente | Renombrar a `GITHUB_TOKEN`, mover a Edge Function |

---

## Repositorio

`https://github.com/benja902/cepre.git`
Rama principal: `main`
Deploy: Vercel (auto-deploy en push a main)
