import {
  appearanceSchemes,
  normalizeAppearanceScheme,
  type AppearanceScheme,
} from "@/lib/profile";

export const THEME_STORAGE_KEY = "costar-theme";

export function isAppearanceScheme(value: unknown): value is AppearanceScheme {
  return appearanceSchemes.includes(value as AppearanceScheme);
}

export function getStoredAppearanceScheme(): AppearanceScheme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isAppearanceScheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function applyAppearanceScheme(value: unknown, persist = true): AppearanceScheme {
  const scheme = normalizeAppearanceScheme(value);

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = scheme;
  }

  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch {}
  }

  return scheme;
}
