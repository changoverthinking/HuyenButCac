import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MusicTrack } from "../../types/entities";
import {
  addMusicFiles,
  deleteMusicTrack,
  listMusicTracks,
  renameMusicTrack,
} from "../../features/media/mediaService";
import {
  cycleRepeatMode,
  nextTrackIndex,
  normalizeVolume,
  type RepeatMode,
} from "../../features/media/musicLogic";

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

type MusicContextValue = {
  tracks: MusicTrack[];
  current: MusicTrack | null;
  currentId: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  repeat: RepeatMode;
  shuffle: boolean;
  volume: number;
  message: string;
  totalSize: number;
  togglePlay: () => Promise<void>;
  startTrack: (track: MusicTrack) => Promise<void>;
  selectTrack: (track: MusicTrack) => void;
  chooseNext: (direction: 1 | -1, fromEnded?: boolean) => void;
  seek: (time: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  setShuffle: (value: boolean) => void;
  setVolume: (value: number) => void;
  addFiles: (files: File[]) => Promise<void>;
  renameTrack: (track: MusicTrack) => Promise<void>;
  removeTrack: (track: MusicTrack) => Promise<void>;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState<RepeatMode>(() => (storageGet("hbc-music-repeat") as RepeatMode) || "off");
  const [shuffle, setShuffle] = useState(() => storageGet("hbc-music-shuffle") === "true");
  const [volume, setVolume] = useState(() => normalizeVolume(storageGet("hbc-music-volume")));
  const [message, setMessage] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);
  const reloadRequestRef = useRef(0);

  const current = tracks.find((track) => track.id === currentId) ?? null;
  const totalSize = useMemo(() => tracks.reduce((sum, track) => sum + track.size, 0), [tracks]);

  const releaseSource = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      try { audio.pause(); } catch { /* jsdom/old browser */ }
      audio.removeAttribute("src");
      try { audio.load(); } catch { /* jsdom/old browser */ }
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
    try { audio.load(); } catch { /* jsdom/old browser */ }
    setCurrentTime(0);
    setDuration(0);
    return audio;
  }, []);

  const reload = useCallback(async () => {
    const requestId = ++reloadRequestRef.current;
    try {
      const items = await listMusicTracks();
      if (requestId !== reloadRequestRef.current) return;
      setTracks(items);
      setCurrentId((id) => {
        const preferred = id ?? storageGet("hbc-music-current");
        return preferred && items.some((item) => item.id === preferred)
          ? preferred
          : items[0]?.id ?? null;
      });
      setMessage("");
    } catch (error) {
      if (requestId !== reloadRequestRef.current) return;
      setMessage(error instanceof Error ? error.message : "Không thể đọc thư viện Tiên Âm Các.");
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const onWorkspaceChanged = () => {
      // Hủy kết quả list đang chạy ở workspace cũ trước khi đọc workspace mới.
      reloadRequestRef.current += 1;
      setPlaying(false);
      releaseSource();
      setTracks([]);
      setCurrentId(null);
      void reload();
    };
    window.addEventListener("hbc-workspace-changed", onWorkspaceChanged);
    return () => window.removeEventListener("hbc-workspace-changed", onWorkspaceChanged);
  }, [releaseSource, reload]);

  useEffect(() => {
    if (!current) {
      if (loadedTrackIdRef.current) releaseSource();
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
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setMessage("Trình duyệt đã chặn phát tự động. Hãy bấm nút ▶ một lần nữa.");
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
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.pause();
    setPlaying(false);
    setCurrentId(track.id);
    loadSource(track);
  }, [loadSource]);

  const seek = useCallback((time: number) => {
    const safe = Math.max(0, Math.min(Number.isFinite(duration) ? duration : time, time));
    if (audioRef.current) audioRef.current.currentTime = safe;
    setCurrentTime(safe);
  }, [duration]);

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    try {
      const added = await addMusicFiles(files);
      await reload();
      setMessage(`Đã lưu ${added.length} khúc trên thiết bị.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thêm tệp âm thanh.");
    }
  }, [reload]);

  const renameTrack = useCallback(async (track: MusicTrack) => {
    const name = window.prompt("Tên bài hát:", track.name)?.trim();
    if (!name) return;
    try {
      await renameMusicTrack(track.id, name);
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đổi tên.");
    }
  }, [reload]);

  const removeTrack = useCallback(async (track: MusicTrack) => {
    if (!window.confirm(`Xóa bài “${track.name}” khỏi ứng dụng?`)) return;
    try {
      if (track.id === currentId) {
        setPlaying(false);
        releaseSource();
      }
      await deleteMusicTrack(track.id);
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa bài hát.");
    }
  }, [currentId, releaseSource, reload]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = current && typeof MediaMetadata !== "undefined"
        ? new MediaMetadata({ title: current.name, album: "Huyền Bút Các · Tiên Âm Các" })
        : null;
    } catch {
      // Safari cũ có thể có mediaSession nhưng thiếu MediaMetadata đầy đủ.
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

  const value = useMemo<MusicContextValue>(() => ({
    tracks,
    current,
    currentId,
    playing,
    currentTime,
    duration,
    repeat,
    shuffle,
    volume,
    message,
    totalSize,
    togglePlay,
    startTrack,
    selectTrack,
    chooseNext,
    seek,
    setRepeat,
    setShuffle,
    setVolume,
    addFiles,
    renameTrack,
    removeTrack,
  }), [
    tracks, current, currentId, playing, currentTime, duration, repeat, shuffle, volume,
    message, totalSize, togglePlay, startTrack, selectTrack, chooseNext, seek, addFiles,
    renameTrack, removeTrack,
  ]);

  return (
    <MusicContext.Provider value={value}>
      <audio
        ref={audioRef}
        className="hbc-music-audio-engine"
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
      {children}
    </MusicContext.Provider>
  );
}

function MusicSettingsContent({ music }: { music: MusicContextValue }) {
  return (
    <section className="appearance-settings-section music-settings-section" aria-labelledby="music-settings-title">
      <div className="music-settings-heading">
        <div>
          <h3 id="music-settings-title">Tiên Âm Các</h3>
          <p>{music.tracks.length} khúc · {(music.totalSize / 1024 / 1024).toFixed(1)} MB · lưu riêng trên thiết bị</p>
        </div>
        <label className="music-settings-upload">
          ＋ Thêm âm thanh
          <input
            type="file"
            accept=".mp3,.m4a,.aac,.wav,audio/mpeg,audio/mp4,audio/aac,audio/wav"
            multiple
            onChange={(event) => {
              const input = event.currentTarget;
              const files = Array.from(input.files ?? []);
              void music.addFiles(files).finally(() => { input.value = ""; });
            }}
          />
        </label>
      </div>

      {music.message && <div className="music-settings-message" role="status">{music.message}</div>}

      <div className="music-settings-now-playing">
        <div className="music-settings-track-copy">
          <strong>{music.current?.name ?? "Chưa có nhạc"}</strong>
          <small>{formatTime(music.currentTime)} / {formatTime(music.duration)}</small>
        </div>
        <div className="music-settings-transport">
          <button type="button" aria-label="Bài trước" onClick={() => music.chooseNext(-1)}>⏮</button>
          <button type="button" className="primary" aria-label={music.playing ? "Tạm dừng" : "Phát"} onClick={() => void music.togglePlay()}>{music.playing ? "❚❚" : "▶"}</button>
          <button type="button" aria-label="Bài tiếp theo" onClick={() => music.chooseNext(1)}>⏭</button>
        </div>
      </div>

      <input
        aria-label="Tua bài hát"
        className="music-settings-seek"
        type="range"
        min="0"
        max={music.duration || 0}
        step="0.1"
        value={Math.min(music.currentTime, music.duration || 0)}
        onChange={(event) => music.seek(Number(event.target.value))}
      />

      <div className="music-settings-options">
        <button type="button" className={music.shuffle ? "is-active" : ""} onClick={() => music.setShuffle(!music.shuffle)}>🔀 Ngẫu nhiên</button>
        <button type="button" className={music.repeat !== "off" ? "is-active" : ""} onClick={() => music.setRepeat(cycleRepeatMode(music.repeat))}>{music.repeat === "one" ? "🔂 Một bài" : music.repeat === "all" ? "🔁 Danh sách" : "↪ Không lặp"}</button>
        <label><span>Âm lượng {Math.round(music.volume * 100)}%</span><input aria-label="Âm lượng" type="range" min="0" max="1" step="0.05" value={music.volume} onChange={(event) => music.setVolume(Number(event.target.value))} /></label>
      </div>

      <div className="music-settings-list" role="list" aria-label="Thư viện Tiên Âm Các">
        {!music.tracks.length && <p className="music-settings-empty">Chưa có âm thanh. Có thể thêm MP3, M4A/AAC hoặc WAV.</p>}
        {music.tracks.map((track, index) => (
          <div key={track.id} className={`music-settings-item ${track.id === music.currentId ? "is-current" : ""}`} role="listitem">
            <button type="button" className="music-settings-play-track" onClick={() => void music.startTrack(track)} aria-label={`Phát ${track.name}`}>{track.id === music.currentId && music.playing ? "♫" : "▶"}</button>
            <button type="button" className="music-settings-select-track" onClick={() => music.selectTrack(track)}>
              <strong>{index + 1}. {track.name}</strong>
              <small>{(track.size / 1024 / 1024).toFixed(1)} MB</small>
            </button>
            <button type="button" title="Đổi tên" aria-label={`Đổi tên ${track.name}`} onClick={() => void music.renameTrack(track)}>✎</button>
            <button type="button" className="danger" title="Xóa bài" aria-label={`Xóa ${track.name}`} onClick={() => void music.removeTrack(track)}>×</button>
          </div>
        ))}
      </div>
      <p className="music-settings-note">Nhạc vẫn tiếp tục phát khi đóng Cài đặt. Có thể điều khiển tiếp bằng Media Session của hệ điều hành/trình duyệt.</p>
    </section>
  );
}

export function MusicSettings() {
  const music = useContext(MusicContext);
  if (!music) return <MusicProvider><MusicSettings /></MusicProvider>;
  return <MusicSettingsContent music={music} />;
}

/** Dùng riêng cho test hoặc nơi cần một Tiên Âm Các độc lập. Trong ứng dụng chính dùng MusicProvider + MusicSettings. */
export function MusicPlayer() {
  return <MusicProvider><MusicSettings /></MusicProvider>;
}
