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
| **JSON Export & Import** | ✅ Yes | ❌ No |
| **Dynamic Generative Walk Packs** | ❌ Offline fallback available | ✅ Yes |
| **Field Note Synthesis & Tendencies Note** | ❌ Deterministic local summary | ✅ Yes |

> **Note:** If Ollama is offline or unavailable, LOOK AGAIN immediately allows choosing from its curated library of preset missions and synthesizes journal entries using a deterministic local fallback. It never claims AI succeeded when it did not.

---

## 6. Privacy & Ethics Approach

1. **No External APIs or Cloud Models:** Your journal entries are your unfiltered thoughts and observations. They never leave your device.
2. **No People-Watching:** Prompts focus on light, soundscapes, textures, architectural rooflines, cast shadows, and micro-cracks. Never stranger surveillance.
3. **No Photo Identification:** We do not ask users to snap photos or classify species. The human is the direct observer and the judge.
4. **No Gamification:** There are no scoreboards, streaks, percentage grades, or badges. Curiosity is its own reward.

---

## 7. Why Open-Weight Models Matter Here

1. **Private Field Journal:** Notes of personal observation and memory should never be uploaded to third-party cloud LLM providers where they could be logged or used for advertising profiles.
2. **Zero Running Cost:** No paid API keys, monthly credit card bills, or rate limits.
3. **Adapts Locally:** The open-weight model runs on the user's personal hardware and uses only recent local category history to avoid repeating recent missions.
4. **Swappable Models:** You can easily swap `OLLAMA_MODEL` in `.env` to any other open-weight model (e.g. `llama3.2:3b`, `mistral`, `phi4`).

---

## 8. Two-Minute Demo Script

- **[0:00 - 0:20] The Philosophy:**  
  *"We walk through our neighborhoods glued to screens, barely remembering what was overhead or underfoot. LOOK AGAIN is an outdoor attention companion for the Touch Grass theme: the screen is the shortest part of the experience."*

- **[0:20 - 0:45] Generating the Mission:**  
  *Open the app on laptop or phone over local Wi-Fi. Click 'Begin noticing'. Pick 5 minutes, 'Street / Neighborhood', and 'Above eye level'. Click 'Generate with Local Ollama'. Show the generated prompt: 'Look only above head height at rooflines, wires, and tree canopies.' Explain that 4 check questions are prepared and sealed.*

- **[0:45 - 1:15] Stepping Outside (The Look Phase):**  
  *Click 'Save pack and go outside'. The full-screen calm timer begins with 'Put your phone in your pocket.' Lock phone or let timer tick down. Mention that the screen does not need to stay open. Gentle bell rings.*

- **[1:15 - 1:35] Recall vs. Reality (Look Again):**  
  *Stand with back turned. Type immediate memory notes. Open the check questions: 'What was the highest man-made object?' Answer from memory. Then turn around to 'Look Again'! Mark Right / Wrong / Never noticed. Experience the genuine surprise of what was missed.*

- **[1:35 - 2:00] The Private Field Journal:**  
  *Click 'Unpack & Save'. The local Qwen 3:4B model writes a concise journal entry in the user's exact words, plus a gentle non-numeric tendencies note ('You consistently caught details above eye level, but missed ambient sounds.'). Show the saved entry in the private offline journal.*
