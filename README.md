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
- **Local Engine:** [Ollama](https://ollama.com/) running on localhost (`http://localhost:11434`)
- **Backend:** Node.js + Express (serving API & proxying Ollama behind `0.0.0.0:3000`)
- **Frontend:** React + Vite + Tailwind CSS (mobile-first PWA)
- **Storage:** IndexedDB / LocalStorage (zero cloud transmission of private memories)

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

To run the production build instead:

```powershell
npm run build
$env:NODE_ENV="production"; npm start
```

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

## 5. Offline Capabilities vs. Needs-Ollama Matrix

| Feature | 100% Offline (Phone in Pocket) | Needs Local Ollama (`qwen3:4b`) |
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

---

## 7. Privacy & Ethics Approach

1. **No External APIs or Cloud Models:** Your journal entries are your unfiltered thoughts and observations. They never leave your device.
2. **No People-Watching:** Prompts focus on light, soundscapes, textures, architectural rooflines, cast shadows, and micro-cracks. Never stranger surveillance.
3. **No Photo Identification:** We do not ask users to snap photos or classify species. The human is the direct observer and the judge.
4. **No Gamification:** There are no scoreboards, streaks, percentage grades, or badges. Curiosity is its own reward.
