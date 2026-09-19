import { AudioScanResult } from "../../types/library.js";
import { CuePoint } from "../../types/engineDj.js";

const CAMELOT_KEYS = [
  "8A", "9A", "10A", "11A", "12A", "1A", "2A", "3A", "4A", "5A", "6A", "7A",
  "8B", "9B", "10B", "11B", "12B", "1B", "2B", "3B", "4B", "5B", "6B", "7B"
];

export async function scanAudioFile(file: File): Promise<AudioScanResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Web Audio Context to decode
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }

  const durationSec = Math.round(audioBuffer.duration);
  const channelData = audioBuffer.getChannelData(0);

  // 1. Calculate 120 Normalized Waveform Peaks
  const peakCount = 120;
  const blockSize = Math.floor(channelData.length / peakCount);
  const waveformPeaks: number[] = [];
  let maxPeak = 0.01;

  for (let i = 0; i < peakCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j += 4) { // subsample for speed
      const val = Math.abs(channelData[start + j]);
      if (val > sum) sum = val;
    }
    waveformPeaks.push(sum);
    if (sum > maxPeak) maxPeak = sum;
  }

  // Normalize peaks between 0.12 and 1.0
  const normalizedPeaks = waveformPeaks.map((p) => {
    const norm = p / maxPeak;
    return Math.max(0.12, Math.round(norm * 100) / 100);
  });

  // 2. RMS Energy Level Calculation (1 - 10)
  let sumSquares = 0;
  const rmsSampleCount = Math.min(channelData.length, 44100 * 60); // sample first 60 seconds
  for (let i = 0; i < rmsSampleCount; i += 8) {
    sumSquares += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sumSquares / (rmsSampleCount / 8));
  // Map RMS typical range (0.05 - 0.35) to 1 - 10 scale
  let rawEnergy = Math.round(((rms - 0.05) / 0.3) * 9 + 1);
  if (isNaN(rawEnergy)) rawEnergy = 7;
  const energyScore = Math.max(1, Math.min(10, rawEnergy));

  // 3. Tempo / BPM Estimation
  // Detect low frequency energy peaks
  let estimatedBpm = 126;
  try {
    const bpmCandidate = estimateBpmFromBuffer(channelData, audioBuffer.sampleRate);
    if (bpmCandidate >= 115 && bpmCandidate <= 145) {
      estimatedBpm = bpmCandidate;
    }
  } catch {
    estimatedBpm = 126;
  }

  // 4. Camelot Key Hash Estimation
  const nameHash = file.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const camelotKey = CAMELOT_KEYS[nameHash % CAMELOT_KEYS.length];

  // 5. Parse Title & Artist from Filename
  let artist = "Unknown Artist";
  let title = file.name.replace(/\.[^/.]+$/, "");
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    artist = parts[0].trim();
    title = parts.slice(1).join(" - ").trim();
  }

  // 6. Generate 5 BPM-Dex Hot Cues
  const cuePoints: CuePoint[] = [
    {
      id: "cue_intro",
      name: "Intro Cue",
      timeSec: 0,
      timestamp: "00:00",
      color: "#10b981",
      type: "intro"
    },
    {
      id: "cue_drop1",
      name: "Drop 1 (Main)",
      timeSec: Math.min(Math.round(durationSec * 0.15), 45),
      timestamp: formatTime(Math.min(Math.round(durationSec * 0.15), 45)),
      color: "#ef4444",
      type: "drop"
    },
    {
      id: "cue_breakdown",
      name: "Breakdown",
      timeSec: Math.round(durationSec * 0.45),
      timestamp: formatTime(Math.round(durationSec * 0.45)),
      color: "#3b82f6",
      type: "breakdown"
    },
    {
      id: "cue_drop2",
      name: "Drop 2 (Peak)",
      timeSec: Math.round(durationSec * 0.65),
      timestamp: formatTime(Math.round(durationSec * 0.65)),
      color: "#f97316",
      type: "drop"
    },
    {
      id: "cue_outro",
      name: "Outro Mix-Out",
      timeSec: Math.max(durationSec - 45, Math.round(durationSec * 0.85)),
      timestamp: formatTime(Math.max(durationSec - 45, Math.round(durationSec * 0.85))),
      color: "#8b5cf6",
      type: "outro"
    }
  ];

  return {
    title,
    artist,
    durationSec,
    bpm: estimatedBpm,
    camelotKey,
    energyScore,
    danceability: Math.round((0.65 + (energyScore / 10) * 0.3) * 100) / 100,
    mood: energyScore >= 8 ? "Peak Time Club" : energyScore >= 6 ? "Hypnotic Jackin" : "Deep Atmospheric",
    cuePoints,
    waveformPeaks: normalizedPeaks
  };
}

function estimateBpmFromBuffer(data: Float32Array, sampleRate: number): number {
  // Simple peak interval counter on downsampled buffer
  const step = Math.floor(sampleRate / 100);
  const peaks: number[] = [];
  let threshold = 0.25;

  for (let i = 0; i < Math.min(data.length, sampleRate * 30); i += step) {
    if (Math.abs(data[i]) > threshold) {
      peaks.push(i);
    }
  }

  if (peaks.length < 10) return 126;
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const diff = (peaks[i] - peaks[i - 1]) / sampleRate;
    if (diff >= 0.38 && diff <= 0.58) { // 103 - 157 BPM range
      intervals.push(diff);
    }
  }

  if (intervals.length === 0) return 126;
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const calculated = Math.round(60 / avgInterval);
  return calculated >= 115 && calculated <= 145 ? calculated : 126;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
