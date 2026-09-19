import fs from "node:fs/promises";
import path from "node:path";
import { SoundcloudRelease } from "../types/release.js";
import pino from "pino";
import { env } from "../config/env.js";

const logger = pino({ level: env.LOG_LEVEL });
const DATA_DIR = path.resolve(process.cwd(), "data");
const RELEASES_FILE = path.join(DATA_DIR, "releases.json");

export class StorageService {
  private static isInitialized = false;

  private static async ensureInitialized() {
    if (this.isInitialized) return;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(RELEASES_FILE);
      } catch {
        await fs.writeFile(RELEASES_FILE, JSON.stringify([], null, 2), "utf-8");
      }
      this.isInitialized = true;
    } catch (err) {
      logger.error({ err }, "Failed to initialize storage directory");
    }
  }

  static async getAllReleases(): Promise<SoundcloudRelease[]> {
    await this.ensureInitialized();
    try {
      const raw = await fs.readFile(RELEASES_FILE, "utf-8");
      return JSON.parse(raw) as SoundcloudRelease[];
    } catch (err) {
      logger.error({ err }, "Error reading releases database");
      return [];
    }
  }

  static async getReleaseById(id: string): Promise<SoundcloudRelease | null> {
    const list = await this.getAllReleases();
    return list.find((r) => r.id === id) || null;
  }

  static async saveRelease(release: SoundcloudRelease): Promise<void> {
    await this.ensureInitialized();
    const list = await this.getAllReleases();
    const index = list.findIndex((r) => r.id === release.id);

    if (index >= 0) {
      list[index] = release;
    } else {
      list.unshift(release);
    }

    const tempPath = `${RELEASES_FILE}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(list, null, 2), "utf-8");
    await fs.rename(tempPath, RELEASES_FILE);
    logger.info({ id: release.id }, "Release successfully saved to storage");
  }

  static async deleteRelease(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const list = await this.getAllReleases();
    const updated = list.filter((r) => r.id !== id);
    if (updated.length === list.length) {
      return false;
    }

    const tempPath = `${RELEASES_FILE}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(updated, null, 2), "utf-8");
    await fs.rename(tempPath, RELEASES_FILE);
    return true;
  }
}
