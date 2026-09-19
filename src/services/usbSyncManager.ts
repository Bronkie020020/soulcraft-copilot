import fs from "node:fs/promises";
import path from "node:path";
import { CuePoint } from "../types/engineDj.js";

export interface SyncTrackInfo {
  index?: number;
  title: string;
  artist: string;
  durationSeconds: number;
  bpm?: number;
  camelotKey?: string;
  energyScore?: number;
  filePath?: string;
  cuePoints?: CuePoint[];
}

export interface SyncTarget {
  usbMountPath: string; // bijv. "E:/" of "/Volumes/SOULCRAFT"
  softwareType: "ENGINE_DJ" | "REKORDBOX" | "TRAKTOR_PRO_4" | "DJAY_PRO";
}

export class UsbSyncManager {
  /**
   * Genereert en exporteert een M3U8 playlist en bereidt de DJ library folder voor.
   */
  public static async syncPlaylist(tracks: SyncTrackInfo[], playlistName: string, target: SyncTarget) {
    const safeName = playlistName.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim() || "Soulcraft_Set";
    const baseDir = path.resolve(target.usbMountPath);
    await fs.mkdir(baseDir, { recursive: true });

    const m3uEntries: string[] = ["#EXTM3U"];
    for (const track of tracks) {
      const dur = Math.round(track.durationSeconds || 270);
      m3uEntries.push(`#EXTINF:${dur},${track.artist} - ${track.title}`);
      m3uEntries.push(track.filePath || `${track.artist} - ${track.title}.mp3`);
    }

    const playlistFile = path.join(baseDir, `${safeName}.m3u8`);
    await fs.writeFile(playlistFile, m3uEntries.join("\n"), "utf-8");

    let xmlFile: string | undefined;

    // Bereid DJ software-specifieke directories voor
    if (target.softwareType === "ENGINE_DJ") {
      await fs.mkdir(path.join(baseDir, "Engine Library"), { recursive: true });
    } else if (target.softwareType === "REKORDBOX") {
      await fs.mkdir(path.join(baseDir, "PIONEER"), { recursive: true });
      xmlFile = path.join(baseDir, "PIONEER", `${safeName}_rekordbox.xml`);
      const xmlContent = this.generateRekordboxXml(tracks, playlistName);
      await fs.writeFile(xmlFile, xmlContent, "utf-8");
    }

    return {
      success: true,
      playlistFile,
      xmlFile,
      softwareType: target.softwareType,
      syncedTracksCount: tracks.length
    };
  }

  /**
   * Genereert een standaard Pioneer Rekordbox XML bestand met embedded Hot Cues.
   */
  public static generateRekordboxXml(tracks: SyncTrackInfo[], playlistName: string): string {
    const trackXmls = tracks.map((t, idx) => {
      const trackId = idx + 1;
      const bpm = t.bpm || 126;
      const cues = t.cuePoints || [];
      const cueMarks = cues.map((c, cIdx) => `
        <POSITION_MARK Name="${escapeXml(c.name)}" Type="0" Start="${c.timeSec.toFixed(3)}" Num="${cIdx}" Red="${c.color === '#ef4444' ? 239 : 16}" Green="${c.color === '#10b981' ? 185 : 115}" Blue="${c.color === '#3b82f6' ? 246 : 30}"/>`
      ).join("");

      return `
      <TRACK TrackID="${trackId}" Name="${escapeXml(t.title)}" Artist="${escapeXml(t.artist)}" TotalTime="${Math.round(t.durationSeconds)}" AverageBpm="${bpm.toFixed(2)}" Tonality="${t.camelotKey || '8A'}" Comments="Energy: ${t.energyScore || 7}/10">
        <TEMPO Inizio="0.000" Bpm="${bpm.toFixed(2)}" Metro="4/4" Battito="1"/>${cueMarks}
      </TRACK>`;
    }).join("");

    const playlistEntries = tracks.map((_, idx) => `<TRACK Key="${idx + 1}"/>`).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <PRODUCT Name="Soulcraft Studio Suite" Version="9.0.0" Company="Soulcraft DJ Systems"/>
  <COLLECTION Entries="${tracks.length}">${trackXmls}
  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT">
      <NODE Name="${escapeXml(playlistName)}" Type="1" KeyType="0" Entries="${tracks.length}">${playlistEntries}
      </NODE>
    </NODE>
  </PLAYLISTS>
</DJ_PLAYLISTS>`;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
