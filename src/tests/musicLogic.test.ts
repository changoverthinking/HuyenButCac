import { describe, expect, it } from "vitest";
import { cycleRepeatMode, nextTrackIndex, normalizeVolume } from "../features/media/musicLogic";

describe("musicLogic — điều hướng player",()=>{
  it("chuyển bài tuần tự và quay về đầu khi lặp danh sách",()=>{
    expect(nextTrackIndex({length:3,currentIndex:0,direction:1,shuffle:false,repeat:"off"})).toBe(1);
    expect(nextTrackIndex({length:3,currentIndex:2,direction:1,shuffle:false,repeat:"all",fromEnded:true})).toBe(0);
  });
  it("dừng ở cuối danh sách khi không lặp",()=>{
    expect(nextTrackIndex({length:3,currentIndex:2,direction:1,shuffle:false,repeat:"off",fromEnded:true})).toBeNull();
  });
  it("lặp một bài và phát ngẫu nhiên không chọn lại bài hiện tại",()=>{
    expect(nextTrackIndex({length:3,currentIndex:1,direction:1,shuffle:false,repeat:"one",fromEnded:true})).toBe(1);
    expect(nextTrackIndex({length:3,currentIndex:1,direction:1,shuffle:true,repeat:"off",random:.4})).not.toBe(1);
  });
  it("chu kỳ chế độ lặp đúng",()=>{
    expect(cycleRepeatMode("off")).toBe("all");expect(cycleRepeatMode("all")).toBe("one");expect(cycleRepeatMode("one")).toBe("off");
  });
  it("âm lượng lưu lỗi được đưa về giá trị an toàn",()=>{
    expect(normalizeVolume("2")).toBe(1);expect(normalizeVolume("-1")).toBe(0);expect(normalizeVolume("abc")).toBe(.75);
  });
});
