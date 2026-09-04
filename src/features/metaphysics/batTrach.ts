export type Gender = "male" | "female";
export type CompassDirection = "Bắc" | "Đông Bắc" | "Đông" | "Đông Nam" | "Nam" | "Tây Nam" | "Tây" | "Tây Bắc";
export type DirectionQuality = "good" | "bad";

export type BatTrachDirection = {
  direction: CompassDirection;
  star: "Sinh Khí" | "Thiên Y" | "Diên Niên" | "Phục Vị" | "Tuyệt Mệnh" | "Ngũ Quỷ" | "Lục Sát" | "Họa Hại";
  quality: DirectionQuality;
};

const KUA_META: Record<number, { trigram: string; element: string; group: string; seat: CompassDirection }> = {
  1: { trigram: "Khảm", element: "Thủy", group: "Đông Tứ Mệnh", seat: "Bắc" },
  2: { trigram: "Khôn", element: "Thổ", group: "Tây Tứ Mệnh", seat: "Tây Nam" },
  3: { trigram: "Chấn", element: "Mộc", group: "Đông Tứ Mệnh", seat: "Đông" },
  4: { trigram: "Tốn", element: "Mộc", group: "Đông Tứ Mệnh", seat: "Đông Nam" },
  6: { trigram: "Càn", element: "Kim", group: "Tây Tứ Mệnh", seat: "Tây Bắc" },
  7: { trigram: "Đoài", element: "Kim", group: "Tây Tứ Mệnh", seat: "Tây" },
  8: { trigram: "Cấn", element: "Thổ", group: "Tây Tứ Mệnh", seat: "Đông Bắc" },
  9: { trigram: "Ly", element: "Hỏa", group: "Đông Tứ Mệnh", seat: "Nam" },
};

const DIRECTIONS: Record<number, BatTrachDirection[]> = {
  1: [
    { direction: "Đông Nam", star: "Sinh Khí", quality: "good" }, { direction: "Đông", star: "Thiên Y", quality: "good" },
    { direction: "Nam", star: "Diên Niên", quality: "good" }, { direction: "Bắc", star: "Phục Vị", quality: "good" },
    { direction: "Tây Nam", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Đông Bắc", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Tây Bắc", star: "Lục Sát", quality: "bad" }, { direction: "Tây", star: "Họa Hại", quality: "bad" },
  ],
  2: [
    { direction: "Đông Bắc", star: "Sinh Khí", quality: "good" }, { direction: "Tây", star: "Thiên Y", quality: "good" },
    { direction: "Tây Bắc", star: "Diên Niên", quality: "good" }, { direction: "Tây Nam", star: "Phục Vị", quality: "good" },
    { direction: "Bắc", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Đông Nam", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Nam", star: "Lục Sát", quality: "bad" }, { direction: "Đông", star: "Họa Hại", quality: "bad" },
  ],
  3: [
    { direction: "Nam", star: "Sinh Khí", quality: "good" }, { direction: "Bắc", star: "Thiên Y", quality: "good" },
    { direction: "Đông Nam", star: "Diên Niên", quality: "good" }, { direction: "Đông", star: "Phục Vị", quality: "good" },
    { direction: "Tây", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Tây Bắc", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Đông Bắc", star: "Lục Sát", quality: "bad" }, { direction: "Tây Nam", star: "Họa Hại", quality: "bad" },
  ],
  4: [
    { direction: "Bắc", star: "Sinh Khí", quality: "good" }, { direction: "Nam", star: "Thiên Y", quality: "good" },
    { direction: "Đông", star: "Diên Niên", quality: "good" }, { direction: "Đông Nam", star: "Phục Vị", quality: "good" },
    { direction: "Đông Bắc", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Tây Nam", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Tây", star: "Lục Sát", quality: "bad" }, { direction: "Tây Bắc", star: "Họa Hại", quality: "bad" },
  ],
  6: [
    { direction: "Tây", star: "Sinh Khí", quality: "good" }, { direction: "Đông Bắc", star: "Thiên Y", quality: "good" },
    { direction: "Tây Nam", star: "Diên Niên", quality: "good" }, { direction: "Tây Bắc", star: "Phục Vị", quality: "good" },
    { direction: "Nam", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Đông", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Bắc", star: "Lục Sát", quality: "bad" }, { direction: "Đông Nam", star: "Họa Hại", quality: "bad" },
  ],
  7: [
    { direction: "Tây Bắc", star: "Sinh Khí", quality: "good" }, { direction: "Tây Nam", star: "Thiên Y", quality: "good" },
    { direction: "Đông Bắc", star: "Diên Niên", quality: "good" }, { direction: "Tây", star: "Phục Vị", quality: "good" },
    { direction: "Đông", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Nam", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Đông Nam", star: "Lục Sát", quality: "bad" }, { direction: "Bắc", star: "Họa Hại", quality: "bad" },
  ],
  8: [
    { direction: "Tây Nam", star: "Sinh Khí", quality: "good" }, { direction: "Tây Bắc", star: "Thiên Y", quality: "good" },
    { direction: "Tây", star: "Diên Niên", quality: "good" }, { direction: "Đông Bắc", star: "Phục Vị", quality: "good" },
    { direction: "Đông Nam", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Bắc", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Đông", star: "Lục Sát", quality: "bad" }, { direction: "Nam", star: "Họa Hại", quality: "bad" },
  ],
  9: [
    { direction: "Đông", star: "Sinh Khí", quality: "good" }, { direction: "Đông Nam", star: "Thiên Y", quality: "good" },
    { direction: "Bắc", star: "Diên Niên", quality: "good" }, { direction: "Nam", star: "Phục Vị", quality: "good" },
    { direction: "Tây Bắc", star: "Tuyệt Mệnh", quality: "bad" }, { direction: "Tây", star: "Ngũ Quỷ", quality: "bad" },
    { direction: "Tây Nam", star: "Lục Sát", quality: "bad" }, { direction: "Đông Bắc", star: "Họa Hại", quality: "bad" },
  ],
};

function digitalRoot(value: number) {
  let result = Math.abs(Math.trunc(value));
  while (result > 9) result = String(result).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return result;
}

export function calculateKuaNumber(year: number, gender: Gender) {
  if (!Number.isInteger(year) || year < 1900 || year > 2099) {
    throw new Error("Bát Trạch bản này hỗ trợ năm sinh 1900–2099 để giữ đúng công thức cung phi đã kiểm chứng.");
  }
  const lastTwoDigits = year % 100;
  const reduced = digitalRoot(lastTwoDigits);
  let kua: number;
  if (year < 2000) kua = gender === "male" ? digitalRoot(10 - reduced) : digitalRoot(5 + reduced);
  else kua = gender === "male" ? 9 - reduced : digitalRoot(6 + reduced);
  if (kua === 0) kua = 9;
  if (kua === 5) kua = gender === "male" ? 2 : 8;
  return kua;
}

export function getBatTrachProfile(year: number, gender: Gender) {
  const kua = calculateKuaNumber(year, gender);
  const meta = KUA_META[kua];
  return { year, gender, kua, ...meta, directions: DIRECTIONS[kua] };
}

export function evaluateHouseDirection(year: number, gender: Gender, direction: CompassDirection) {
  const profile = getBatTrachProfile(year, gender);
  const result = profile.directions.find((item) => item.direction === direction);
  if (!result) throw new Error("Không xác định được hướng nhà.");
  return { profile, result };
}
