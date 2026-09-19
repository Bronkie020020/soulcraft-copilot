import { describe, it, expect } from "vitest";
import { DjPromptCreatorService } from "../src/services/djPromptCreatorService.js";

describe("DjPromptCreatorService (Lexicon DJ Ultimate & UPC Logic)", () => {
  it("analyzes migration intake and generates dynamic questions", () => {
    const intake = "Ik stap over van Serato naar Rekordbox en al mijn cues moeten mee.";
    const analysis = DjPromptCreatorService.analyzeIntake(intake);

    expect(analysis.category).toBe("MIGRATION");
    expect(analysis.questions.length).toBeGreaterThanOrEqual(2);

    const questionIds = analysis.questions.map((q) => q.id);
    expect(questionIds).toContain("key_notation");
    expect(questionIds).toContain("source_target");
  });

  it("analyzes tag cleanup intake and generates duplicate policy questions", () => {
    const intake = "Mijn titels zijn een zooitje met download sites en dubbele bestanden die opgeschoond moeten worden.";
    const analysis = DjPromptCreatorService.analyzeIntake(intake);

    expect(analysis.category).toBe("TAG_CLEANUP");
    const questionIds = analysis.questions.map((q) => q.id);
    expect(questionIds).toContain("duplicate_policy");
  });

  it("compiles an Ultimate Expert DJ Prompt with Lexicon DJ Ultimate rules", () => {
    const promptResult = DjPromptCreatorService.generateExpertPrompt({
      intake: "Migreer van Serato naar Rekordbox en schoon tags op.",
      category: "MIGRATION",
      answers: {
        key_notation: "CAMELOT",
        source_target: "SERATO_TO_REKORDBOX",
        duplicate_policy: "MARK_TAG",
        cue_density: "8_CUES"
      }
    });

    expect(promptResult.prompt).toContain("Lexicon DJ Ultimate");
    expect(promptResult.prompt).toContain("CAMELOT");
    expect(promptResult.prompt).toContain("SERATO_TO_REKORDBOX");
    expect(promptResult.prompt).toContain("8_CUES");
    expect(promptResult.executionPlan.length).toBeGreaterThan(0);
  });

  it("cleans junk tokens, download URLs, and video tags from track titles", () => {
    const dirtyTracks = [
      "01 - Dennis Quin - Chant Groove (://downloadmp3.com)",
      "02. Kerri Chandler feat. Jerome - Atmosphere [Official Video]",
      "103_Soulcraft - Midnight Jack (Original Mix) (www.zippyshare.com)",
      "Dennis Quin - Chant Groove" // duplicate
    ];

    const cleaned = DjPromptCreatorService.cleanTrackTags(dirtyTracks);

    expect(cleaned.length).toBe(4);

    // Track 1
    expect(cleaned[0].cleanedArtist).toBe("Dennis Quin");
    expect(cleaned[0].cleanedTitle).toBe("Chant Groove");
    expect(cleaned[0].removedJunk.length).toBeGreaterThan(0);

    // Track 2
    expect(cleaned[1].cleanedTitle).not.toContain("[Official Video]");

    // Duplicate detection
    expect(cleaned[3].isDuplicate).toBe(true);
  });

  it("generates 8 strategic smart cues with BPM-Dex color coding", () => {
    const cues = DjPromptCreatorService.generate8PointSmartCues(360, 126);

    expect(cues.length).toBe(8);
    expect(cues[0].name).toBe("Intro Downbeat");
    expect(cues[0].color).toBe("#10b981");

    const names = cues.map((c) => c.name);
    expect(names).toContain("Verse / Vocal Intro");
    expect(names).toContain("Chorus / Pre-Drop");
    expect(names).toContain("Build-Up");
    expect(names).toContain("Drop 1 (Main Climax)");
    expect(names).toContain("Breakdown");
    expect(names).toContain("Drop 2 (Peak)");
    expect(names).toContain("Outro Mix-Out");
  });
});
