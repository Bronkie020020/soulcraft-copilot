import { z } from "zod";
import { EngineTrackItemSchema } from "./engineDj.js";

export const GenreEnum = z.enum([
  "Funky House",
  "Chicago House",
  "Tech House",
  "Deep House",
  "Jackin House",
  "Techno",
  "Minimal / Deep Tech"
]);

export const ArtworkPromptSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  styleName: z.string().describe("Descriptive name of the visual style"),
  promptText: z.string().describe("Ultra-detailed prompt text for Midjourney or Imagen"),
  aspectRatio: z.enum(["1:1"]).default("1:1"),
  negativePrompt: z.string().optional(),
  generatedImageUrl: z.string().optional()
});

export const SocialKitSchema = z.object({
  instagramCaption: z.string().describe("Ready-to-use Instagram caption with emojis and tags"),
  tiktokHooks: z.array(z.string()).min(2).describe("Short, punchy video hooks for DJ clips"),
  repostOutreach: z.string().describe("Short DM pitch to send to House/Techno promotional channels")
});

export const SoundcloudReleaseSchema = z.object({
  id: z.string().default(() => `rel_${Date.now()}`),
  createdAt: z.string().default(() => new Date().toISOString()),
  titleSuggestions: z.array(z.string()).min(3).max(5),
  selectedTitle: z.string().default(""),
  primaryGenre: GenreEnum,
  subGenres: z.array(z.string()).min(1).max(4),
  tags: z.array(z.string()).min(5).max(15),
  description: z.string(),
  tracklistFormatted: z.string(),
  parsedTracks: z.array(EngineTrackItemSchema).optional().default([]),
  artworkPrompts: z.array(ArtworkPromptSchema).min(2).max(4),
  releaseStrategyTips: z.array(z.string()).min(2),
  socialKit: SocialKitSchema.optional(),
  status: z.enum(["draft", "ready", "published"]).default("draft")
});

export type SoundcloudRelease = z.infer<typeof SoundcloudReleaseSchema>;
export type ArtworkPrompt = z.infer<typeof ArtworkPromptSchema>;
export type SocialKit = z.infer<typeof SocialKitSchema>;

export const GenerateReleaseInputSchema = z.object({
  vibeDescription: z.string().min(5, "Geef minimaal een korte omschrijving van de set"),
  rawTracklist: z.string().optional().default(""),
  bpmRange: z.string().optional().default("124 - 128 BPM"),
  targetAudience: z.string().optional().default("SoundCloud house & techno community"),
  calculateTimestamps: z.boolean().optional().default(true),
  averageTrackDurationMin: z.number().optional().default(4.5)
});

export type GenerateReleaseInput = z.infer<typeof GenerateReleaseInputSchema>;
export type RawSetInput = GenerateReleaseInput;
