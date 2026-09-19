import { describe, it, expect } from "vitest";
import { SoundcloudReleaseSchema, GenreEnum } from "../src/types/release.js";
import { EngineDjParser } from "../src/services/engineDjParser.js";

describe("SoundcloudReleaseSchema (v3.0)", () => {
  it("validates a complete, compliant SoundCloud v3.0 release payload", () => {
    const validPayload = {
      id: "rel_test_123",
      createdAt: new Date().toISOString(),
      titleSuggestions: [
        "Soulcraft Sessions 001: Chicago Heat",
        "Deep & Jackin: The Sunset Tape",
        "Warehouse Echoes Vol. 4"
      ],
      selectedTitle: "Soulcraft Sessions 001: Chicago Heat",
      primaryGenre: "Chicago House",
      subGenres: ["Jackin House", "Deep House"],
      tags: ["#ChicagoHouse", "#JackinHouse", "#HouseMusic", "#SoundcloudMix", "#DeepHouse"],
      description: "Step into the groove with Soulcraft Sessions 001. Raw basslines, vinyl cuts, and soulful energy.",
      tracklistFormatted: "00:00 | Artist 1 - Track One\n05:30 | Artist 2 - Track Two\n11:00 | Artist 3 - Track Three",
      parsedTracks: [
        { index: 1, artist: "Artist 1", title: "Track One", timestamp: "00:00", durationSeconds: 330 },
        { index: 2, artist: "Artist 2", title: "Track Two", timestamp: "05:30", durationSeconds: 330 },
        { index: 3, artist: "Artist 3", title: "Track Three", timestamp: "11:00", durationSeconds: 330 }
      ],
      artworkPrompts: [
        {
          id: "art_1",
          styleName: "Underground Warehouse",
          promptText: "Brutalist warehouse interior at midnight, misty fog machine haze, neon amber lights, 35mm film grain, 1:1 aspect ratio",
          aspectRatio: "1:1",
          negativePrompt: "text, blurry, watermark"
        },
        {
          id: "art_2",
          styleName: "Sunset Terrace",
          promptText: "Golden hour rooftop terrace overlooking skyline, warm sun flare, vinyl turntable setup, analog photography aesthetic",
          aspectRatio: "1:1"
        }
      ],
      releaseStrategyTips: [
        "Post on Thursday at 18:00 CET ahead of the weekend club rush.",
        "Share a 15-second teaser reel of the 11:00 transition on Instagram & TikTok."
      ],
      socialKit: {
        instagramCaption: "Fresh set in the vault 🔥",
        tiktokHooks: ["That 11:00 transition hits different...", "Denon SC Live 2 house flow"],
        repostOutreach: "Hey team, check out this fresh Chicago Jackin tape for your channel!"
      },
      status: "ready"
    };

    const parsed = SoundcloudReleaseSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("fails when required fields or minimum counts are violated", () => {
    const invalidPayload = {
      titleSuggestions: ["Only One Title"], // Needs min 3
      primaryGenre: "Invalid Genre",
      subGenres: [],
      tags: ["#one", "#two"], // Needs min 5
      description: "Short",
      tracklistFormatted: "",
      artworkPrompts: [],
      releaseStrategyTips: []
    };

    const parsed = SoundcloudReleaseSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });
});

describe("EngineDjParser", () => {
  it("parses raw track text and calculates timestamps correctly", () => {
    const input = `
      Dennis Quin - Chant Groove
      Kerri Chandler - Atmosphere
      Soulcraft - Midnight Jack
    `;
    const { tracks, formattedString } = EngineDjParser.parseTracklist(input, true, 4);

    expect(tracks.length).toBe(3);
    expect(tracks[0].artist).toBe("Dennis Quin");
    expect(tracks[0].title).toBe("Chant Groove");
    expect(tracks[0].timestamp).toBe("00:00");
    expect(tracks[1].timestamp).toBe("04:00");
    expect(tracks[2].timestamp).toBe("08:00");
    expect(formattedString).toContain("00:00 | Dennis Quin - Chant Groove");
  });

  it("handles empty or blank tracklists gracefully", () => {
    const { tracks, formattedString } = EngineDjParser.parseTracklist("");
    expect(tracks).toEqual([]);
    expect(formattedString).toBe("");
  });

  it("enriches tracks with BPM-Dex Hot Cues, Camelot Keys and 1-10 Energy Scores", () => {
    const input = "Floorplan - Never Grow Old";
    const { tracks } = EngineDjParser.parseTracklist(input, true, 5);

    expect(tracks.length).toBe(1);
    const track = tracks[0];
    expect(track.energyScore).toBeGreaterThanOrEqual(1);
    expect(track.energyScore).toBeLessThanOrEqual(10);
    expect(track.camelotKey).toBeDefined();
    expect(track.cuePoints).toBeDefined();
    expect(track.cuePoints.length).toBe(5);

    // Verify cue point colors & types according to BPM-Dex spec
    const types = track.cuePoints.map(c => c.type);
    expect(types).toContain("intro");
    expect(types).toContain("drop");
    expect(types).toContain("breakdown");
    expect(types).toContain("outro");

    const introCue = track.cuePoints.find(c => c.type === "intro");
    expect(introCue?.color).toBe("#10b981");
  });
});

describe("Rekordbox XML & USB Sync Engine", () => {
  it("generates compliant Rekordbox XML with POSITION_MARK hot cues", async () => {
    const { UsbSyncManager } = await import("../src/services/usbSyncManager.js");
    const testTracks = [
      {
        index: 1,
        artist: "Dennis Quin",
        title: "Chant Groove",
        timestamp: "00:00",
        durationSeconds: 300,
        bpm: 126,
        camelotKey: "8A",
        energyScore: 8,
        danceability: 0.85,
        mood: "Peak Time",
        cuePoints: [
          { id: "cue_1", name: "Intro Cue", timeSec: 0, timestamp: "00:00", color: "#10b981", type: "intro" as const },
          { id: "cue_2", name: "Drop 1", timeSec: 60, timestamp: "01:00", color: "#ef4444", type: "drop" as const }
        ]
      }
    ];

    const xml = UsbSyncManager.generateRekordboxXml(testTracks, "Test Playlist");
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<DJ_PLAYLISTS Version="1.0.0">');
    expect(xml).toContain('<COLLECTION Entries="1">');
    expect(xml).toContain('Artist="Dennis Quin"');
    expect(xml).toContain('Tonality="8A"');
    expect(xml).toContain('<POSITION_MARK Name="Intro Cue"');
    expect(xml).toContain('Num="0"');
    expect(xml).toContain('Num="1"');
    expect(xml).toContain('<NODE Name="Test Playlist" Type="1"');
  });
});
