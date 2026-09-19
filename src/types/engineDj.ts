import { z } from "zod";

export const EngineTrackItemSchema = z.object({
  index: z.number(),
  artist: z.string(),
  title: z.string(),
  timestamp: z.string().optional(), // formaat "00:00" of "14:32"
  durationSeconds: z.number().optional(),
  bpm: z.number().optional(),
  key: z.string().optional()
});

export type EngineTrackItem = z.infer<typeof EngineTrackItemSchema>;
