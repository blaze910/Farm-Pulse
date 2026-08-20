"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "dark", setTheme: () => {} });
const STORAGE_KEY = "farmpulse.theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function setTheme(next) {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
