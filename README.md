# Habla con la Máquina — Chat con la API de Groq

Prototipo de interfaz de chat conectada a un modelo de lenguaje real (Groq),
construido en Next.js. Prioriza que los datos de consumo (tokens, tiempo de
respuesta, tokens/segundo) sean precisos y visibles, por sobre el pulido
visual — así lo pidió el tech lead.

## Qué incluye

- Chat funcional (`app/page.js`) que persiste el historial en `localStorage`
  — sobrevive un refresh de página.
- Ruta de servidor (`app/api/chat/route.js`) que llama a Groq desde el
  backend, así la API key nunca llega al navegador.
- Panel lateral con:
  - Tokens de prompt, de completado y totales acumulados en la sesión.
  - Modelo usado, tiempo de respuesta y tokens por segundo de la última
    respuesta (métrica adicional requerida por el brief).

## 1. Diseño de referencia con Google Stitch

Antes de tocar código, generá una referencia visual en
[stitch.withgoogle.com](https://stitch.withgoogle.com/):

1. Describe la interfaz, por ejemplo: *"una interfaz de chat con panel de
   historial de mensajes y una barra lateral con estadísticas de consumo de
   tokens"*.
2. Guardá las capturas del diseño generado — usalas como referencia, no
   como producto final. Este repo ya tiene una implementación funcional en
   `app/page.js` y `app/globals.css`; podés ajustar esos estilos para
   acercarlos a lo que generó Stitch.

## 2. Cuenta y API key de Groq

1. Creá una cuenta en [console.groq.com](https://console.groq.com/).
2. Generá una API key en **API Keys** del dashboard.
3. Copiá `.env.local.example` a `.env.local` y pegá tu key:

```bash
cp .env.local.example .env.local
```

```
GROQ_API_KEY=gsk_tu_key_aqui
GROQ_MODEL=llama-3.1-8b-instant
```

`.env.local` ya está en `.gitignore` — nunca se sube a GitHub.

> **Nota sobre el modelo**: los "Llama 3" originales (`llama3-8b-8192`) ya
> fueron dados de baja por Groq. `llama-3.1-8b-instant` es la versión de la
> familia Llama 3.x actualmente disponible en el plan gratuito, pero Groq
> anunció su baja para el 16/08/2026 (reemplazo: `openai/gpt-oss-20b`). Si
> deja de responder, cambiá solo el valor de `GROQ_MODEL` en `.env.local`.

## 3. Repositorio y Codespaces

```bash
git init
git add .
git commit -m "chat prototype con Groq"
gh repo create tu-usuario/groq-chat-prototype --public --source=. --push
```

Luego abre el repo en GitHub → botón **Code** → **Codespaces** → **Create
codespace on main**. Dentro del Codespace, agregá tu `.env.local` (no está
en el repo por seguridad) antes de correr el proyecto.

## 4. Correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 5. Cómo funciona el flujo de datos

1. El cliente (`app/page.js`) manda **todo el historial de mensajes** en
   cada request — el servidor de Groq es sin estado, no recuerda
   conversaciones anteriores (mismo principio del patrón "Complete
   Backpack" visto en clase).
2. La ruta `/api/chat` agrega el header `Authorization: Bearer <GROQ_API_KEY>`
   del lado del servidor y llama a Groq.
3. Groq devuelve la respuesta junto a un objeto `usage` con
   `prompt_tokens`, `completion_tokens`, `total_tokens` y tiempos de
   procesamiento.
4. El servidor calcula tokens/segundo (`completion_tokens / completion_time`)
   y se lo devuelve al cliente junto con la respuesta.
5. El cliente acumula los tokens de la sesión y guarda todo en
   `localStorage`, así el estado sobrevive un refresh.

## Estructura

```
app/
  api/chat/route.js   → llamada server-side a Groq (Bearer token oculto)
  layout.js
  page.js             → interfaz de chat + panel de métricas
  globals.css
.env.local.example
```
