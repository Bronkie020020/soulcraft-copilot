import { ReleaseCopilotEngine } from "../services/agentService.js";
import { EngineDjParser } from "../services/engineDjParser.js";
import { StorageService } from "../services/storageService.js";
import { ImageService } from "../services/imageService.js";

async function runCliSmokeTest() {
  console.log("\n=======================================================");
  console.log("   SOULCRAFT STUDIO SUITE (v3.0) — CLI SMOKE TEST");
  console.log("=======================================================\n");

  // 1. Test Engine DJ Parser
  console.log("1. Testing Denon SC Live 2 / M3U Tracklist Parser...");
  const rawSample = `
    Dennis Quin - Chant Groove
    Kerri Chandler - Atmosphere
    Soulcraft - Midnight Jack
    Floorplan - Never Grow Old
  `;
  const { tracks, formattedString } = EngineDjParser.parseTracklist(rawSample, true, 4.5);
  console.log(`   ✓ Parsed ${tracks.length} tracks successfully.`);
  console.log(`   Sample output:\n   ${formattedString.split("\n")[0]}`);

  // 2. Test Release Copilot Engine
  console.log("\n2. Testing Release Copilot Engine...");
  const engine = new ReleaseCopilotEngine();
  const res = await engine.generateRelease({
    vibeDescription: "Zonnige zaterdagmiddag Chicago House set met rauwe jackin drums en 909 percussie.",
    rawTracklist: rawSample,
    bpmRange: "125 - 127 BPM",
    targetAudience: "SoundCloud underground house community",
    calculateTimestamps: true,
    averageTrackDurationMin: 4.5
  });

  if (!res.success || !res.data) {
    throw new Error(`Engine generation failed: ${res.error}`);
  }

  console.log(`   ✓ Compiled release: "${res.data.selectedTitle}"`);
  console.log(`   ✓ Genre: ${res.data.primaryGenre} (${res.data.subGenres.join(", ")})`);
  console.log(`   ✓ Tags: ${res.data.tags.slice(0, 5).join(" ")}...`);
  console.log(`   ✓ Artwork Prompts: ${res.data.artworkPrompts.length} generated.`);
  console.log(`   ✓ Social Kit hooks: ${res.data.socialKit?.tiktokHooks.length || 0}`);

  // 3. Test Storage Service
  console.log("\n3. Testing Storage Service...");
  await StorageService.saveRelease(res.data);
  const retrieved = await StorageService.getReleaseById(res.data.id);
  if (!retrieved) throw new Error("Could not retrieve saved release from JSON store");
  console.log(`   ✓ Successfully stored and retrieved release ID: ${retrieved.id}`);

  // 4. Test Image Service Cover Generation
  console.log("\n4. Testing 1:1 Artwork Generator...");
  const imageService = new ImageService();
  const coverUrl = await imageService.generateCoverArtwork(
    res.data.artworkPrompts[0]?.promptText || "Brutalist Warehouse Club Night",
    res.data.id
  );
  console.log(`   ✓ Generated 1:1 artwork cover: ${coverUrl}`);

  console.log("\n=======================================================");
  console.log("   ✅ ALL v3.0 STUDIO SUITE COMPONENTS OPERATIONAL");
  console.log("=======================================================\n");
}

runCliSmokeTest().catch((err) => {
  console.error("\n❌ Smoke test encountered an error:", err);
  process.exit(1);
});
