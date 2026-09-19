import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Music,
  FolderPlus,
  Trash2,
  Play,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Flame,
  FileAudio,
  HardDrive,
  Download,
  Tag,
  Folder,
  Sliders,
  Plus
} from "lucide-react";
import { LibraryTrack, Crate } from "../../types/library.js";
import { scanAudioFile } from "../utils/audioScanner.js";

interface DjMusicLibraryProps {
  onPlayTrack: (track: LibraryTrack) => void;
  activeTrackId?: string;
}

export default function DjMusicLibrary({ onPlayTrack, activeTrackId }: DjMusicLibraryProps) {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [selectedCrateId, setSelectedCrateId] = useState("crate_all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [minEnergy, setMinEnergy] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [newCrateName, setNewCrateName] = useState("");
  const [showNewCrateInput, setShowNewCrateInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadLibrary();
  }, [selectedCrateId]);

  async function loadLibrary() {
    setLoading(true);
    try {
      const [tracksRes, cratesRes] = await Promise.all([
        fetch(`/api/library/tracks?crateId=${selectedCrateId}`),
        fetch("/api/library/crates")
      ]);
      const [tracksData, cratesData] = await Promise.all([
        tracksRes.json(),
        cratesRes.json()
      ]);

      if (tracksData.success) {
        setTracks(tracksData.data);
      }
      if (cratesData.success) {
        setCrates(cratesData.data);
      }
    } catch (err) {
      console.error("Fout bij laden van library:", err);
    } finally {
      setLoading(false);
    }
  }

  // Bestanden inladen & Scannen via Web Audio API
  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setScanning(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setScanStatus(`Scannen (${i + 1}/${files.length}): ${file.name}...`);

      try {
        // 1. Scan audio data via Web Audio API in de browser
        const scanResult = await scanAudioFile(file);

        // 2. Maak lokaal direct afspeelbare object URL
        const localBlobUrl = URL.createObjectURL(file);

        const newTrack: LibraryTrack = {
          id: `trk_${Date.now()}_${i}`,
          title: scanResult.title,
          artist: scanResult.artist,
          durationSec: scanResult.durationSec,
          bpm: scanResult.bpm,
          camelotKey: scanResult.camelotKey,
          energyScore: scanResult.energyScore,
          danceability: scanResult.danceability,
          mood: scanResult.mood,
          cuePoints: scanResult.cuePoints,
          waveformPeaks: scanResult.waveformPeaks,
          audioUrl: localBlobUrl,
          fileName: file.name,
          fileSize: file.size,
          crateIds: selectedCrateId === "crate_all" ? ["crate_all"] : ["crate_all", selectedCrateId],
          addedAt: new Date().toISOString()
        };

        // 3. Sla track op via backend API
        await fetch("/api/library/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTrack)
        });

        // 4. Update lokale state
        setTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)]);
      } catch (err) {
        console.error(`Fout bij scannen van ${file.name}:`, err);
      }
    }

    setScanning(false);
    setScanStatus("");
    loadLibrary();
  }

  async function handleCreateCrate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCrateName.trim()) return;
    try {
      const res = await fetch("/api/library/crates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCrateName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCrates((prev) => [...prev, data.data]);
        setSelectedCrateId(data.data.id);
        setNewCrateName("");
        setShowNewCrateInput(false);
      }
    } catch (err) {
      console.error("Crate aanmaken fout:", err);
    }
  }

  async function handleDeleteTrack(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Weet je zeker dat je deze track uit je library wilt verwijderen?")) return;
    try {
      await fetch(`/api/library/tracks/${id}`, { method: "DELETE" });
      setTracks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Fout bij verwijderen track:", err);
    }
  }

  async function handleExportRekordbox() {
    if (tracks.length === 0) return;
    try {
      const activeCrate = crates.find((c) => c.id === selectedCrateId);
      const res = await fetch("/api/export/rekordbox-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks: tracks.map((t) => ({
            title: t.title,
            artist: t.artist,
            durationSeconds: t.durationSec,
            bpm: t.bpm,
            camelotKey: t.camelotKey,
            energyScore: t.energyScore,
            cuePoints: t.cuePoints
          })),
          playlistName: activeCrate?.name || "Soulcraft_Library"
        })
      });
      const xmlBlob = await res.blob();
      const url = URL.createObjectURL(xmlBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeCrate?.name || 'Soulcraft_Library'}_rekordbox.xml`;
      a.click();
    } catch (err) {
      console.error("Export fout:", err);
    }
  }

  const filteredTracks = tracks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText = t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
      if (!matchText) return false;
    }
    if (selectedKey && t.camelotKey !== selectedKey) return false;
    if (t.energyScore < minEnergy) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-zinc-950">
      {/* Sidebar: Crates / Playlists */}
      <aside className="w-full lg:w-64 border-r border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">DJ Crates</h3>
          </div>
          <button
            onClick={() => setShowNewCrateInput(!showNewCrateInput)}
            className="p-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Nieuwe Crate"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Create Crate Form */}
        {showNewCrateInput && (
          <form onSubmit={handleCreateCrate} className="flex gap-1.5 animate-in fade-in duration-200">
            <input
              type="text"
              value={newCrateName}
              onChange={(e) => setNewCrateName(e.target.value)}
              placeholder="Crate naam..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition"
            >
              OK
            </button>
          </form>
        )}

        {/* Crates List */}
        <div className="flex flex-col gap-1">
          {crates.map((c) => {
            const isSelected = selectedCrateId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCrateId(c.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 font-bold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}></span>
                  <span className="truncate">{c.name}</span>
                </div>
                {c.trackCount !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? "bg-white/20 text-white" : "bg-zinc-900 text-zinc-500"}`}>
                    {c.trackCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Export Box */}
        <div className="mt-auto pt-4 border-t border-zinc-900 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExportRekordbox}
            disabled={tracks.length === 0}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            Exporteer Rekordbox XML
          </button>
        </div>
      </aside>

      {/* Main Content Area: Upload zone, Filters & Track Table */}
      <main className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto pb-24">
        {/* Upload & Drag Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFilesSelected(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-inner ${
            isDragOver
              ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
              : "border-zinc-800 hover:border-orange-500/50 bg-zinc-950/70 hover:bg-zinc-900/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.flac,.m4a,.aif,.aiff,.ogg"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />

          {scanning ? (
            <div className="flex flex-col items-center gap-2 animate-pulse">
              <Sparkles className="w-8 h-8 text-orange-400 animate-spin" />
              <div className="text-sm font-bold text-white">{scanStatus}</div>
              <p className="text-xs text-orange-400 font-mono">BPM detectie • Camelot Key • 1-10 Energy Rating • Waveform Cues</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-12 w-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-1">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-white">Sleep audiobestanden hierheen of klik om te uploaden</h3>
              <p className="text-xs text-zinc-400 max-w-md">
                Ondersteunt MP3, WAV, FLAC, AIFF, M4A. Wordt direct lokaal gescand via de Web Audio engine en geanalyseerd op tempo, toonsoort, energieniveau en hot cues.
              </p>
            </div>
          )}
        </div>

        {/* Filter Bar: Search, Key filter & Energy Slider */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/80">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op titel of artiest..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Energy Filter */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <span className="text-zinc-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Min. Energy:
            </span>
            <span className="text-orange-400 font-bold font-mono">{minEnergy}/10</span>
            <input
              type="range"
              min="1"
              max="10"
              value={minEnergy}
              onChange={(e) => setMinEnergy(parseInt(e.target.value))}
              className="w-20 accent-orange-500 h-1 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          {/* Track Count & Reset */}
          <div className="text-xs font-mono text-zinc-400">
            {filteredTracks.length} track{filteredTracks.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Tracklist Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {filteredTracks.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Music className="w-8 h-8 text-zinc-600" />
              <h4 className="text-sm font-bold text-zinc-300">Geen tracks gevonden</h4>
              <p className="text-xs text-zinc-500 max-w-sm">
                Sleep audiobestanden in de uploadzone hierboven om je eigen muziekcollectie op te bouwen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 overflow-x-auto">
              {filteredTracks.map((t) => {
                const isActive = activeTrackId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => onPlayTrack(t)}
                    className={`p-3.5 flex items-center gap-4 hover:bg-zinc-900/60 transition cursor-pointer group ${
                      isActive ? "bg-orange-500/10 border-l-2 border-orange-500" : ""
                    }`}
                  >
                    {/* Play / Status Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(t);
                      }}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                        isActive
                          ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                          : "bg-zinc-900 group-hover:bg-orange-600 group-hover:text-white text-zinc-400 border border-zinc-800"
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>

                    {/* Title & Artist */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{t.title}</span>
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 truncate block">{t.artist}</span>
                    </div>

                    {/* Waveform Thumbnail */}
                    <div className="hidden sm:flex items-end gap-[1px] h-7 w-24 bg-zinc-900/80 p-1 rounded border border-zinc-800/80 flex-shrink-0">
                      {t.waveformPeaks?.slice(0, 30).map((p, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-orange-500/70 rounded-t-sm"
                          style={{ height: `${Math.max(15, p * 100)}%` }}
                        />
                      ))}
                    </div>

                    {/* Camelot Key Badge */}
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 flex-shrink-0">
                      {t.camelotKey || "8A"}
                    </span>

                    {/* BPM Badge */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex-shrink-0">
                      {t.bpm || 126} BPM
                    </span>

                    {/* Energy 1-10 Badge */}
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 flex-shrink-0">
                      <Flame className="w-2.5 h-2.5 text-amber-400" />
                      {t.energyScore || 7}/10
                    </span>

                    {/* Cue Count */}
                    <span className="hidden md:inline-block text-[10px] font-mono text-zinc-500 flex-shrink-0">
                      {t.cuePoints?.length || 5} Cues
                    </span>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTrack(t.id, e)}
                      className="text-zinc-600 hover:text-red-400 p-1 rounded transition opacity-0 group-hover:opacity-100"
                      title="Verwijder Track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
