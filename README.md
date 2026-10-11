# LOOK AGAIN — Open-Source AI Outdoor Attention Companion

> *"There's more around you than you notice."*  
> Built for the **Touch Grass** hackathon theme: open-weight AI that gets people outdoors, where the screen is the shortest part of the experience.

---

## 1. What is LOOK AGAIN?

Most people move through their everyday neighborhoods, parks, and campuses without remembering much of what was right in front of them. **LOOK AGAIN** makes the gap visible: what you were sure you saw versus what was actually there.

- **Phone away first:** You get one single, clear observation focus for a 5, 10, or 15-minute walk. Then your phone goes into your pocket.
- **Memory meets reality:** When the calm timer finishes, you answer hidden check questions strictly from memory with your back turned. Then you turn around and physically look again. You are the judge.
- **Zero surveillance or scoreboards:** No cameras, no computer vision, no species identification quizzes, no strangers/people-watching, no streaks, points, or percentage scores.
- **100% Private Field Journal:** All entries stay on your device in local storage. Open-weight AI running locally on your CPU synthesizes your reflections and highlights long-term observation tendencies across sessions.
- **Field Stories (fiction):** Each saved walk can unlock one short, gentle chapter of a quiet mystery *inspired by your real observations*. Clearly labeled **"Fiction inspired by your walk"** and kept separate from your factual journal summary. Written by the local model only.
- **Echo:** The next day, test what still remains of a previous walk. Echo shows only the context (date, setting, time), never your old notes, then sorts your new memory against the saved entry — a private memory check, not a score.

---

## 2. Open-Weight Model & Architecture

- **Default Model:** `qwen3:4b` (Apache 2.0 License, developed by Alibaba Qwen Team)
- **Local Engine:** [Ollama](https://ollama.com/) at `OLLAMA_URL` — defaults to localhost (`http://localhost:11434`), so by default nothing leaves your machine
- **Backend:** Node.js + Express (serving API & proxying Ollama behind `0.0.0.0:3000`)
- **Frontend:** React + Vite + Tailwind CSS (mobile-first responsive web app)
- **Storage:** browser `localStorage` only (no cloud database, no IndexedDB)

---

## 3. Quick Start Guide

### Step 1: Install Ollama

#### Windows:
1. Download the Windows installer from [ollama.com/download/windows](https://ollama.com/download/windows).
2. Run the installer `.exe`.
3. Open Windows PowerShell or Command Prompt.

#### macOS:
```bash
brew install ollama
# Or download directly from ollama.com
```

#### Linux:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

### Step 2: Pull & Run the Open-Weight Model

In PowerShell or your terminal, pull the model once (this downloads it):
```bash
ollama pull qwen3:4b
```
To chat with it manually or preload it into memory, run:
```bash
ollama run qwen3:4b
```
- **License:** Apache 2.0
- **Size:** ~2.5 GB
- **Hardware Requirement:** Runs smoothly on CPU without a dedicated GPU.
- **Parameters:** `think: false`, low temperature (`0.3`), and JSON schema formatting are enforced automatically by LOOK AGAIN.

---

### Step 3: Run the Application

From the project directory (PowerShell or terminal):

```powershell
# Install dependencies
npm install

# Start the full-stack server (Express API + Vite middleware on the same port)
npm run dev
```

Open your browser to:
```
http://localhost:3000
```

To run the production build instead (serves the built frontend and `/api` from one port):

```powershell
npm run start:prod
```

`start:prod` builds the frontend and starts the server with `NODE_ENV=production`. It is written as a small Node script so it works unchanged in Windows PowerShell, Command Prompt, macOS, and Linux.

---

## 4. Phone Demo Over Local Wi-Fi

Because the Express server binds to `0.0.0.0:3000`, you can access LOOK AGAIN directly on your mobile device on the same local Wi-Fi network without exposing Ollama directly to the outside network.

1. Find your computer's local IP address:
   - **Windows:** Run `ipconfig` (look for `IPv4 Address`, e.g. `192.168.1.45`)
   - **macOS / Linux:** Run `ifconfig` or `ip a`
2. On your smartphone's browser (Safari or Chrome), navigate to:
   ```
   http://192.168.1.45:3000
   ```
3. Tap **"Begin noticing"**, select your time, generate or pick a pack, and tap **"Save pack and go outside"**.
4. Put the phone in your pocket and step outside!

---

## 5. Works Without Ollama vs. Needs Local Ollama

The app itself is served by the Express server over the network (there is no offline app shell or service worker). The table below describes what still works when Ollama is not running.

| Feature | Works Without Ollama (on this device) | Needs Local Ollama (`qwen3:4b`) |
| :--- | :---: | :---: |
| **Observation Walk Timers & Chime** | ✅ Yes (runs in background) | ❌ No |
| **Curated Preset Pack Library** | ✅ Yes (instant, deterministic) | ❌ No |
| **Hidden Check Questions & Memory Recall** | ✅ Yes | ❌ No |
| **Look Again Reality Verification** | ✅ Yes | ❌ No |
| **Field Journal Local Storage & Edits** | ✅ Yes (stays in browser) | ❌ No |
| **Readable Export (.txt)** | ✅ Yes | ❌ No |
| **Dynamic Generative Walk Packs** | ❌ Offline fallback available | ✅ Yes |
| **Field Note Synthesis & Tendencies Note** | ❌ Deterministic local summary | ✅ Yes |
| **Field Stories chapter (fiction)** | ❌ Queued on-device until AI returns | ✅ Yes |
| **Echo next-day memory sort** | ✅ Manual tap-through fallback | ✅ Yes |

> **Note:** If Ollama is offline or unavailable, LOOK AGAIN immediately allows choosing from its curated library of preset missions and synthesizes journal entries using a deterministic local fallback. It never claims AI succeeded when it did not. A pending Field Stories chapter is queued on your device and written once the local AI is available — never faked; and an Echo falls back to a plain manual view instead of pretending the AI sorted anything.

### Exporting your journal

- **Export** writes a readable plain-text copy (`look-again-field-journal-YYYY-MM-DD.txt`, UTF-8) of all walks in chronological order, including each walk's prompt, recall, memory checks, surprises, reflections, AI summary, Echo results, and the Field Stories chapters — formatted for a human to read, with no JSON.
- **There is no Import.** Data is stored only in this browser, so clearing your browser data (or "Clear All" in the app) deletes it permanently and irreversibly.

---

## 6. Field Stories & Echo

### Field Stories (fiction inspired by your walk)

- **Strict unlock rule:** a chapter can only be generated *after a walk is fully completed and saved to the journal*. One saved entry unlocks exactly one chapter, and the next chapter cannot be written until another walk is saved. Nothing story-related is visible or reachable before the first saved entry.
- **Where you see it:** the newest chapter appears on the post-save screen, and a **"Story so far"** section appears inside the Journal once at least one chapter exists. There is no Story link in the Home header.
- **Local model only:** story input contains your own words, so it is sent **only** to the local Ollama proxy (`/api/story`), never to a hosted provider. The model receives a handful of your short observations, a running synopsis (max ~120 words), and the last chapter's final line — never your whole journal.
- **Labeled clearly:** every chapter is marked **"Fiction inspired by your walk"** and is never mixed into your factual journal summary. Content stays gentle — a quiet mystery whose clues are your real observations; no scary, violent, or sexual content, no real people, no encouraging trespassing or risk.
- **Background & resilient:** because the model runs on a CPU, writing can take a minute or two. The app shows a calm "Writing your chapter…" state and continues in the background; the pending state is persisted so a refresh does not lose it, and a **Retry** button appears if it fails. If Ollama is unavailable, the chapter is queued and written when the local AI returns (no preset or fake chapter, ever).
- **Storage:** chapters live in on-device storage (localStorage) and link to the journal entry that unlocked them. **Delete all data** also removes stories. Deleting a single entry leaves its chapter intact.

### Echo (next-day memory test)

- **Eligibility:** Echo is offered for the most recent saved walk whose local calendar date is *before* today and which has no completed Echo yet. A walk saved today is never offered. After the very first saved walk, the post-save screen says: *"Come back tomorrow. Your first Echo will be waiting."* There are no push notifications or reminders of any kind. First-time users (no saved walks) see nothing.
- **Entry point:** when an Echo is available, Home shows a small glass-style notice ("Echo is ready: what do you still remember about your walk?") with a button. It is hidden when none is available.
- **Flow:** the Echo screen shows only the context (date, environment, time of day) — never your saved notes or answers — and asks *"What do you still remember about this walk?"* with a Skip option. After you submit, it reveals the saved entry next to your new answer and uses the **local model** (`/api/echo`) to sort items into three plain lists — **Still with you**, **Faded**, and **Only came back now** — using only what you actually wrote. No counts, percentages, grades, or scores.
- **Fallback:** if the local model is unavailable, Echo shows a manual view: your saved items side by side, and you tap each as **Still remember** or **Faded**. It never pretends the AI sorted anything.
- **Saved on the walk:** results are stored in a new **Echo** section on the journal entry, and that walk is marked done so it is never asked again. Skipped Echoes are also marked done.
- **Demo mode:** inside the **How it works** panel there is a small switch, **"Demo: pretend a day has passed."** When on, saved walks are treated as if they were made yesterday so the Echo can be demonstrated immediately. It is **off by default**, persisted, and **never** bypasses the Field Stories unlock rule.

---

## 7. Privacy & Ethics Approach

1. **Your journal stays in your browser:** Journal entries are stored only in your browser's `localStorage`. Nothing is copied to a cloud database.
2. **Where AI requests go:** Journal summaries, Field Stories, and Echo are sent from the server to the Ollama instance at `OLLAMA_URL`. It defaults to `http://localhost:11434`, which keeps everything on your own machine. If you point `OLLAMA_URL` at a remote host, that text leaves your machine — `/api/health` reports whether the endpoint is `local/private` or `remote`, and the app says so in the AI-engine dialog.
3. **No cloud models:** The app refuses to send journal-derived text to a model whose name marks it as a cloud model (a `:cloud`/`-cloud` tag). Cloud-model configuration disables summaries, Field Stories, and Echo instead of sending your notes away.
4. **No People-Watching:** Prompts focus on light, soundscapes, textures, architectural rooflines, cast shadows, and micro-cracks. Never stranger surveillance.
5. **No Photo Identification:** We do not ask users to snap photos or classify species. The human is the direct observer and the judge.
6. **No Gamification:** There are no scoreboards, streaks, percentage grades, or badges. Curiosity is its own reward.

---

## 8. Running a Public Live Demo (Tunnel)

The app can be exposed to the internet through a tunnel (for example, Cloudflare Tunnel) so judges can use the real local AI. When you do:

- **Run production mode:** `npm run start:prod` serves the built frontend and `/api` from the same origin and port, with SPA fallback to `index.html` for non-API routes.
- **Rate limiting:** `/api` is limited per IP (default 60 requests/minute; set `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`).
- **Body size limit:** request bodies are capped (default `100kb`; set `BODY_LIMIT`).
- **One generation at a time:** Ollama work is serialized. Extra requests wait in a small queue (default `AI_QUEUE_MAX=5`); beyond that, clients receive a friendly "The local AI is busy, try again in a minute." message and the UI offers a retry while keeping your data intact.
- **CORS:** only same-origin, localhost, and private-LAN origins are allowed by default; add more with the comma-separated `CORS_ORIGINS` env var.
- **Privacy notice:** when the app is opened from a non-local hostname, a dismissible banner explains that AI runs on the developer's machine and to avoid sensitive details. It never appears on localhost.
- **Model warm-up:** the server warms the model on start and keeps it loaded (`keep_alive`) between requests.
