import { describe, it, expect } from "vitest";
import { LibraryStorageService } from "../src/services/libraryStorageService.js";
import { LibraryTrack } from "../src/types/library.js";

describe("LibraryStorageService", () => {
  it("initializes with default crates", async () => {
    const crates = await LibraryStorageService.getAllCrates();
    expect(crates.length).toBeGreaterThanOrEqual(3);
    const names = crates.map((c) => c.name);
    expect(names).toContain("Alle Tracks");
    expect(names).toContain("Peak Time Club");
  });

  it("creates and deletes a custom crate", async () => {
    const created = await LibraryStorageService.createCrate("Acid House Vault", "#10b981");
    expect(created.name).toBe("Acid House Vault");
    expect(created.id).toBeDefined();

    const cratesAfter = await LibraryStorageService.getAllCrates();
    expect(cratesAfter.some((c) => c.id === created.id)).toBe(true);

    const deleted = await LibraryStorageService.deleteCrate(created.id);
    expect(deleted).toBe(true);

    const cratesFinal = await LibraryStorageService.getAllCrates();
    expect(cratesFinal.some((c) => c.id === created.id)).toBe(false);
  });

  it("saves, retrieves, assigns to crate, and deletes a library track", async () => {
    const testTrack: LibraryTrack = {
      id: `test_trk_${Date.now()}`,
      title: "Atmosphere (Live Denon Cut)",
      artist: "Kerri Chandler",
      durationSec: 360,
      bpm: 126,
      camelotKey: "9A",
      energyScore: 8,
      danceability: 0.88,
      mood: "Peak Time Club",
      cuePoints: [
        { id: "c1", name: "Intro", timeSec: 0, timestamp: "00:00", color: "#10b981", type: "intro" },
        { id: "c2", name: "Drop 1", timeSec: 45, timestamp: "00:45", color: "#ef4444", type: "drop" }
      ],
      waveformPeaks: [0.1, 0.5, 0.9, 0.4],
      audioUrl: "/audio/test_atmosphere.mp3",
      fileName: "test_atmosphere.mp3",
      fileSize: 10240000,
      crateIds: ["crate_all"],
      addedAt: new Date().toISOString()
    };

    // 1. Save
    await LibraryStorageService.saveTrack(testTrack);
    const fetched = await LibraryStorageService.getTrackById(testTrack.id);
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe("Atmosphere (Live Denon Cut)");
    expect(fetched?.energyScore).toBe(8);
    expect(fetched?.camelotKey).toBe("9A");

    // 2. Assign to crate
    const assigned = await LibraryStorageService.addTrackToCrate(testTrack.id, "crate_peak");
    expect(assigned).toBe(true);
    const updated = await LibraryStorageService.getTrackById(testTrack.id);
    expect(updated?.crateIds).toContain("crate_peak");

    // 3. Remove from crate
    await LibraryStorageService.removeTrackFromCrate(testTrack.id, "crate_peak");
    const unassigned = await LibraryStorageService.getTrackById(testTrack.id);
    expect(unassigned?.crateIds).not.toContain("crate_peak");

    // 4. Delete track
    const deleted = await LibraryStorageService.deleteTrack(testTrack.id);
    expect(deleted).toBe(true);
    const finalCheck = await LibraryStorageService.getTrackById(testTrack.id);
    expect(finalCheck).toBeUndefined();
  });
});
