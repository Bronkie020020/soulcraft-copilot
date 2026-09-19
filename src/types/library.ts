import { CuePoint } from "./engineDj.js";

export interface LibraryTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  durationSec: number;
  bpm: number;
  camelotKey: string;
  energyScore: number; // 1 - 10
  danceability: number; // 0.0 - 1.0
  mood?: string;
  cuePoints: CuePoint[];
  waveformPeaks: number[]; // 100 normalized peak floats (0.0 to 1.0)
  audioUrl: string; // URL for playback (Blob URL or /audio/...)
  fileName: string;
  fileSize: number;
  crateIds: string[];
  addedAt: string;
}

export interface Crate {
  id: string;
  name: string;
  color: string;
  trackCount?: number;
  createdAt: string;
}

export interface AudioScanResult {
  title: string;
  artist: string;
  durationSec: number;
  bpm: number;
  camelotKey: string;
  energyScore: number;
  danceability: number;
  mood: string;
  cuePoints: CuePoint[];
  waveformPeaks: number[];
}
