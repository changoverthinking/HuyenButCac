import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MusicTrack } from "../../types/entities";
import { addMusicFiles, deleteMusicTrack, listMusicTracks, renameMusicTrack } from "../../features/media/mediaService";
import { cycleRepeatMode, nextTrackIndex, normalizeVolume, type RepeatMode } from "../../features/media/musicLogic";

const formatTime = (value: number) =>
  Number.isFinite(value)
    ? `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, "0")}`
    : "0:00";

function storageGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* iOS private/storage denied */ }
}

export function MusicPlayer() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState<RepeatMode>(() => (storageGet("hbc-music-repeat") as RepeatMode) || "off");
  const [shuffle, setShuffle] = useState(() => storageGet("hbc-music-shuffle") === "true");
  const [volume, setVolume] = useState(() => normalizeVolume(storageGet("hbc-music-volume")));
  const [message, setMessage] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);

  const current = tracks.find((track) => track.id === currentId) ?? null;
  const totalSize = useMemo(() => tracks.reduce((sum, track) => sum + track.size, 0), [tracks]);

  const releaseSource = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    loadedTrackIdRef.current = null;
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const loadSource = useCallback((track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return null;
    if (loadedTrackIdRef.current === track.id && objectUrlRef.current) return audio;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(track.audioBlob);
    objectUrlRef.current = url;
    loadedTrackIdRef.current = track.id;
    audio.src = url;
    audio.preload = "metadata";
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    return audio;
  }, []);

  const reload = useCallback(async () => {
    try {
      const items = await listMusicTracks();
      setTracks(items);
      setCurrentId((id) => {
        const preferred = id ?? storageGet("hbc-music-current");
        return preferred && items.some((item) => item.id === preferred)
          ? preferred
          : items[0]?.id ?? null;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đọc thư viện Tiên Âm Các.");
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const toggle = () => setExpanded((value) => !value);
    window.addEventListener("hbc-toggle-music", toggle);
    return () => window.removeEventListener("hbc-toggle-music", toggle);
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    const onWorkspaceChanged = () => {
      setPlaying(false);
      releaseSource();
      void reload();
    };
    window.addEventListener("hbc-workspace-changed", onWorkspaceChanged);
    return () => window.removeEventListener("hbc-workspace-changed", onWorkspaceChanged);
  }, [releaseSource, reload]);

  useEffect(() => {
    if (!current) {
      releaseSource();
      return;
    }
    loadSource(current);
  }, [current, loadSource, releaseSource]);

  useEffect(() => () => releaseSource(), [releaseSource]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (currentId) storageSet("hbc-music-current", currentId);
  }, [currentId]);
  useEffect(() => storageSet("hbc-music-repeat", repeat), [repeat]);
  useEffect(() => storageSet("hbc-music-shuffle", String(shuffle)), [shuffle]);
  useEffect(() => storageSet("hbc-music-volume", String(volume)), [volume]);

  const startTrack = useCallback(async (track: MusicTrack) => {
    const audio = loadSource(track);
    if (!audio) return;
    setCurrentId(track.id);
    setMessage("");
    try {
      // Gọi play() ngay trong chuỗi xử lý click/ended thay vì đợi useEffect.
      // Điều này đặc biệt quan trọng với Safari/iOS.
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setMessage("Safari/trình duyệt đã chặn phát tự động. Hãy bấm nút ▶ một lần nữa.");
    }
  }, [loadSource]);

  const chooseNext = useCallback((direction: 1 | -1, fromEnded = false) => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex((track) => track.id === currentId);
    const index = nextTrackIndex({
      length: tracks.length,
      currentIndex,
      direction,
      shuffle,
      repeat,
      fromEnded,
    });
    if (index === null) {
      setPlaying(false);
      return;
    }
    if (fromEnded && repeat === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
      return;
    }
    void startTrack(tracks[index]);
  }, [tracks, currentId, shuffle, repeat, startTrack]);

  const togglePlay = useCallback(async () => {
    if (!current) {
      if (tracks[0]) await startTrack(tracks[0]);
      return;
    }
    const audio = loadSource(current);
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
        setMessage("");
      } catch {
        setPlaying(false);
        setMessage("Trình duyệt chưa cho phép phát nhạc. Hãy bấm lại nút phát.");
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [current, tracks, loadSource, startTrack]);

  const selectTrack = useCallback((track: MusicTrack) => {
    setPlaying(false);
    setCurrentId(track.id);
    loadSource(track);
  }, [loadSource]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = current && typeof MediaMetadata !== "undefined"
        ? new MediaMetadata({ title: current.name, album: "Huyền Bút Các · Tiên Âm Các" })
        : null;
    } catch {
      // Safari phiên bản cũ có thể có mediaSession nhưng thiếu MediaMetadata đầy đủ.
    }

    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
    };

    setHandler("play", () => void togglePlay());
    setHandler("pause", () => void togglePlay());
    setHandler("previoustrack", () => chooseNext(-1));
    setHandler("nexttrack", () => chooseNext(1));

    return () => {
      setHandler("play", null);
      setHandler("pause", null);
      setHandler("previoustrack", null);
      setHandler("nexttrack", null);
    };
  }, [current, chooseNext, togglePlay]);

  const handleFiles = async (input: HTMLInputElement) => {
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    try {
      const added = await addMusicFiles(files);
      await reload();
      setMessage(`Đã lưu ${added.length} khúc trên thiết bị.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thêm tệp âm thanh.");
    } finally {
      input.value = "";
    }
  };

  return (
    <section
      className={`music-player immortal-music z-40 ${expanded ? "is-open" : "is-collapsed"}`}
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setMessage("Không đọc được tệp âm thanh này trên trình duyệt hiện tại.");
        }}
        onEnded={() => chooseNext(1, true)}
      />

      {expanded && (
        <div className="music-library immortal-panel flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div>
              <div className="immortal-title font-semibold"><span>◆</span> Tiên Âm Các <span>◆</span></div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {tracks.length} khúc · {(totalSize / 1024 / 1024).toFixed(1)} MB lưu trên thiết bị
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label
                className="px-3 py-2 rounded text-sm cursor-pointer"
                style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
              >
                ＋ Âm thanh
                <input
                  type="file"
                  accept=".mp3,.m4a,.aac,.wav,audio/mpeg,audio/mp4,audio/aac,audio/wav"
                  multiple
                  className="hidden"
                  onChange={(event) => void handleFiles(event.currentTarget)}
                />
              </label>
              <button
                className="grid w-9 h-9 place-items-center rounded-full"
                aria-label="Đóng Tiên Âm Các"
                title="Đóng Tiên Âm Các"
                style={{ background: "var(--color-surface-alt)" }}
                onClick={() => setExpanded(false)}
              >
                ←
              </button>
            </div>
          </div>

          {message && (
            <div className="px-3 py-2 text-xs" style={{ color: "var(--color-warning)" }}>
              {message}
            </div>
          )}

          <div className="overflow-y-auto p-2">
            {!tracks.length && (
              <p className="p-4 text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
                Chưa có âm thanh. Có thể thêm MP3, M4A/AAC hoặc WAV.
              </p>
            )}

            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-2 p-2 rounded mb-1"
                style={{ background: track.id === currentId ? "var(--color-surface-alt)" : "transparent" }}
              >
                <button className="w-8 h-8 rounded-full" onClick={() => void startTrack(track)}>
                  {track.id === currentId && playing ? "♫" : "▶"}
                </button>
                <button className="flex-1 min-w-0 text-left" onClick={() => selectTrack(track)}>
                  <div className="truncate text-sm">{index + 1}. {track.name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {(track.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </button>
                <button
                  title="Đổi tên"
                  onClick={async () => {
                    const name = window.prompt("Tên bài hát:", track.name)?.trim();
                    if (name) {
                      try {
                        await renameMusicTrack(track.id, name);
                        await reload();
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Không thể đổi tên.");
                      }
                    }
                  }}
                >
                  ✎
                </button>
                <button
                  title="Xóa bài"
                  style={{ color: "var(--color-error)" }}
                  onClick={async () => {
                    if (!window.confirm(`Xóa bài “${track.name}” khỏi ứng dụng?`)) return;
                    if (track.id === currentId) {
                      setPlaying(false);
                      releaseSource();
                    }
                    await deleteMusicTrack(track.id);
                    await reload();
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="music-controls immortal-panel h-16 md:h-14 px-2 md:px-4 items-center gap-2">
        <button
          aria-label="Mở thư viện nhạc"
          className="music-square-button w-9 h-9 rounded"
          onClick={() => setExpanded((value) => !value)}
        >
          ♫
        </button>

        <div className="hidden sm:block min-w-0 w-36">
          <div className="truncate text-sm">{current?.name ?? "Chưa có nhạc"}</div>
          <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <button className="music-plain-button" aria-label="Bài trước" onClick={() => chooseNext(-1)}>⏮</button>
        <button
          aria-label={playing ? "Tạm dừng" : "Phát"}
          className={`music-play-button w-10 h-10 rounded-full ${playing ? "is-playing" : ""}`}
          onClick={() => void togglePlay()}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button className="music-plain-button" aria-label="Bài tiếp theo" onClick={() => chooseNext(1)}>⏭</button>

        <input
          aria-label="Tua bài hát"
          className="music-seek flex-1 min-w-12 accent-[var(--color-accent)]"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (audioRef.current) audioRef.current.currentTime = value;
            setCurrentTime(value);
          }}
        />

        <button
          className="music-plain-button"
          aria-label="Phát ngẫu nhiên"
          title="Phát ngẫu nhiên"
          onClick={() => setShuffle((value) => !value)}
          style={{ color: shuffle ? "var(--color-accent)" : "var(--color-text-muted)" }}
        >
          🔀
        </button>

        <button
          className="music-plain-button"
          aria-label="Chế độ lặp"
          title="Tắt lặp / Lặp danh sách / Lặp một bài"
          onClick={() => setRepeat(cycleRepeatMode)}
          style={{ color: repeat !== "off" ? "var(--color-accent)" : "var(--color-text-muted)" }}
        >
          {repeat === "one" ? "🔂" : "🔁"}
        </button>

        <label className="hidden md:flex items-center gap-1 text-xs">
          🔊
          <input
            aria-label="Âm lượng"
            className="w-20"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
}
