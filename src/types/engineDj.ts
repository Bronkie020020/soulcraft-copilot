import { z } from "zod";

export const CuePointSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  name: z.string(), // "Intro", "Drop 1", "Breakdown", "Drop 2", "Outro"
  timeSec: z.number(),
  timestamp: z.string(), // "00:00", "01:32"
  color: z.string(), // HEX e.g. "#10b981", "#ef4444"
  type: z.enum(["intro", "drop", "breakdown", "outro", "custom"]).default("custom")
});

export type CuePoint = z.infer<typeof CuePointSchema>;

export const EngineTrackItemSchema = z.object({
  index: z.number(),
  artist: z.string(),
  title: z.string(),
  timestamp: z.string().optional(), // formaat "00:00" of "14:32"
  durationSeconds: z.number().optional(),
  bpm: z.number().optional(),
  key: z.string().optional(),
  camelotKey: z.string().optional(), // e.g. "8A", "11B"
  energyScore: z.number().min(1).max(10).optional().default(7), // BPM-Dex 1-10 scale
  danceability: z.number().min(0).max(1).optional().default(0.85),
  mood: z.string().optional().default("Peak Time Club"),
  cuePoints: z.array(CuePointSchema).optional().default([])
});

export type EngineTrackItem = z.infer<typeof EngineTrackItemSchema>;
