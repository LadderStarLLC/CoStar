"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { normalizeAppearanceScheme } from "@/lib/profile";

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
      document.documentElement.dataset.theme = scheme;
      try {
        localStorage.setItem("costar-theme", scheme);
      } catch (e) {}
    } else {
      // If user is anonymous, respect localStorage if it exists, otherwise default.
      try {
        const localTheme = localStorage.getItem("costar-theme");
        if (localTheme) {
            document.documentElement.dataset.theme = localTheme;
        } else {
            const scheme = normalizeAppearanceScheme(undefined);
            document.documentElement.dataset.theme = scheme;
            localStorage.setItem("costar-theme", scheme);
        }
      } catch (e) {}
    }
  }, [user, loading, mounted]);

  return null;
}
