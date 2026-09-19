import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Music,
  Image as ImageIcon,
  Copy,
  Check,
  Disc,
  Clock,
  Tag,
  Radio,
  Share2,
  Play,
  Pause,
  Sliders,
  ExternalLink,
  Layers,
  Terminal,
  Trash2,
  Volume2,
  RefreshCw,
  Zap,
  HardDrive,
  Compass,
  FolderSync,
  Flame,
  CheckCircle2,
  Bookmark,
  FileCode,
  Wand2
} from "lucide-react";
import SplashScreen from "./components/SplashScreen.js";
import DjPromptCreator from "./components/DjPromptCreator.js";

interface CuePoint {
  id: string;
  name: string;
  timeSec: number;
  timestamp: string;
  color: string;
  type: string;
}

interface ArtworkPrompt {
  id: string;
  styleName: string;
  promptText: string;
  aspectRatio: string;
  negativePrompt?: string;
  generatedImageUrl?: string;
}

interface EngineTrackItem {
  index: number;
  artist: string;
  title: string;
  timestamp?: string;
  durationSeconds?: number;
  bpm?: number;
  key?: string;
  camelotKey?: string;
  energyScore?: number;
  cuePoints?: CuePoint[];
}

interface SoundcloudRelease {
  id: string;
  createdAt: string;
  titleSuggestions: string[];
  selectedTitle: string;
  primaryGenre: string;
  subGenres: string[];
  tags: string[];
  description: string;
  tracklistFormatted: string;
  parsedTracks?: EngineTrackItem[];
  artworkPrompts: ArtworkPrompt[];
  releaseStrategyTips: string[];
  socialKit?: {
    instagramCaption: string;
    tiktokHooks: string[];
    repostOutreach: string;
  };
  status: string;
}

const DEFAULT_CUES: CuePoint[] = [
  { id: "c1", name: "Intro", timeSec: 0, timestamp: "00:00", color: "#10b981", type: "intro" },
  { id: "c2", name: "Drop 1", timeSec: 45, timestamp: "00:45", color: "#ef4444", type: "drop" },
  { id: "c3", name: "Breakdown", timeSec: 135, timestamp: "02:15", color: "#3b82f6", type: "breakdown" },
  { id: "c4", name: "Drop 2", timeSec: 195, timestamp: "03:15", color: "#f97316", type: "drop" },
  { id: "c5", name: "Outro", timeSec: 255, timestamp: "04:15", color: "#8b5cf6", type: "outro" }
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<"soundcloud" | "harmonic" | "usb" | "dj-prompt">("soundcloud");
  const [releases, setReleases] = useState<SoundcloudRelease[]>([]);
  const [activeRelease, setActiveRelease] = useState<SoundcloudRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Compiling release kit...");
  const [parsing, setParsing] = useState(false);
  const [renderingArtwork, setRenderingArtwork] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPlayingSim, setIsPlayingSim] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(25);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [vibe, setVibe] = useState("Diepe, strakke Chicago House met rauwe jackin drums en analoge 909 percussie.");
  const [bpmRange, setBpmRange] = useState("125 - 127 BPM");
  const [rawTracklist, setRawTracklist] = useState(
    "Dennis Quin - Chant Groove\nKerri Chandler - Atmosphere (Jerome Sydenham Remix)\nSoulcraft - Midnight Jack (Original Mix)\nFloorplan - Never Grow Old\nCatz 'n Dogz - Jack (Club Tool)"
  );

  // Harmonic Builder State (v8.0)
  const [harmonicTracks, setHarmonicTracks] = useState([
    { id: "1", title: "Chant Groove", artist: "Dennis Quin", bpm: 125, camelotKey: "8A", energyLevel: 0.7 },
    { id: "2", title: "Atmosphere", artist: "Kerri Chandler", bpm: 126, camelotKey: "9A", energyLevel: 0.8 },
    { id: "3", title: "Midnight Jack", artist: "Soulcraft", bpm: 126, camelotKey: "10A", energyLevel: 0.85 },
    { id: "4", title: "Never Grow Old", artist: "Floorplan", bpm: 127, camelotKey: "11A", energyLevel: 0.95 },
    { id: "5", title: "Jack (Club Tool)", artist: "Catz 'n Dogz", bpm: 126, camelotKey: "11B", energyLevel: 0.9 }
  ]);
  const [harmonicTransitions, setHarmonicTransitions] = useState<any[]>([]);

  // USB Sync State (v9.0)
  const [usbPath, setUsbPath] = useState("E:/");
  const [targetSoftware, setTargetSoftware] = useState<"ENGINE_DJ" | "REKORDBOX" | "TRAKTOR_PRO_4">("REKORDBOX");
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  // Waveform playback simulation timer
  useEffect(() => {
    let interval: any;
    if (isPlayingSim) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => (prev >= 100 ? 0 : prev + 0.4));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlayingSim]);

  async function fetchReleases() {
    try {
      const res = await fetch("/api/releases");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setReleases(json.data);
        if (!activeRelease) setActiveRelease(json.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoadingStatus("Verwerken van set met BPM-Dex & Mixed-in-Key analyse...");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/releases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibeDescription: vibe, bpmRange, rawTracklist })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setReleases([json.data, ...releases.filter((r) => r.id !== json.data.id)]);
        setActiveRelease(json.data);
      } else {
        setErrorMsg(json.error || "Er is een fout opgetreden bij het genereren.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Netwerkfout bij verbinden met Fastify API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickParse() {
    if (!rawTracklist.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/tools/parse-tracklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawTracklist, avgDuration: 4.5 })
      });
      const json = await res.json();
      if (json.success && json.data?.formattedString) {
        setRawTracklist(json.data.formattedString);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setParsing(false);
    }
  }

  async function handleRenderArtwork(promptItem: ArtworkPrompt) {
    if (!activeRelease) return;
    setRenderingArtwork(promptItem.id);
    setLoading(true);
    setLoadingStatus("Renderen van 1:1 hoge resolutie club cover...");
    try {
      const res = await fetch(`/api/releases/${activeRelease.id}/artwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: promptItem.id, promptText: promptItem.promptText })
      });
      const json = await res.json();
      if (json.success && json.release) {
        setActiveRelease(json.release);
        setReleases((prev) => prev.map((r) => (r.id === json.release.id ? json.release : r)));
      }
    } catch (e) {
      console.error("Artwork error:", e);
    } finally {
      setRenderingArtwork(null);
      setLoading(false);
    }
  }

  async function handleOptimizeHarmonic() {
    setLoading(true);
    setLoadingStatus("Berekenen van Camelot Wheel transities...");
    try {
      const res = await fetch("/api/harmonic/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: harmonicTracks })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setHarmonicTracks(json.data.setlist);
        setHarmonicTransitions(json.data.transitions);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUsbSync() {
    setSyncing(true);
    setSyncSuccess(null);
    try {
      const res = await fetch("/api/usb/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks: activeRelease?.parsedTracks || harmonicTracks,
          playlistName: activeRelease?.selectedTitle || "Soulcraft_Set",
          target: { usbMountPath: usbPath, softwareType: targetSoftware }
        })
      });
      const json = await res.json();
      if (json.success) {
        setSyncSuccess(`Succesvol geëxporteerd! Playlist: ${json.data.playlistFile}${json.data.xmlFile ? ` | Rekordbox XML: ${json.data.xmlFile}` : ""}`);
      }
    } finally {
      setSyncing(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const activeArtworkUrl =
    activeRelease?.artworkPrompts.find((p) => p.generatedImageUrl)?.generatedImageUrl ||
    "/logo.jpg";

  // Hot Cues for current set simulation (using track 1 cues or default)
  const currentCues: CuePoint[] = activeRelease?.parsedTracks?.[0]?.cuePoints || DEFAULT_CUES;
  const currentEnergyScore = activeRelease?.parsedTracks?.[0]?.energyScore || 8;

  function jumpToCue(cue: CuePoint) {
    const totalSimSeconds = 300; // 5 min track
    const pct = Math.min(100, Math.max(0, (cue.timeSec / totalSimSeconds) * 100));
    setPlaybackProgress(pct);
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans relative">
      {/* Startup Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Loading Modal with Custom Logo */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-zinc-950 border border-orange-500/40 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl shadow-orange-600/30">
            <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-orange-500 shadow-lg shadow-orange-500/40 p-1 bg-black">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-600/40 via-transparent to-transparent animate-spin-slow pointer-events-none"></div>
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">SOULCRAFT COPILOT v9.0</h3>
              <p className="text-xs text-orange-400 font-mono mt-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                {loadingStatus}
              </p>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Studio Header with User Logo */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative h-11 w-11 rounded-xl bg-zinc-900 border border-orange-500/50 overflow-hidden shadow-lg shadow-orange-600/30 flex-shrink-0 group cursor-pointer" onClick={() => setShowSplash(true)}>
            <img src="/logo.jpg" alt="Soulcraft Logo" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                SOULCRAFT <span className="text-orange-500">STUDIO</span>
              </h1>
              <span className="text-[9px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono border border-orange-500/20 font-bold">
                BPM-DEX v9.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">Mixed-in-Key Grade • Waveform Hot Cues • Universal DJ Sync</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("soundcloud")}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === "soundcloud"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            SoundCloud Master & Cues
          </button>
          <button
            onClick={() => setActiveTab("harmonic")}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === "harmonic"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Harmonic Camelot Builder
          </button>
          <button
            onClick={() => setActiveTab("usb")}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === "usb"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Universal DJ Export (Rekordbox / Engine)
          </button>
          <button
            onClick={() => setActiveTab("dj-prompt")}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === "dj-prompt"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Ultimate DJ Creator
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* TAB 1: SOUNDCLOUD MASTER & HOT CUES */}
        {activeTab === "soundcloud" && (
          <>
            {/* Left Sidebar */}
            <aside className="w-full lg:w-[380px] border-r border-zinc-800/80 bg-zinc-950/40 p-5 flex flex-col gap-6 overflow-y-auto">
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-400" />
                    Engine DJ Set Invoer
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">v9.0 CUES</span>
                </h2>

                {errorMsg && (
                  <div className="mb-3 p-2.5 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-300">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleGenerate} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">Set Thema / Sfeer</label>
                    <textarea
                      rows={2}
                      value={vibe}
                      onChange={(e) => setVibe(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-400 block mb-1">BPM Range</label>
                    <input
                      type="text"
                      value={bpmRange}
                      onChange={(e) => setBpmRange(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-zinc-400">Denon Playlist / History Export</label>
                      <button
                        type="button"
                        onClick={handleQuickParse}
                        disabled={parsing}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-mono flex items-center gap-1"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${parsing ? "animate-spin" : ""}`} />
                        Bereken Timestamps & Cues
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={rawTracklist}
                      onChange={(e) => setRawTracklist(e.target.value)}
                      placeholder="Plak hier je tracks of M3U playlist export..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-50 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    Compileer Release Kit (v9.0)
                  </button>
                </form>
              </div>

              {/* Releases Archive */}
              <div className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
                  <span>Releases Archief</span>
                  <span className="font-mono text-[10px]">{releases.length} opgeslagen</span>
                </h3>
                <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
                  {releases.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => setActiveRelease(rel)}
                      className={`w-full cursor-pointer text-left p-3 rounded-lg border transition group flex items-start justify-between ${
                        activeRelease?.id === rel.id
                          ? "bg-zinc-800/90 border-orange-500/60 shadow-md"
                          : "bg-zinc-900/30 border-zinc-800/40 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex-1 pr-2 min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                          {rel.selectedTitle}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center justify-between mt-1 font-mono">
                          <span className="text-orange-400/80">{rel.primaryGenre}</span>
                          <span>{new Date(rel.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Stage: Interactive SoundCloud Player + Hot Cue Markers */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
              {activeRelease ? (
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* SOUNDCLOUD PLAYER SIMULATION */}
                  <div className="bg-[#121214] border border-zinc-800/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <button
                          onClick={() => setIsPlayingSim(!isPlayingSim)}
                          className="w-16 h-16 rounded-full bg-[#f50] hover:bg-[#ff5500] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition transform hover:scale-105 active:scale-95 flex-shrink-0"
                        >
                          {isPlayingSim ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full inline-block">
                              Live SoundCloud & Cue Simulation
                            </span>

                            {/* BPM-Dex Energy Score Badge (1-10) */}
                            <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
                              Energy Level: {currentEnergyScore}/10
                            </span>
                          </div>

                          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1.5">
                            {activeRelease.selectedTitle}
                          </h2>
                          <p className="text-xs text-zinc-400 font-mono mt-1">
                            Soulcraft • {activeRelease.primaryGenre} • {activeRelease.subGenres.join(" / ")}
                          </p>
                        </div>
                      </div>

                      {/* Artwork Thumbnail */}
                      <div className="w-28 h-28 rounded-xl bg-zinc-900 border border-zinc-700/80 overflow-hidden flex-shrink-0 relative group shadow-lg">
                        <img src={activeArtworkUrl} alt="Cover" className="w-full h-full object-cover transition transform group-hover:scale-105 duration-300" />
                        <a href={activeArtworkUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Waveform Scrubber with Hot Cue Flags */}
                    <div className="mt-6 space-y-2 relative z-10">
                      <div className="relative">
                        {/* Waveform Bars */}
                        <div
                          className="h-14 w-full flex items-end gap-[2px] cursor-pointer group py-1"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPlaybackProgress(((e.clientX - rect.left) / rect.width) * 100);
                          }}
                        >
                          {Array.from({ length: 96 }).map((_, i) => {
                            const height = Math.min(100, Math.max(18, Math.sin(i * 0.28) * 38 + Math.cos(i * 0.7) * 30 + 52));
                            const isPast = (i / 96) * 100 <= playbackProgress;
                            return (
                              <div
                                key={i}
                                style={{ height: `${height}%` }}
                                className={`flex-1 rounded-[1px] transition-all duration-75 ${
                                  isPast ? "bg-[#f50]" : "bg-zinc-700 hover:bg-zinc-400 group-hover:opacity-90"
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Visual Cue Markers on Waveform */}
                        <div className="absolute top-0 inset-x-0 h-full pointer-events-none">
                          {currentCues.map((cue) => {
                            const pct = (cue.timeSec / 300) * 100;
                            return (
                              <div
                                key={cue.id}
                                style={{ left: `${pct}%` }}
                                className="absolute top-0 bottom-0 w-[2px] pointer-events-auto cursor-pointer flex flex-col items-center"
                                onClick={() => jumpToCue(cue)}
                                title={`Spring naar ${cue.name} (${cue.timestamp})`}
                              >
                                <div
                                  style={{ backgroundColor: cue.color }}
                                  className="text-[9px] font-mono text-black font-extrabold px-1.5 py-0.5 rounded shadow-md transform -translate-y-2 hover:scale-110 transition"
                                >
                                  {cue.name}
                                </div>
                                <div style={{ backgroundColor: cue.color }} className="w-full flex-1 opacity-80"></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cue Quick Jump Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                            <Bookmark className="w-3 h-3 text-orange-400" /> Hot Cues:
                          </span>
                          {currentCues.map((cue) => (
                            <button
                              key={cue.id}
                              onClick={() => jumpToCue(cue)}
                              style={{ borderColor: `${cue.color}60` }}
                              className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 border transition flex items-center gap-1"
                            >
                              <span style={{ backgroundColor: cue.color }} className="w-2 h-2 rounded-full inline-block"></span>
                              <span className="font-bold text-zinc-200">{cue.name}</span>
                              <span className="text-zinc-500">({cue.timestamp})</span>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
                          <span className="text-orange-400">
                            {String(Math.floor((playbackProgress * 36) / 60)).padStart(2, "0")}:
                            {String(Math.floor((playbackProgress * 36) % 60)).padStart(2, "0")}
                          </span>
                          <span>60:00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Artwork Prompts & Metadata Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Prompts */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-orange-400" />
                        Artwork Studio (1:1 Cover Art)
                      </h3>
                      {activeRelease.artworkPrompts.map((prompt) => (
                        <div key={prompt.id} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-orange-400">{prompt.styleName}</span>
                            <button
                              onClick={() => copy(prompt.promptText, prompt.id)}
                              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey === prompt.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              Kopieer
                            </button>
                          </div>
                          <p className="text-xs text-zinc-300 font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800 leading-relaxed">
                            {prompt.promptText}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            {prompt.generatedImageUrl ? (
                              <a href={prompt.generatedImageUrl} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-mono">
                                Bekijk High-Res Cover <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-zinc-500 font-mono">Nog niet gerenderd</span>
                            )}
                            <button
                              onClick={() => handleRenderArtwork(prompt)}
                              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-lg shadow-orange-600/20"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Genereer Cover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tracklist & Social Kit */}
                    <div className="space-y-4">
                      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2 shadow-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <Music className="w-4 h-4 text-orange-400" />
                            SoundCloud Timestamps & Cue List
                          </h4>
                          <button onClick={() => copy(activeRelease.tracklistFormatted, "tl")} className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1">
                            {copiedKey === "tl" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            Kopieer
                          </button>
                        </div>
                        <pre className="text-xs font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {activeRelease.tracklistFormatted}
                        </pre>
                      </div>

                      {activeRelease.socialKit && (
                        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-orange-400" />
                            Instagram & Repost Pitch
                          </h4>
                          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-300 space-y-2">
                            <span className="font-bold text-orange-400">Instagram Caption:</span>
                            <p className="whitespace-pre-line leading-relaxed">{activeRelease.socialKit.instagramCaption}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Disc className="w-16 h-16 text-zinc-700 animate-spin-slow mb-3" />
                  <p className="text-sm font-medium text-zinc-400">Geen release geselecteerd</p>
                  <p className="text-xs text-zinc-500">Compileer een release in het linker menu.</p>
                </div>
              )}
            </main>
          </>
        )}

        {/* TAB 2: HARMONIC CAMELOT BUILDER (v8.0) */}
        {activeTab === "harmonic" && (
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6 max-w-5xl mx-auto">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-orange-400" />
                    Harmonic Pathfinding & Camelot Wheel Planner (v9.0)
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Berekent de vloeiendste toonsoort-transities en energy boost sprongen voor je Denon set.
                  </p>
                </div>

                <button
                  onClick={handleOptimizeHarmonic}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-orange-600/20 flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  Optimaliseer Harmonic Flow
                </button>
              </div>

              {/* Tracks List */}
              <div className="space-y-2">
                {harmonicTracks.map((track, idx) => {
                  const transition = harmonicTransitions[idx];
                  return (
                    <div key={track.id} className="space-y-1.5">
                      <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-800 text-orange-400 font-mono text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-zinc-200">{track.artist} - {track.title}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{track.bpm} BPM</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-orange-500/10 text-orange-300 border border-orange-500/30">
                            {track.camelotKey}
                          </span>
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded font-bold flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400 fill-current" />
                            Level {Math.round(track.energyLevel * 10)}/10
                          </span>
                        </div>
                      </div>

                      {transition && (
                        <div className="ml-8 pl-4 border-l-2 border-orange-500/30 py-1 text-[11px] font-mono flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            transition.energyShift === "boost"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : transition.energyShift === "smooth"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {transition.energyShift.toUpperCase()}
                          </span>
                          <span className="text-zinc-400">{transition.description}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        )}

        {/* TAB 3: UNIVERSAL DJ EXPORT (REKORDBOX / ENGINE DJ) */}
        {activeTab === "usb" && (
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6 max-w-4xl mx-auto">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-orange-400" />
                  Universal DJ Export Center (Pioneer Rekordbox & Denon Engine)
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Exporteer playlists inclusief alle Hot Cues (Intro, Drop 1, Breakdown, Drop 2, Outro) en Camelot toonsoorten.
                </p>
              </div>

              {syncSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {syncSuccess}
                </div>
              )}

              <div className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">USB Schijfpad (of map)</label>
                  <input
                    type="text"
                    value={usbPath}
                    onChange={(e) => setUsbPath(e.target.value)}
                    placeholder="bijv. E:/ of C:/Users/.../Soulcraft_USB"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Doel DJ Software Database</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTargetSoftware("REKORDBOX")}
                      className={`p-3 rounded-xl border text-left text-xs transition ${
                        targetSoftware === "REKORDBOX"
                          ? "bg-orange-600/20 border-orange-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="font-bold text-orange-400 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5" /> Pioneer Rekordbox
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">XML Export met Hot Cues</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetSoftware("ENGINE_DJ")}
                      className={`p-3 rounded-xl border text-left text-xs transition ${
                        targetSoftware === "ENGINE_DJ"
                          ? "bg-orange-600/20 border-orange-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="font-bold text-orange-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" /> Denon Engine DJ
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">SC Live 2 Standalone</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetSoftware("TRAKTOR_PRO_4")}
                      className={`p-3 rounded-xl border text-left text-xs transition ${
                        targetSoftware === "TRAKTOR_PRO_4"
                          ? "bg-orange-600/20 border-orange-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div className="font-bold text-orange-400">Traktor Pro 4 / Serato</div>
                      <div className="text-[10px] text-zinc-500 mt-1">M3U8 Playlist Structuur</div>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUsbSync}
                  disabled={syncing}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition"
                >
                  <FolderSync className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Bezig met exporteren..." : "Exporteer naar DJ Library (XML / M3U8)"}
                </button>
              </div>
            </div>
          </main>
        )}

        {/* TAB 4: ULTIMATE DJ PROMPT CREATOR (LEXICON DJ ULTIMATE & UPC) */}
        {activeTab === "dj-prompt" && <DjPromptCreator />}
      </div>
    </div>
  );
}
