import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";

const THEME_PREFERENCE_KEY = "themePreference";

const palettes = {
  light: {
    background: "#ffffff",
    surface: "#ffffff",
    mutedSurface: "#f8fafc",
    softSurface: "#f9fafb",
    elevatedSurface: "#f3f4f6",
    border: "#e5e7eb",
    subtleBorder: "#e2e8f0",
    text: "#111827",
    mutedText: "#6b7280",
    subtleText: "#9ca3af",
    primary: "#2563eb",
    primarySoft: "#eff6ff",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    warning: "#d97706",
    warningSoft: "#fef3c7",
    danger: "#dc2626",
    statusBar: "dark",
    tabBar: "#ffffff",
  },
  dark: {
    background: "#0f172a",
    surface: "#111827",
    mutedSurface: "#1f2937",
    softSurface: "#172033",
    elevatedSurface: "#1f2937",
    border: "#374151",
    subtleBorder: "#334155",
    text: "#f9fafb",
    mutedText: "#cbd5e1",
    subtleText: "#94a3b8",
    primary: "#60a5fa",
    primarySoft: "#1e3a8a",
    success: "#4ade80",
    successSoft: "#14532d",
    warning: "#fbbf24",
    warningSoft: "#78350f",
    danger: "#f87171",
    statusBar: "light",
    tabBar: "#111827",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState("system");
  const [systemColorScheme, setSystemColorScheme] = useState(
    Appearance.getColorScheme() || "light",
  );

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY).then((storedValue) => {
      if (
        storedValue === "light" ||
        storedValue === "dark" ||
        storedValue === "system"
      ) {
        setThemePreferenceState(storedValue);
      }
    });
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme || "light");
    });

    return () => subscription.remove();
  }, []);

  const setThemePreference = async (nextTheme) => {
    setThemePreferenceState(nextTheme);
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextTheme);
  };

  const resolvedTheme =
    themePreference === "system" ? systemColorScheme : themePreference;
  const colors = palettes[resolvedTheme] || palettes.light;

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      colors,
      statusBarStyle: colors.statusBar,
      setThemePreference,
    }),
    [colors, resolvedTheme, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return context;
}
