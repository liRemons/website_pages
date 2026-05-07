import React, { createContext, useContext, useState, useCallback } from 'react';
import zhCN from './zh-CN.js';
import zhTW from './zh-TW.js';
import en from './en.js';

// ─── 语言包映射 ───────────────────────────────────────────────────────────────

const MESSAGES = { 'zh-CN': zhCN, 'zh-TW': zhTW, en };

export const LOCALE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en',    label: 'English' },
];

// ─── 翻译函数 ─────────────────────────────────────────────────────────────────

/**
 * 从扁平语言包中取值，支持插值
 * t('template.savedCount', { count: 3 }) → "已保存 3/10 个自定义模板"
 */
const translate = (messages, key, params) => {
  const value = messages[key];
  if (value === undefined) return key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (result, [paramKey, paramValue]) => result.replace(`{${paramKey}}`, paramValue),
    value
  );
};

// ─── Context ──────────────────────────────────────────────────────────────────

const LocaleContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const LocaleProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(
    () => localStorage.getItem('photo_editor_locale') || 'zh-CN'
  );

  const setLocale = useCallback((newLocale) => {
    localStorage.setItem('photo_editor_locale', newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key, params) => translate(MESSAGES[locale] || MESSAGES['zh-CN'], key, params),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
};
