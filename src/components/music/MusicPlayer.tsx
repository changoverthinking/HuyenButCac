import { useEffect, useMemo, useRef, useState } from "react";
import type { MusicTrack } from "../../types/entities";
import { addMusicFiles, deleteMusicTrack, listMusicTracks, renameMusicTrack } from "../../features/media/mediaService";
import { cycleRepeatMode, nextTrackIndex, normalizeVolume, type RepeatMode } from "../../features/media/musicLogic";

const formatTime = (value:number) => Number.isFinite(value) ? `${Math.floor(value/60)}:${Math.floor(value%60).toString().padStart(2,"0")}` : "0:00";

export function MusicPlayer() {
  const [tracks,setTracks]=useState<MusicTrack[]>([]);
  const [currentId,setCurrentId]=useState<string|null>(null);
  const [playing,setPlaying]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const [currentTime,setCurrentTime]=useState(0);
  const [duration,setDuration]=useState(0);
  const [repeat,setRepeat]=useState<RepeatMode>(()=>(localStorage.getItem("hbc-music-repeat") as RepeatMode)||"off");
  const [shuffle,setShuffle]=useState(()=>localStorage.getItem("hbc-music-shuffle")==="true");
  const [volume,setVolume]=useState(()=>normalizeVolume(localStorage.getItem("hbc-music-volume")));
  const [message,setMessage]=useState("");
  const audioRef=useRef<HTMLAudioElement>(null);
  const current=tracks.find((track)=>track.id===currentId)??null;
  const totalSize=useMemo(()=>tracks.reduce((sum,track)=>sum+track.size,0),[tracks]);

  const reload=async()=>{const items=await listMusicTracks();setTracks(items);setCurrentId((id)=>{const preferred=id??localStorage.getItem("hbc-music-current");return preferred&&items.some((item)=>item.id===preferred)?preferred:items[0]?.id??null;});};
  useEffect(()=>{void reload();},[]);

  useEffect(()=>{
    const audio=audioRef.current;if(!audio)return;
    if(!current){audio.removeAttribute("src");audio.load();return;}
    const url=URL.createObjectURL(current.audioBlob);audio.src=url;audio.load();setCurrentTime(0);setDuration(0);
    if(playing) void audio.play().catch(()=>setPlaying(false));
    return()=>URL.revokeObjectURL(url);
  },[currentId]);

  useEffect(()=>{if(audioRef.current)audioRef.current.volume=volume;},[volume]);
  useEffect(()=>{if(currentId)localStorage.setItem("hbc-music-current",currentId);},[currentId]);
  useEffect(()=>{localStorage.setItem("hbc-music-repeat",repeat);},[repeat]);
  useEffect(()=>{localStorage.setItem("hbc-music-shuffle",String(shuffle));},[shuffle]);
  useEffect(()=>{localStorage.setItem("hbc-music-volume",String(volume));},[volume]);

  const chooseNext=(direction:1|-1,fromEnded=false)=>{
    if(!tracks.length)return;
    const currentIndex=tracks.findIndex((track)=>track.id===currentId);
    const index=nextTrackIndex({length:tracks.length,currentIndex,direction,shuffle,repeat,fromEnded});
    if(index===null){setPlaying(false);return;}
    if(fromEnded&&repeat==="one"){const audio=audioRef.current;if(audio){audio.currentTime=0;void audio.play();}return;}
    setCurrentId(tracks[index].id);setPlaying(true);
  };

  const togglePlay=async()=>{
    const audio=audioRef.current;if(!audio||!current)return;
    if(audio.paused){try{await audio.play();setPlaying(true);}catch{setMessage("Trình duyệt chưa cho phép phát nhạc. Hãy bấm lại nút phát.");}}
    else{audio.pause();setPlaying(false);}
  };

  const playTrack=(id:string)=>{
    if(id===currentId){void audioRef.current?.play();setPlaying(true);}
    else{setCurrentId(id);setPlaying(true);}
  };

  useEffect(()=>{
    if(!("mediaSession" in navigator))return;
    navigator.mediaSession.metadata=current?new MediaMetadata({title:current.name,album:"Huyền Bút Các · Nhạc nền"}):null;
    navigator.mediaSession.setActionHandler("play",()=>void togglePlay());
    navigator.mediaSession.setActionHandler("pause",()=>void togglePlay());
    navigator.mediaSession.setActionHandler("previoustrack",()=>chooseNext(-1));
    navigator.mediaSession.setActionHandler("nexttrack",()=>chooseNext(1));
    return()=>{navigator.mediaSession.setActionHandler("play",null);navigator.mediaSession.setActionHandler("pause",null);navigator.mediaSession.setActionHandler("previoustrack",null);navigator.mediaSession.setActionHandler("nexttrack",null);};
  });

  return (
    <section className={`music-player z-40 ${expanded?"is-open":"is-collapsed"}`} style={{borderColor:"var(--color-border)",background:"var(--color-surface)"}}>
      <audio ref={audioRef} onTimeUpdate={(e)=>setCurrentTime(e.currentTarget.currentTime)} onLoadedMetadata={(e)=>setDuration(e.currentTarget.duration)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>chooseNext(1,true)} />
      {expanded&&(
        <div className="music-library flex flex-col border rounded-xl shadow-2xl" style={{borderColor:"var(--color-border)",background:"var(--color-surface)"}}>
          <div className="flex items-center justify-between p-3 border-b" style={{borderColor:"var(--color-border)"}}>
            <div><div className="font-semibold">Nhạc nền</div><div className="text-xs" style={{color:"var(--color-text-muted)"}}>{tracks.length} bài · {(totalSize/1024/1024).toFixed(1)} MB lưu trên thiết bị</div></div>
            <div className="flex items-center gap-2"><label className="px-3 py-2 rounded text-sm cursor-pointer" style={{background:"var(--color-accent)",color:"var(--color-bg)"}}>＋ MP3<input type="file" accept="audio/mpeg,.mp3" multiple className="hidden" onChange={async(e)=>{const files=Array.from(e.target.files??[]);if(!files.length)return;try{await addMusicFiles(files);await reload();setMessage(`Đã lưu ${files.length} bài trên thiết bị.`);}catch(error){setMessage((error as Error).message);}e.target.value="";}} /></label><button className="md:hidden w-9 h-9 rounded-full" aria-label="Thu nhỏ trình phát nhạc" style={{background:"var(--color-surface-alt)"}} onClick={()=>setExpanded(false)}>⌄</button></div>
          </div>
          {message&&<div className="px-3 py-2 text-xs" style={{color:"var(--color-warning)"}}>{message}</div>}
          <div className="overflow-y-auto p-2">
            {!tracks.length&&<p className="p-4 text-sm text-center" style={{color:"var(--color-text-muted)"}}>Chưa có bài hát. Thêm tệp MP3 để nghe khi viết.</p>}
            {tracks.map((track,index)=><div key={track.id} className="flex items-center gap-2 p-2 rounded mb-1" style={{background:track.id===currentId?"var(--color-surface-alt)":"transparent"}}>
              <button className="w-8 h-8 rounded-full" onClick={()=>playTrack(track.id)}>{track.id===currentId&&playing?"♫":"▶"}</button>
              <button className="flex-1 min-w-0 text-left" onClick={()=>setCurrentId(track.id)}><div className="truncate text-sm">{index+1}. {track.name}</div><div className="text-xs" style={{color:"var(--color-text-muted)"}}>{(track.size/1024/1024).toFixed(1)} MB</div></button>
              <button title="Đổi tên" onClick={async()=>{const name=window.prompt("Tên bài hát:",track.name)?.trim();if(name){await renameMusicTrack(track.id,name);await reload();}}}>✎</button>
              <button title="Xóa bài" style={{color:"var(--color-error)"}} onClick={async()=>{if(!window.confirm(`Xóa bài “${track.name}” khỏi ứng dụng?`))return;await deleteMusicTrack(track.id);await reload();}}>×</button>
            </div>)}
          </div>
        </div>
      )}
      <button className="music-bubble md:hidden" aria-label="Mở trình phát nhạc" onClick={()=>setExpanded(true)} style={{background:"var(--color-accent)",color:"var(--color-bg)"}}>{playing?"♫":"♪"}</button>
      <div className="music-controls h-16 md:h-14 px-2 md:px-4 items-center gap-2">
        <button aria-label="Mở thư viện nhạc" className="w-9 h-9 rounded" style={{background:"var(--color-surface-alt)"}} onClick={()=>setExpanded((value)=>!value)}>♫</button>
        <div className="hidden sm:block min-w-0 w-36"><div className="truncate text-sm">{current?.name??"Chưa có nhạc"}</div><div className="text-[11px]" style={{color:"var(--color-text-muted)"}}>{formatTime(currentTime)} / {formatTime(duration)}</div></div>
        <button aria-label="Bài trước" onClick={()=>chooseNext(-1)}>⏮</button>
        <button aria-label={playing?"Tạm dừng":"Phát"} className="w-9 h-9 rounded-full" style={{background:"var(--color-accent)",color:"var(--color-bg)"}} onClick={togglePlay}>{playing?"❚❚":"▶"}</button>
        <button aria-label="Bài tiếp theo" onClick={()=>chooseNext(1)}>⏭</button>
        <input aria-label="Tua bài hát" className="music-seek flex-1 min-w-12 accent-[var(--color-accent)]" type="range" min="0" max={duration||0} step="0.1" value={Math.min(currentTime,duration||0)} onChange={(e)=>{const value=Number(e.target.value);if(audioRef.current)audioRef.current.currentTime=value;setCurrentTime(value);}} />
        <button aria-label="Phát ngẫu nhiên" title="Phát ngẫu nhiên" onClick={()=>setShuffle((value)=>!value)} style={{color:shuffle?"var(--color-accent)":"var(--color-text-muted)"}}>🔀</button>
        <button aria-label="Chế độ lặp" title="Tắt lặp / Lặp danh sách / Lặp một bài" onClick={()=>setRepeat(cycleRepeatMode)} style={{color:repeat!=="off"?"var(--color-accent)":"var(--color-text-muted)"}}>{repeat==="one"?"🔂":"🔁"}</button>
        <label className="hidden md:flex items-center gap-1 text-xs">🔊<input aria-label="Âm lượng" className="w-20" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e)=>setVolume(Number(e.target.value))}/></label>
      </div>
    </section>
  );
}
