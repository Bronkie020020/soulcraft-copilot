# Soulcraft SoundCloud Copilot Engine & Production Studio Suite (v9.0)

Production-grade, fail-safe AI copilot and DJ suite for generating SoundCloud mix metadata, SEO tags, tracklist structuring, 1:1 Midjourney/Imagen artwork prompts, BPM-Dex cue points, Camelot harmonic guidance, and Lexicon DJ Ultimate library automation.

## Features

- **Strict Structured Outputs:** Powered by LangChain and Zod schema validation.
- **Underground DJ / Producer Persona:** Curated for Chicago House, Funky House, Tech House, Deep House, Jackin House, and Techno.
- **Audio-Visual Synergy:** Automated 1:1 Midjourney / Imagen prompt crafting with photographic and architectural aesthetics.
- **SEO & Discovery:** Optimized tags, punchy club-tested titles, tracklists, and actionable release strategies.
- **BPM-Dex & Mixed-in-Key Grade Engine:** Automated 5 hot cues on waveform, 1-10 energy ratings, and Camelot Wheel harmonic transitions.
- **Universal DJ Library Export:** Pioneer Rekordbox XML with embedded `<POSITION_MARK>` cues, Denon Engine DJ, and M3U8 exports.
- **Ultimate DJ Prompt Creator:** Lexicon DJ Ultimate & UPC architecture for cross-platform library migrations, tag cleanup, audio fingerprint duplicate detection, and 8-point smart cues.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Ensure `GEMINI_API_KEY` is populated with a valid Google Gemini API key.

### 3. Run Studio Web App & Fastify API

```bash
npm run dev
```

### 4. Run Tests

```bash
npm run test
```

### 5. Build Project

```bash
npm run build
```

