# Soulcraft SoundCloud Copilot Engine (v1.0)

Production-grade, fail-safe AI copilot for generating SoundCloud mix metadata, SEO tags, tracklist structuring, and 1:1 Midjourney/Imagen artwork prompts.

## Features
- **Strict Structured Outputs:** Powered by LangChain and Zod schema validation.
- **Underground DJ / Producer Persona:** Curated for Chicago House, Funky House, Tech House, Deep House, Jackin House, and Techno.
- **Audio-Visual Synergy:** Automated 1:1 Midjourney / Imagen prompt crafting with photographic and architectural aesthetics.
- **SEO & Discovery:** Optimized tags, punchy club-tested titles, tracklists, and actionable release strategies.

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

### 3. Run CLI Test / Verification
```bash
npm run test:cli
```

### 4. Run Tests
```bash
npm run test
```

### 5. Build Project
```bash
npm run build
```
