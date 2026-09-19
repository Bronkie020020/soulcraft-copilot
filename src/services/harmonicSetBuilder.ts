export interface HarmonicTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  camelotKey: string; // e.g. "8A", "9A", "11B"
  energyLevel: number; // 0.0 - 1.0
}

export interface HarmonicTransitionRule {
  fromKey: string;
  toKey: string;
  isHarmonic: boolean;
  energyShift: "drop" | "smooth" | "boost" | "energy_clash";
  description: string;
}

export class HarmonicSetBuilder {
  private static camelotNumbers: Record<string, number> = {
    "1A": 1, "1B": 1, "2A": 2, "2B": 2, "3A": 3, "3B": 3,
    "4A": 4, "4B": 4, "5A": 5, "5B": 5, "6A": 6, "6B": 6,
    "7A": 7, "7B": 7, "8A": 8, "8B": 8, "9A": 9, "9B": 9,
    "10A": 10, "10B": 10, "11A": 11, "11B": 11, "12A": 12, "12B": 12
  };

  /**
   * Controleert of een overgang harmonisch compatibel is volgens het Camelot-systeem.
   */
  public static checkCompatibility(currentKey: string, nextKey: string): HarmonicTransitionRule {
    const currNum = this.camelotNumbers[currentKey];
    const nextNum = this.camelotNumbers[nextKey];
    const currLetter = currentKey.slice(-1);
    const nextLetter = nextKey.slice(-1);

    if (!currNum || !nextNum) {
      return {
        fromKey: currentKey,
        toKey: nextKey,
        isHarmonic: false,
        energyShift: "energy_clash",
        description: "Ongeldige of onbekende Camelot toonsoort"
      };
    }

    const diff = Math.abs(currNum - nextNum);
    const isAdjacent = diff === 1 || diff === 11;
    const isSameNum = diff === 0;

    if (isSameNum && currLetter === nextLetter) {
      return {
        fromKey: currentKey,
        toKey: nextKey,
        isHarmonic: true,
        energyShift: "smooth",
        description: "Exacte match (Identieke toonsoort - 100% vloeiend)"
      };
    }
    if (isSameNum && currLetter !== nextLetter) {
      return {
        fromKey: currentKey,
        toKey: nextKey,
        isHarmonic: true,
        energyShift: "smooth",
        description: "Relatieve Mineur/Majeur wissel (Zeer harmonisch)"
      };
    }
    if (isAdjacent && currLetter === nextLetter) {
      const isBoost = nextNum > currNum || (currNum === 12 && nextNum === 1);
      return {
        fromKey: currentKey,
        toKey: nextKey,
        isHarmonic: true,
        energyShift: isBoost ? "boost" : "drop",
        description: isBoost ? "Stap voorwaarts (+1 uur, Energy Boost)" : "Stap terugwaarts (-1 uur, Energy Drop)"
      };
    }
    if ((currNum + 2) % 12 === nextNum % 12 && currLetter === nextLetter) {
      return {
        fromKey: currentKey,
        toKey: nextKey,
        isHarmonic: true,
        energyShift: "boost",
        description: "Energy Jump (+2 semitones powermix)"
      };
    }

    return {
      fromKey: currentKey,
      toKey: nextKey,
      isHarmonic: false,
      energyShift: "energy_clash",
      description: "Harmonische clash (Vermijd directe mix tenzij breakdown filter gebruikt)"
    };
  }

  /**
   * Bouwt een vloeiende setlist op door tracks te ordenen op Camelot key en BPM flow.
   */
  public static buildOptimalPath(availableTracks: HarmonicTrack[], startTrackId?: string, targetCount?: number): HarmonicTrack[] {
    if (!availableTracks || availableTracks.length === 0) return [];
    const setlist: HarmonicTrack[] = [];
    const pool = [...availableTracks];
    const limit = targetCount || pool.length;

    let currentIndex = startTrackId ? pool.findIndex(t => t.id === startTrackId) : 0;
    if (currentIndex === -1) currentIndex = 0;

    let currentTrack = pool.splice(currentIndex, 1)[0];
    setlist.push(currentTrack);

    while (pool.length > 0 && setlist.length < limit) {
      let bestMatchIndex = -1;
      let highestScore = -999;

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        const bpmDiff = Math.abs(currentTrack.bpm - candidate.bpm);
        if (bpmDiff > 8) continue; // BPM sprong te groot

        const compatibility = this.checkCompatibility(currentTrack.camelotKey, candidate.camelotKey);
        let score = 0;

        if (compatibility.isHarmonic) score += 50;
        if (compatibility.energyShift === "smooth") score += 25;
        if (compatibility.energyShift === "boost") score += 30;
        score -= bpmDiff * 4;

        if (candidate.energyLevel >= currentTrack.energyLevel) {
          score += 15;
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatchIndex = i;
        }
      }

      if (bestMatchIndex !== -1) {
        currentTrack = pool.splice(bestMatchIndex, 1)[0];
        setlist.push(currentTrack);
      } else {
        pool.sort((a, b) => Math.abs(a.bpm - currentTrack.bpm) - Math.abs(b.bpm - currentTrack.bpm));
        currentTrack = pool.shift()!;
        setlist.push(currentTrack);
      }
    }

    return setlist;
  }
}
