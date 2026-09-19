import { CuePoint } from "../types/engineDj.js";

export class CuePointEngine {
  /**
   * Formateert seconden naar MM:SS
   */
  public static formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  /**
   * Berekent automatisch de 5 essentiële DJ hot cues voor een track (BPM-Dex / Mixed-in-Key standaard).
   */
  public static calculateHotCues(durationSec: number = 270, bpm: number = 126): CuePoint[] {
    const total = Math.max(60, durationSec);
    
    // Bereken muzikale frasen (1 frase = 32 beats = 8 bars)
    const secondsPerBeat = 60 / (bpm || 126);
    const phraseSec = secondsPerBeat * 32;

    // Intro: 0.0s (start)
    const introTime = 0;
    
    // Drop 1: Eerste grote beat drop (meestal na 1 of 2 frasen, bijv. ~30s - 60s)
    const drop1Time = Math.min(phraseSec, total * 0.15);

    // Breakdown: Melodisch rustpunt (midden van de track)
    const breakdownTime = Math.min(phraseSec * 3, total * 0.45);

    // Drop 2: Tweede climax (na de breakdown)
    const drop2Time = Math.min(phraseSec * 4.5, total * 0.65);

    // Outro: Start van de mixout-zone (ongeveer 45-60 sec voor het einde)
    const outroTime = Math.max(total - phraseSec, total * 0.85);

    return [
      {
        id: "cue_intro",
        name: "Intro",
        timeSec: introTime,
        timestamp: this.formatTime(introTime),
        color: "#10b981", // Groen (Deck start)
        type: "intro"
      },
      {
        id: "cue_drop1",
        name: "Drop 1",
        timeSec: Math.round(drop1Time),
        timestamp: this.formatTime(drop1Time),
        color: "#ef4444", // Rood (First Drop)
        type: "drop"
      },
      {
        id: "cue_breakdown",
        name: "Breakdown",
        timeSec: Math.round(breakdownTime),
        timestamp: this.formatTime(breakdownTime),
        color: "#3b82f6", // Blauw (Break / Vocal)
        type: "breakdown"
      },
      {
        id: "cue_drop2",
        name: "Drop 2",
        timeSec: Math.round(drop2Time),
        timestamp: this.formatTime(drop2Time),
        color: "#f97316", // Oranje (Climax Drop)
        type: "drop"
      },
      {
        id: "cue_outro",
        name: "Outro",
        timeSec: Math.round(outroTime),
        timestamp: this.formatTime(outroTime),
        color: "#8b5cf6", // Paars (Mix-Out)
        type: "outro"
      }
    ];
  }

  /**
   * Berekent de Energy Level score op schaal 1 t/m 10 naar Mixed-in-Key / BPM-Dex standaard.
   */
  public static calculateEnergyScore(bpm: number = 126, genre: string = "House"): number {
    let score = 5;

    // BPM component
    if (bpm >= 132) score += 3;
    else if (bpm >= 127) score += 2;
    else if (bpm >= 124) score += 1;
    else if (bpm <= 120) score -= 1;

    // Genre component
    const g = genre.toLowerCase();
    if (g.includes("techno") || g.includes("peak")) score += 2;
    else if (g.includes("tech house") || g.includes("jackin")) score += 1;
    else if (g.includes("deep house") || g.includes("chill")) score -= 1;

    return Math.min(10, Math.max(1, score));
  }
}
