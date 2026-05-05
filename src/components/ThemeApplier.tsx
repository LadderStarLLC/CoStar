"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { normalizeAppearanceScheme } from "@/lib/profile";
import { applyAppearanceScheme, getStoredAppearanceScheme } from "@/lib/theme";

export default function ThemeApplier() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // During initial mount or auth loading, let the <head> script handle the initial theme
    if (!mounted || loading) return;

    if (user) {
      // If user is logged in, their profile dictates the theme.
      const scheme = normalizeAppearanceScheme(user.appearanceScheme);
      applyAppearanceScheme(scheme);
    } else {
      // If user is anonymous, respect localStorage if it exists, otherwise default.
      const localTheme = getStoredAppearanceScheme();
      applyAppearanceScheme(localTheme ?? normalizeAppearanceScheme(undefined), !localTheme);
    }
  }, [user, loading, mounted]);

  return null;
}
