import { join } from "path";

const isVercel = process.env.VERCEL === "1";
const writableRoot = isVercel ? "/tmp" : ".";

export function getRuntimePath(...parts: string[]): string {
  return join(writableRoot, ...parts);
}

export function isServerlessRuntime(): boolean {
  return isVercel;
}
