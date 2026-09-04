import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import { trackPendingWrite } from "../app/appLifecycle";
import type { CanvasStroke } from "../../types/entities";

export type StrokeSpace = "mindmap" | "whiteboard";
const table = (space: StrokeSpace) => space === "mindmap" ? db.mindMapStrokes : db.whiteboardStrokes;
const now = () => Date.now();

export async function addStroke(space: StrokeSpace, input: Omit<CanvasStroke, "id" | "createdAt" | "updatedAt" | "schemaVersion" | "deletedAt" | "syncState">) {
  const time = now();
  const stroke: CanvasStroke = { ...input, id: uuid(), createdAt: time, updatedAt: time, schemaVersion: 1, deletedAt: null, syncState: "local" };
  await trackPendingWrite(table(space).add(stroke));
  return stroke;
}
export const listStrokes = (space: StrokeSpace, ownerId: string) => table(space).where("ownerId").equals(ownerId).filter(item => item.deletedAt === null).toArray();
export const updateStroke = (space: StrokeSpace, id: string, patch: Partial<Pick<CanvasStroke, "points" | "color" | "width" | "dash" | "arrow" | "smoothed" | "locked">>) => trackPendingWrite(table(space).update(id, { ...patch, updatedAt: now() }));
export const deleteStroke = (space: StrokeSpace, id: string) => trackPendingWrite(table(space).update(id, { deletedAt: now(), updatedAt: now() }));

export function smoothPoints(points: {x:number;y:number}[]) {
  if (points.length < 3) return points;
  const result = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1], current = points[index], next = points[index + 1];
    result.push({ x: (previous.x + current.x * 2 + next.x) / 4, y: (previous.y + current.y * 2 + next.y) / 4 });
  }
  result.push(points[points.length - 1]);
  return result;
}

export const strokePath = (points: {x:number;y:number}[]) => points.length ? points.reduce((path, point, index) => `${path}${index ? " L" : "M"}${point.x},${point.y}`, "") : "";
export const strokeDash = (dash: CanvasStroke["dash"]) => dash === "dashed" ? "12 8" : dash === "dotted" ? "2 7" : undefined;
