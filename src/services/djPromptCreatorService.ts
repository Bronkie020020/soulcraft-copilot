import crypto from "node:crypto";
import { CuePoint } from "../types/engineDj.js";

export interface DjIntakeAnalysis {
  category: "MIGRATION" | "TAG_CLEANUP" | "AUTO_CUE_GRID" | "FULL_OVERHAUL";
  title: string;
  summary: string;
  sourceSoftware?: string;
  targetSoftware?: string;
  questions: DynamicWizardQuestion[];
}

export interface DynamicWizardQuestion {
  id: string;
  question: string;
  description: string;
  options: {
    label: string;
    value: string;
    description?: string;
  }[];
}

export interface GeneratePromptInput {
  intake: string;
  category: string;
  answers: Record<string, string>;
  selectedTracks?: string[];
}

export interface GeneratedPromptResult {
  prompt: string;
  title: string;
  executionPlan: string[];
  suggestedAction: "TAG_CLEANUP" | "KEY_CONVERSION" | "SMART_CUES" | "FULL_SYNC";
}

export interface CleanedTrackResult {
  original: string;
  cleanedArtist: string;
  cleanedTitle: string;
  fullCleaned: string;
  removedJunk: string[];
  isDuplicate?: boolean;
  duplicateHash?: string;
}

export class DjPromptCreatorService {
  /**
   * Analyseert de vrije invoer van de DJ en genereert gerichte dynamische wizard-vragen.
   */
  public static analyzeIntake(intake: string): DjIntakeAnalysis {
    const text = intake.toLowerCase();

    // 1. Detectie van software migratie
    const isMigration =
      text.includes("overstap") ||
      text.includes("migr") ||
      text.includes("serato") ||
      text.includes("rekordbox") ||
      text.includes("traktor") ||
      text.includes("engine") ||
      text.includes("virtualdj") ||
      text.includes("djay");

    // 2. Detectie van metadata / tag cleanup
    const isTagCleanup =
      text.includes("titel") ||
      text.includes("naam") ||
      text.includes("zooizootje") ||
      text.includes("opschoon") ||
      text.includes("clean") ||
      text.includes("tag") ||
      text.includes("rommel") ||
      text.includes("download") ||
      text.includes("dubbel") ||
      text.includes("duplicate");

    // 3. Detectie van cue points & beatgrid
    const isCueOrGrid =
      text.includes("cue") ||
      text.includes("hotcue") ||
      text.includes("grid") ||
      text.includes("beatgrid") ||
      text.includes("bpm") ||
      text.includes("drop") ||
      text.includes("intro");

    let category: DjIntakeAnalysis["category"] = "FULL_OVERHAUL";
    let title = "Lexicon DJ Ultimate Bibliotheek Optimalisatie";
    let summary = "Volledige bibliotheekmigratie, metadata-opschoning en 8-point smart cue integratie.";

    if (isMigration) {
      category = "MIGRATION";
      title = "Cross-Platform DJ Bibliotheek Migratie";
      summary = "Converteer playlists, hot cues, beatgrids en toonsoorten naadloos tussen DJ-software.";
    } else if (isTagCleanup && !isCueOrGrid) {
      category = "TAG_CLEANUP";
      title = "Slimme Metadata & Smart Fixes (Lexicon Stijl)";
      summary = "Verwijder download-websites, normaliseer artiest/titel tags en spoor dubbele tracks op via fingerprinting.";
    } else if (isCueOrGrid && !isTagCleanup) {
      category = "AUTO_CUE_GRID";
      title = "Automatische 8-Point Smart Cue & Beatgrid Engine";
      summary = "AI-gebaseerde plaatsing van hot cues (Intro, Verse, Chorus, Build-up, Drop 1, Breakdown, Drop 2, Outro) en BPM correctie.";
    }

    // Genereer 2 of 3 dynamische vragen afgestemd op de intake
    const questions: DynamicWizardQuestion[] = [];

    // Vraag 1: Toonsoort & Notatie
    questions.push({
      id: "key_notation",
      question: "Welke toonsoort / harmonische notatie heeft jouw voorkeur?",
      description: "Lexicon DJ converteert alle ID3 tags en cue opmerkingen automatisch.",
      options: [
        { label: "Camelot Wheel (bijv. 8A, 9B) [Aanbevolen]", value: "CAMELOT", description: "Standaard voor harmonic mixing en Denon/Rekordbox" },
        { label: "Open Key (bijv. 1d, 2m)", value: "OPEN_KEY", description: "Veelgebruikt in Traktor DJ software" },
        { label: "Klassieke Muzikale Toonsoort (bijv. A Minor, C Major)", value: "MUSICAL", description: "Traditionele muzikale standaard" }
      ]
    });

    // Vraag 2: Specifieke logica per categorie
    if (category === "MIGRATION" || category === "FULL_OVERHAUL") {
      questions.push({
        id: "source_target",
        question: "Tussen welke DJ software systemen wil je synchroniseren?",
        description: "Behoudt beatgrids, actieve loops en cue point kleurencodes.",
        options: [
          { label: "Serato DJ Pro ➔ Pioneer Rekordbox", value: "SERATO_TO_REKORDBOX", description: "Zet Serato cues om naar Rekordbox POSITION_MARK" },
          { label: "Rekordbox ➔ Denon Engine DJ (SC Live / Prime)", value: "REKORDBOX_TO_ENGINE", description: "Direct USB klaarmaken voor standalone Denon spelers" },
          { label: "Traktor Pro ➔ Pioneer Rekordbox / Engine DJ", value: "TRAKTOR_TO_UNIVERSAL", description: "Volledig NML naar XML en m3u8 conversie" },
          { label: "Universal Multi-Platform Sync (Alle platforms)", value: "ALL_PLATFORMS", description: "Universele XML + Denon Engine Library + M3U8" }
        ]
      });
    }

    if (category === "TAG_CLEANUP" || category === "FULL_OVERHAUL") {
      questions.push({
        id: "duplicate_policy",
        question: "Hoe moeten dubbele audiobestanden worden behandeld?",
        description: "Audio fingerprinting herkent identieke audio, zelfs als de bestandsnaam afwijkt.",
        options: [
          { label: "Markeer dubbele bestanden met 'DUPLICATE' tag in commentaar", value: "MARK_TAG", description: "Veilige optie: geen bestanden verwijderen" },
          { label: "Verplaats duplicaat naar een backup quarantaine-map", value: "MOVE_BACKUP", description: "Houdt de hoofdcollectie 100% uniek" },
          { label: "Alleen de hoogste bitrate (320kbps / FLAC / WAV) behouden", value: "KEEP_HIGHEST_BITRATE", description: "Automatisch audio-kwaliteitsfilter" }
        ]
      });
    }

    if (category === "AUTO_CUE_GRID" || category === "FULL_OVERHAUL") {
      questions.push({
        id: "cue_density",
        question: "Hoeveel automatische Cue Points per track wil je instellen?",
        description: "Gebaseerd op muzikale transities, drops en energieniveaus.",
        options: [
          { label: "8 Smart Cues (Intro, Verse, Chorus, Build, Drop 1, Break, Drop 2, Outro)", value: "8_CUES", description: "Maximale controle voor live performance" },
          { label: "5 Essential Cues (Intro, Drop 1, Breakdown, Drop 2, Outro)", value: "5_CUES", description: "Standaard club en festival template" },
          { label: "Quick Mix Cues (Alleen Intro + Drop + Outro)", value: "3_CUES", description: "Ideaal voor snelle radio en DJ-podcasts" }
        ]
      });
    }

    return {
      category,
      title,
      summary,
      questions
    };
  }

  /**
   * Genereert de Ultimate DJ Expert Prompt volgens UPC (Ultimate Prompt Creator) en Lexicon DJ Ultimate principes.
   */
  public static generateExpertPrompt(input: GeneratePromptInput): GeneratedPromptResult {
    const keyPref = input.answers.key_notation || "CAMELOT";
    const sourceTarget = input.answers.source_target || "SERATO_TO_REKORDBOX";
    const duplicatePref = input.answers.duplicate_policy || "MARK_TAG";
    const cuePref = input.answers.cue_density || "8_CUES";

    const promptText = `
# ROLE & EXPERT OBJECTIVE
You are the **Ultimate DJ Library Architect & Lexicon DJ Ultimate Automation Engine**.
Your mission is to execute a surgical, production-ready library optimization based on the DJ's intake:
"${input.intake.trim()}"

---

## 1. ARCHITECTURE & TARGET SPECIFICATION
- **Harmonic Key Preference:** ${keyPref} (Auto-convert all musical keys: A-Minor -> 8A, C-Major -> 8B).
- **Migration & Sync Pipeline:** ${sourceTarget}
- **Duplicate & Fingerprint Rule:** ${duplicatePref}
- **Auto-Cue Grid Resolution:** ${cuePref} (Color-coded: Intro #10b981, Drop #ef4444, Break #3b82f6, Outro #8b5cf6).

---

## 2. SURGICAL EXECUTION INSTRUCTIONS (LEXICON DJ ULTIMATE RULES)

### A. Metadata & Tag Sanitization Protocol:
1. **Strip Junk Tokens:** Remove all web URLs ("*://*", "*.com", "*.net", "*.ru", "*mp3*"), promotional prefixes ("01 - ", "02. "), and video artifacts ("[Official Video]", "(Official Audio)", "(Radio Edit)").
2. **Title/Artist Normalization:** Ensure clean "Artist - Title (Mix Name)" casing with standardized "feat." in parentheses.
3. **Genre Harmonization:** Collapse micro-subgenres into unified main club genres (e.g. Jackin House / Tech House -> Chicago House / Tech House).

### B. Hot Cue & Beatgrid Generation:
1. Detect first downbeat and align grid at 0.000 ms with fixed tempo drift correction.
2. Embed the following cue schema:
   - Cue 1 (00:00.000) [Green #10b981]: Intro Beat
   - Cue 2 (Bar 16/32) [Red #ef4444]: Drop 1 / Main Bassline
   - Cue 3 (Midtrack) [Blue #3b82f6]: Breakdown / Vocal Entry
   - Cue 4 (Climax) [Orange #f97316]: Drop 2 / Peak Re-build
   - Cue 5 (Outro -32 bars) [Purple #8b5cf6]: Outro Mix-Out Zone
3. Calculate dynamic Energy Rating (1 to 10 scale) and inject into ID3 Comments field: "Energy: [X]/10".

### C. Library Database Export:
- Output validated Pioneer Rekordbox XML with embedded <COLLECTION>, <TRACK> and <POSITION_MARK> nodes, alongside Denon Engine DJ directory structure.

---

## 3. READY-TO-EXECUTE SCRIPT / CODE SNIPPET
Execute the cleaning and sync pipeline directly through Soulcraft Studio Suite API or paste into your Lexicon DJ / Python automation batch runner.
`.trim();

    const executionPlan = [
      `1. Sanitize track titles en strip ${sourceTarget} junk tags`,
      `2. Converteer toonsoorten naar ${keyPref} notatie`,
      `3. Bepaal ${cuePref} cue points met BPM-Dex kleurencodes`,
      `4. Genereer Pioneer Rekordbox XML en M3U8 exports`
    ];

    let suggestedAction: GeneratedPromptResult["suggestedAction"] = "TAG_CLEANUP";
    if (input.category === "AUTO_CUE_GRID") suggestedAction = "SMART_CUES";
    else if (input.category === "MIGRATION") suggestedAction = "FULL_SYNC";

    return {
      prompt: promptText,
      title: "Soulcraft Ultimate DJ Prompt (Lexicon DJ Ultimate Standard)",
      executionPlan,
      suggestedAction
    };
  }

  /**
   * Module 2: Directe Tag & Metadata opschoner.
   * Verwijdert download websites, video tags en normaliseert artiest/titel.
   */
  public static cleanTrackTags(rawTracks: string[]): CleanedTrackResult[] {
    const junkPatterns = [
      /https?:\/\/\S+/gi,
      /www\.\S+/gi,
      /:\/\/\S+/gi,
      /\b(?:downloadmp3|zippyshare|beatport|traxsource|mp3va|flacmusic)\.\w+\b/gi,
      /\[(?:official\s*(?:video|audio|music\s*video)|hd|4k|hq)\]/gi,
      /\((?:official\s*(?:video|audio)|video\s*clip)\)/gi,
      /^\d{1,3}[\s.\-_]+/g, // Voorvoegsels zoals "01 - ", "02. ", "104_"
      /\s{2,}/g // Meerdere spaties
    ];

    const seenHashes = new Set<string>();

    return rawTracks.map((raw) => {
      const original = raw.trim();
      let cleaned = original;
      const removedJunk: string[] = [];

      for (const pattern of junkPatterns) {
        const matches = cleaned.match(pattern);
        if (matches) {
          removedJunk.push(...matches.map((m) => m.trim()));
          cleaned = cleaned.replace(pattern, " ");
        }
      }

      cleaned = cleaned
        .replace(/\(\s*\)/g, "")
        .replace(/\[\s*\]/g, "")
        .replace(/\s*[([{(]\s*$/g, "")
        .replace(/^\s*[)\]}]\s*/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Splitsen in Artist - Title
      let cleanedArtist = "Unknown Artist";
      let cleanedTitle = cleaned;

      if (cleaned.includes(" - ")) {
        const parts = cleaned.split(" - ");
        cleanedArtist = parts[0].trim();
        cleanedTitle = parts.slice(1).join(" - ").trim();
      }

      cleanedTitle = cleanedTitle
        .replace(/\(\s*\)/g, "")
        .replace(/\[\s*\]/g, "")
        .replace(/\s*[([{(]\s*$/g, "")
        .replace(/^\s*[)\]}]\s*/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Audio fingerprint hash simulatie (op basis van normalized artist + title)
      const normalizedString = `${cleanedArtist.toLowerCase().replace(/[^a-z0-9]/g, "")}_${cleanedTitle.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const duplicateHash = crypto.createHash("md5").update(normalizedString).digest("hex").slice(0, 10);
      const isDuplicate = seenHashes.has(duplicateHash);
      seenHashes.add(duplicateHash);

      return {
        original,
        cleanedArtist,
        cleanedTitle,
        fullCleaned: `${cleanedArtist} - ${cleanedTitle}`,
        removedJunk,
        isDuplicate,
        duplicateHash
      };
    });
  }

  /**
   * Module 3: Genereert 8 Smart Cue points volgens Lexicon DJ Ultimate specificatie.
   */
  public static generate8PointSmartCues(durationSec = 300, bpm = 126): CuePoint[] {
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;

    const cueSpecs = [
      { name: "Intro Downbeat", barOffset: 0, color: "#10b981", type: "intro" as const },
      { name: "Verse / Vocal Intro", barOffset: 8, color: "#06b6d4", type: "custom" as const },
      { name: "Chorus / Pre-Drop", barOffset: 16, color: "#eab308", type: "custom" as const },
      { name: "Build-Up", barOffset: 24, color: "#f97316", type: "drop" as const },
      { name: "Drop 1 (Main Climax)", barOffset: 32, color: "#ef4444", type: "drop" as const },
      { name: "Breakdown", barOffset: Math.floor(durationSec / barSec / 2), color: "#3b82f6", type: "breakdown" as const },
      { name: "Drop 2 (Peak)", barOffset: Math.floor(durationSec / barSec / 2) + 16, color: "#ec4899", type: "drop" as const },
      { name: "Outro Mix-Out", barOffset: Math.floor(durationSec / barSec) - 16, color: "#8b5cf6", type: "outro" as const }
    ];

    return cueSpecs.map((spec, idx) => {
      let timeSec = Math.min(Math.round(spec.barOffset * barSec * 10) / 10, durationSec - 5);
      if (timeSec < 0) timeSec = 0;
      const mins = Math.floor(timeSec / 60).toString().padStart(2, "0");
      const secs = Math.floor(timeSec % 60).toString().padStart(2, "0");

      return {
        id: `smart_cue_${idx + 1}`,
        name: spec.name,
        timeSec,
        timestamp: `${mins}:${secs}`,
        color: spec.color,
        type: spec.type
      };
    });
  }
}
