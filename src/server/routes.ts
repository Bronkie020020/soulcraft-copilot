import { FastifyInstance } from "fastify";
import { ReleaseCopilotEngine } from "../services/agentService.js";
import { ImageService } from "../services/imageService.js";
import { StorageService } from "../services/storageService.js";
import { EngineDjParser } from "../services/engineDjParser.js";
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
}
