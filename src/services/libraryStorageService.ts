import fs from "node:fs/promises";
import path from "node:path";
import { LibraryTrack, Crate } from "../types/library.js";

interface LibraryData {
  tracks: LibraryTrack[];
  crates: Crate[];
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const LIBRARY_FILE = path.join(DATA_DIR, "library.json");

const DEFAULT_CRATES: Crate[] = [
  { id: "crate_all", name: "Alle Tracks", color: "#f97316", createdAt: new Date().toISOString() },
  { id: "crate_peak", name: "Peak Time Club", color: "#ef4444", createdAt: new Date().toISOString() },
  { id: "crate_deep", name: "Deep & Jackin", color: "#3b82f6", createdAt: new Date().toISOString() },
  { id: "crate_warmup", name: "Warm Up Vibes", color: "#10b981", createdAt: new Date().toISOString() }
];

export class LibraryStorageService {
  private static async ensureInitialized(): Promise<LibraryData> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const data = await fs.readFile(LIBRARY_FILE, "utf-8");
      return JSON.parse(data) as LibraryData;
    } catch {
      const initial: LibraryData = {
        tracks: [],
        crates: DEFAULT_CRATES
      };
      await fs.writeFile(LIBRARY_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
  }

  private static async save(data: LibraryData): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LIBRARY_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  public static async getAllTracks(): Promise<LibraryTrack[]> {
    const data = await this.ensureInitialized();
    return data.tracks;
  }

  public static async getTrackById(id: string): Promise<LibraryTrack | undefined> {
    const data = await this.ensureInitialized();
    return data.tracks.find((t) => t.id === id);
  }

  public static async saveTrack(track: LibraryTrack): Promise<LibraryTrack> {
    const data = await this.ensureInitialized();
    const existingIndex = data.tracks.findIndex((t) => t.id === track.id);
    if (existingIndex >= 0) {
      data.tracks[existingIndex] = track;
    } else {
      data.tracks.unshift(track);
    }
    await this.save(data);
    return track;
  }

  public static async deleteTrack(id: string): Promise<boolean> {
    const data = await this.ensureInitialized();
    const initialLen = data.tracks.length;
    data.tracks = data.tracks.filter((t) => t.id !== id);
    if (data.tracks.length !== initialLen) {
      await this.save(data);
      return true;
    }
    return false;
  }

  public static async getAllCrates(): Promise<Crate[]> {
    const data = await this.ensureInitialized();
    return data.crates.map((c) => ({
      ...c,
      trackCount: c.id === "crate_all" ? data.tracks.length : data.tracks.filter((t) => t.crateIds?.includes(c.id)).length
    }));
  }

  public static async createCrate(name: string, color = "#f97316"): Promise<Crate> {
    const data = await this.ensureInitialized();
    const newCrate: Crate = {
      id: `crate_${Date.now()}`,
      name: name.trim(),
      color,
      createdAt: new Date().toISOString()
    };
    data.crates.push(newCrate);
    await this.save(data);
    return newCrate;
  }

  public static async deleteCrate(id: string): Promise<boolean> {
    const data = await this.ensureInitialized();
    if (id === "crate_all") return false; // Bescherm hoofdcrate
    const initialLen = data.crates.length;
    data.crates = data.crates.filter((c) => c.id !== id);
    // Verwijder crate ID ook uit tracks
    data.tracks.forEach((t) => {
      if (t.crateIds) {
        t.crateIds = t.crateIds.filter((cid) => cid !== id);
      }
    });
    if (data.crates.length !== initialLen) {
      await this.save(data);
      return true;
    }
    return false;
  }

  public static async addTrackToCrate(trackId: string, crateId: string): Promise<boolean> {
    const data = await this.ensureInitialized();
    const track = data.tracks.find((t) => t.id === trackId);
    if (!track) return false;
    if (!track.crateIds) track.crateIds = [];
    if (!track.crateIds.includes(crateId)) {
      track.crateIds.push(crateId);
      await this.save(data);
      return true;
    }
    return true;
  }

  public static async removeTrackFromCrate(trackId: string, crateId: string): Promise<boolean> {
    const data = await this.ensureInitialized();
    const track = data.tracks.find((t) => t.id === trackId);
    if (!track || !track.crateIds) return false;
    track.crateIds = track.crateIds.filter((cid) => cid !== crateId);
    await this.save(data);
    return true;
  }
}
