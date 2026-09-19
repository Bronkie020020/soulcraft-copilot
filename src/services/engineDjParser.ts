import { EngineTrackItem } from "../types/engineDj.js";

export class EngineDjParser {
  /**
   * Converteert ruwe invoer (M3U playlist, Denon session export of simpele tekstregels)
   * naar een gestructureerde lijst van tracks inclusief berekende SoundCloud timestamps.
   */
  static parseTracklist(
    rawText: string,
    calculateTimestamps = true,
    avgDurationMin = 4.5
  ): { tracks: EngineTrackItem[]; formattedString: string } {
    if (!rawText || !rawText.trim()) {
      return { tracks: [], formattedString: "" };
    }

    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#EXTM3U"));

    const tracks: EngineTrackItem[] = [];
    let currentSeconds = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // M3U Info lijn overslaan indien aanwezig
      if (line.startsWith("#EXTINF:")) {
        continue;
      }

      // Verwijder eventuele bestaande nummering zoals "1. ", "01 - "
      line = line.replace(/^\d+[\.\-\s]+/, "").trim();

      // Zoek naar "Artist - Title" patronen
      let artist = "Unknown Artist";
      let title = line;

      if (line.includes(" - ")) {
        const parts = line.split(" - ");
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }

      // Timestamp berekenen
      const minutes = Math.floor(currentSeconds / 60);
      const seconds = Math.floor(currentSeconds % 60);
      const timestampFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      tracks.push({
        index: tracks.length + 1,
        artist,
        title,
        timestamp: timestampFormatted,
        durationSeconds: Math.round(avgDurationMin * 60),
      });

      if (calculateTimestamps) {
        currentSeconds += avgDurationMin * 60;
      }
    }

    const formattedString = tracks
      .map((t) => `${t.timestamp} | ${t.artist} - ${t.title}`)
      .join("\n");

    return { tracks, formattedString };
  }
}
