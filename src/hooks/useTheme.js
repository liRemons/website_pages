import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const THEME_KEY = "app-theme-mode";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";
const THEME_SYSTEM = "system";

function getSystemTheme() {
  if (typeof window === "undefined") return THEME_LIGHT;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? THEME_DARK : THEME_LIGHT;
}

function getStoredMode() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === THEME_LIGHT || stored === THEME_DARK || stored === THEME_SYSTEM) return stored;
  } catch {}
  return THEME_SYSTEM;
}

function resolveTheme(mode) {
  return mode === THEME_SYSTEM ? getSystemTheme() : mode;
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

// 初始化脚本：在 React 加载前执行，防 FOUC（也内联在 index.ejs 中）
if (typeof window !== "undefined") {
  const mode = getStoredMode();
  const theme = resolveTheme(mode);
  applyTheme(theme);
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => getStoredMode());
  const [theme, setTheme] = useState(() => resolveTheme(mode));

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(THEME_KEY, newMode);
      // 触发同域其他 ThemeProvider 实例同步（如独立 root 中的 MermaidBlock）
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }, []);

  // 监听 mode 变化，解析出实际 theme
  useEffect(() => {
    const resolved = resolveTheme(mode);
    setTheme(resolved);
    applyTheme(resolved);
  }, [mode]);

  // 监听系统主题变化（仅在 system 模式下生效）
  useEffect(() => {
    if (mode !== THEME_SYSTEM) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const t = e.matches ? THEME_DARK : THEME_LIGHT;
      setTheme(t);
      applyTheme(t);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  // 监听 storage 事件和 data-theme 属性变化，确保跨组件/跨 root 同步
  useEffect(() => {
    // storage 事件：同源其他 tab 修改 localStorage 时触发
    const handleStorage = () => {
      const newMode = getStoredMode();
      if (newMode !== mode) {
        setModeState(newMode);
      }
    };
    window.addEventListener("storage", handleStorage);

    // MutationObserver：监听 data-theme 属性变化（同一页面内独立 root 同步）
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.dataset.theme;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
        // 也同步 mode 状态
        const newMode = getStoredMode();
        if (newMode !== mode) {
          setModeState(newMode);
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      window.removeEventListener("storage", handleStorage);
      observer.disconnect();
    };
  }, [mode, theme]);

  const isDark = theme === THEME_DARK;
  const value = useMemo(() => ({ theme, mode, isDark, setMode }), [theme, mode, isDark, setMode]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export { THEME_LIGHT, THEME_DARK, THEME_SYSTEM };
