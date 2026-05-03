"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { normalizeAppearanceScheme } from "@/lib/profile";

export default function ThemeApplier() {
  const { user } = useAuth();
  const scheme = normalizeAppearanceScheme(user?.appearanceScheme);

  useEffect(() => {
    document.documentElement.dataset.theme = scheme;
  }, [scheme]);

  return null;
}
