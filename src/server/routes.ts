import { FastifyInstance } from "fastify";
import { ReleaseCopilotEngine } from "../services/agentService.js";
import { ImageService } from "../services/imageService.js";
import { StorageService } from "../services/storageService.js";
import { EngineDjParser } from "../services/engineDjParser.js";
import { HarmonicSetBuilder, HarmonicTrack } from "../services/harmonicSetBuilder.js";
import { UsbSyncManager, SyncTarget, SyncTrackInfo } from "../services/usbSyncManager.js";
import { CuePointEngine } from "../services/cuePointEngine.js";
import { DjPromptCreatorService } from "../services/djPromptCreatorService.js";
import { GenerateReleaseInputSchema, SoundcloudReleaseSchema } from "../types/release.js";

export async function registerRoutes(app: FastifyInstance) {
  const engine = new ReleaseCopilotEngine();
  const imageService = new ImageService();

  // Haal alle releases op
  app.get("/api/releases", async (_req, reply) => {
    const list = await StorageService.getAllReleases();
    return reply.send({ success: true, data: list });
  });

  // Haal specifieke release op
  app.get("/api/releases/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = await StorageService.getReleaseById(id);
    if (!item) return reply.status(404).send({ success: false, error: "Release not found" });
    return reply.send({ success: true, data: item });
  });

  // Parse direct een Engine DJ tracklist / M3U
  app.post("/api/tools/parse-tracklist", async (req, reply) => {
    const body = req.body as { rawText: string; avgDuration?: number };
    if (!body?.rawText) {
      return reply.status(400).send({ success: false, error: "rawText is required" });
    }
    const parsed = EngineDjParser.parseTracklist(body.rawText, true, body.avgDuration || 4.5);
    return reply.send({ success: true, data: parsed });
  });

  // Genereer complete release
  app.post("/api/releases/generate", async (req, reply) => {
    const parsed = GenerateReleaseInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() });
    }

    const res = await engine.generateRelease(parsed.data);
    if (!res.success || !res.data) {
      return reply.status(500).send({ success: false, error: res.error });
    }

    await StorageService.saveRelease(res.data);
    return reply.status(201).send({ success: true, data: res.data });
  });

  // Genereer artwork
  app.post("/api/releases/:id/artwork", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { promptText, promptId } = req.body as { promptText: string; promptId: string };

    const release = await StorageService.getReleaseById(id);
    if (!release) return reply.status(404).send({ success: false, error: "Release not found" });

    const imageUrl = await imageService.generateCoverArtwork(promptText, id);
    const targetPrompt = release.artworkPrompts.find((p) => p.id === promptId);
    if (targetPrompt) {
      targetPrompt.generatedImageUrl = imageUrl;
    }

    await StorageService.saveRelease(release);
    return reply.send({ success: true, imageUrl, release });
  });

  // Opslaan / bijwerken
  app.put("/api/releases/:id", async (req, reply) => {
    const parsed = SoundcloudReleaseSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ success: false, error: parsed.error });
    await StorageService.saveRelease(parsed.data);
    return reply.send({ success: true, data: parsed.data });
  });

  // Verwijderen
  app.delete("/api/releases/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await StorageService.deleteRelease(id);
    return reply.send({ success: ok });
  });

  // v8.0 Harmonic Set Planner
  app.post("/api/harmonic/plan", async (req, reply) => {
    const body = req.body as { tracks: HarmonicTrack[]; startTrackId?: string };
    if (!body?.tracks || !Array.isArray(body.tracks)) {
      return reply.status(400).send({ success: false, error: "tracks array is required" });
    }
    const planned = HarmonicSetBuilder.buildOptimalPath(body.tracks, body.startTrackId);
    const transitions = [];
    for (let i = 0; i < planned.length - 1; i++) {
      const rule = HarmonicSetBuilder.checkCompatibility(planned[i].camelotKey, planned[i + 1].camelotKey);
      transitions.push(rule);
    }
    return reply.send({ success: true, data: { setlist: planned, transitions } });
  });

  // v9.0 BPM-Dex Cue Point Detector
  app.post("/api/tracks/cues", async (req, reply) => {
    const body = req.body as { durationSec?: number; bpm?: number; genre?: string };
    const cues = CuePointEngine.calculateHotCues(body?.durationSec || 270, body?.bpm || 126);
    const energyScore = CuePointEngine.calculateEnergyScore(body?.bpm || 126, body?.genre || "House");
    return reply.send({ success: true, data: { cues, energyScore } });
  });

  // v9.0 USB & DJ Software Sync (with Rekordbox XML)
  app.post("/api/usb/sync", async (req, reply) => {
    const body = req.body as { tracks: SyncTrackInfo[]; playlistName: string; target: SyncTarget };
    if (!body?.tracks || !body?.target) {
      return reply.status(400).send({ success: false, error: "tracks and target are required" });
    }
    try {
      const result = await UsbSyncManager.syncPlaylist(body.tracks, body.playlistName || "Soulcraft_Set", body.target);
      return reply.send({ success: true, data: result });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // v9.0 Rekordbox XML Export download
  app.post("/api/export/rekordbox-xml", async (req, reply) => {
    const body = req.body as { tracks: SyncTrackInfo[]; playlistName?: string };
    const xml = UsbSyncManager.generateRekordboxXml(body?.tracks || [], body?.playlistName || "Soulcraft_Mix");
    reply.header("Content-Type", "application/xml");
    reply.header("Content-Disposition", `attachment; filename="${body?.playlistName || 'Soulcraft_Mix'}_rekordbox.xml"`);
    return reply.send(xml);
  });

  // Ultimate DJ Prompt Creator: Analyze Intake
  app.post("/api/dj-prompt/analyze", async (req, reply) => {
    const body = req.body as { intake: string };
    if (!body?.intake) {
      return reply.status(400).send({ success: false, error: "intake text is required" });
    }
    const analysis = DjPromptCreatorService.analyzeIntake(body.intake);
    return reply.send({ success: true, data: analysis });
  });

  // Ultimate DJ Prompt Creator: Generate Expert Prompt
  app.post("/api/dj-prompt/generate", async (req, reply) => {
    const body = req.body as {
      intake: string;
      category?: string;
      answers: Record<string, string>;
      selectedTracks?: string[];
    };
    if (!body?.intake) {
      return reply.status(400).send({ success: false, error: "intake is required" });
    }
    const result = DjPromptCreatorService.generateExpertPrompt({
      intake: body.intake,
      category: body.category || "FULL_OVERHAUL",
      answers: body.answers || {},
      selectedTracks: body.selectedTracks
    });
    return reply.send({ success: true, data: result });
  });

  // Ultimate DJ Prompt Creator: Execute Direct Fix / Module
  app.post("/api/dj-prompt/execute", async (req, reply) => {
    const body = req.body as {
      module: "tag-cleanup" | "smart-cues" | "key-conversion";
      tracks?: string[];
      durationSec?: number;
      bpm?: number;
    };
    if (body.module === "tag-cleanup") {
      const tracksToClean = body.tracks && body.tracks.length > 0 ? body.tracks : [
        "01 - Dennis Quin - Chant Groove (://downloadmp3.com)",
        "02. Kerri Chandler feat. Jerome - Atmosphere [Official Video]",
        "103_Soulcraft - Midnight Jack (Original Mix) (www.zippyshare.com)",
        "04. Floorplan - Never Grow Old [HD]",
        "Dennis Quin - Chant Groove"
      ];
      const cleaned = DjPromptCreatorService.cleanTrackTags(tracksToClean);
      return reply.send({ success: true, data: { tracks: cleaned, count: cleaned.length } });
    } else if (body.module === "smart-cues") {
      const cues = DjPromptCreatorService.generate8PointSmartCues(body.durationSec || 300, body.bpm || 126);
      return reply.send({ success: true, data: { cues, count: cues.length } });
    }
    return reply.status(400).send({ success: false, error: "Unsupported module" });
  });
}
