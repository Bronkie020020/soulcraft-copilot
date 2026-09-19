import fs from "node:fs/promises";
import path from "node:path";

export interface SyncTrackInfo {
  title: string;
  artist: string;
  durationSeconds: number;
  bpm?: number;
  camelotKey?: string;
  filePath?: string;
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

    // Bereid DJ software-specifieke directories voor
    if (target.softwareType === "ENGINE_DJ") {
      await fs.mkdir(path.join(baseDir, "Engine Library"), { recursive: true });
    } else if (target.softwareType === "REKORDBOX") {
      await fs.mkdir(path.join(baseDir, "PIONEER"), { recursive: true });
    }

    return {
      success: true,
      playlistFile,
      softwareType: target.softwareType,
      syncedTracksCount: tracks.length
    };
  }
}
