import type { ClubData } from "@/types/reading";
import { initialData } from "@/data/initial-data";
const STORAGE_KEY = "clube-meia-noite:v1";
export const clubStorage = {
  load(): ClubData { if (typeof window === "undefined") return initialData; try { const saved = window.localStorage.getItem(STORAGE_KEY); return saved ? { ...initialData, ...JSON.parse(saved) } : initialData; } catch { return initialData; } },
  save(data: ClubData) { if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); },
  reset() { if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY); },
};
