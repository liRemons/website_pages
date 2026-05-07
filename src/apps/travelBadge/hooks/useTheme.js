import { useState, useEffect } from 'react';

/**
 * 主题管理 Hook
 * 管理主题模式（dark/light/system）、监听系统主题变化、持久化到 localStorage
 */
export const useTheme = () => {
  const [themeMode, setThemeMode] = useState(() => 
    localStorage.getItem('photo_editor_theme') || 'dark'
  );

  // 计算实际是否暗色
  const isDark = themeMode === 'dark' || 
    (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 监听系统主题变化
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setThemeMode('system'); // 触发重渲染
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  // 持久化主题
  useEffect(() => {
    localStorage.setItem('photo_editor_theme', themeMode);
  }, [themeMode]);

  // ── 新拟物风主题 token ──────────────────────────────────────────────────────
  // 亮色：浅灰底 + 双侧阴影（亮白 / 暗灰）营造凸起感
  // 暗色：深蓝灰底 + 双侧阴影（更深暗 / 微亮高光）营造凸起感
  const theme = isDark ? {
    // 背景层级
    bgPrimary:   '#1a1d2e',
    bgSecondary: '#1e2235',
    bgTertiary:  '#252840',
    // 阴影（用于 JS 内联注入，CSS 中直接写死对应值）
    shadowDark:  '#12141f',
    shadowLight: '#28304a',
    // 边框（极细，仅辅助区分层级）
    border:      '#2e3350',
    borderLight: '#363d5c',
    // 文字
    textPrimary:   '#c8d0e7',
    textSecondary: '#8892a4',
    textMuted:     '#5a6480',
    textDisabled:  '#3d4460',
    // 主色
    accent: '#4f9eff',
    accentGlow: 'rgba(79,158,255,0.25)',
  } : {
    // 背景层级（偏白，新拟物底色）
    bgPrimary:   '#eef0f4',
    bgSecondary: '#f2f4f7',
    bgTertiary:  '#f8f9fb',
    // 阴影（随底色调亮，暗侧稍浅、亮侧纯白）
    shadowDark:  '#c8cdd6',
    shadowLight: '#ffffff',
    // 边框
    border:      '#dde0e6',
    borderLight: '#e6e9ee',
    // 文字
    textPrimary:   '#2d3748',
    textSecondary: '#4a5568',
    textMuted:     '#718096',
    textDisabled:  '#a0aec0',
    // 主色
    accent: '#007AFF',
    accentGlow: 'rgba(0,122,255,0.2)',
  };

  return { themeMode, setThemeMode, theme, isDark };
};
