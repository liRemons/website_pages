import React from 'react';
import { MoonOutlined, SunOutlined, DesktopOutlined, HighlightOutlined, DownloadOutlined, LoadingOutlined, BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, ColorPicker, Dropdown } from 'antd';
import { useLocale, LOCALE_OPTIONS } from '../../i18n';
import './index.less';

// ─── 主题切换（右侧滑出效果）────────────────────────────────────────────────

export const ThemeToggle = ({ theme, themeMode, onThemeModeChange }) => {
  const { t } = useLocale();
  const THEME_OPTIONS = [
    { value: 'dark',   icon: <MoonOutlined />,    label: t('theme.dark') },
    { value: 'light',  icon: <SunOutlined />,     label: t('theme.light') },
    { value: 'system', icon: <DesktopOutlined />, label: t('theme.system') },
  ];
  const current = THEME_OPTIONS.find((opt) => opt.value === themeMode) || THEME_OPTIONS[1];
  const others = THEME_OPTIONS.filter((opt) => opt.value !== themeMode);

  return (
    <div className="slide-toggle" style={{ '--slide-toggle-bg': theme.bgTertiary, '--slide-toggle-border': theme.border }}>
      <div className="slide-toggle__options">
        {others.map((opt) => (
          <button
            key={opt.value}
            className="slide-toggle__option-btn"
            title={opt.label}
            onClick={() => onThemeModeChange(opt.value)}
            style={{ color: theme.textSecondary }}
          >
            {opt.icon}
          </button>
        ))}
      </div>
      <button
        className="slide-toggle__current-btn"
        title={current.label}
        style={{ color: theme.accent }}
      >
        {current.icon}
      </button>
    </div>
  );
};

// ─── 语言切换（右侧滑出效果）────────────────────────────────────────────────

export const LocaleToggle = ({ theme }) => {
  const { locale, setLocale } = useLocale();
  const LOCALE_LABELS = { 'zh-CN': '简', 'zh-TW': '繁', en: 'EN' };
  const others = LOCALE_OPTIONS.filter((opt) => opt.value !== locale);

  return (
    <div className="slide-toggle" style={{ '--slide-toggle-bg': theme.bgTertiary, '--slide-toggle-border': theme.border }}>
      <div className="slide-toggle__options">
        {others.map((opt) => (
          <button
            key={opt.value}
            className="slide-toggle__option-btn"
            title={opt.label}
            onClick={() => setLocale(opt.value)}
            style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 700 }}
          >
            {LOCALE_LABELS[opt.value]}
          </button>
        ))}
      </div>
      <button
        className="slide-toggle__current-btn"
        title={LOCALE_OPTIONS.find((o) => o.value === locale)?.label}
        style={{ color: theme.accent, fontSize: 11, fontWeight: 700 }}
      >
        {LOCALE_LABELS[locale]}
      </button>
    </div>
  );
};

// ─── 移动端顶部标题栏 ────────────────────────────────────────────────────────

export const MobileHeader = ({ theme, themeMode, onThemeModeChange, canvasBackground, onCanvasBackgroundChange, isExporting, onExport, isAdmin, onToggleAdmin }) => {
  const { t } = useLocale();

  const settingsDropdown = (
    <div
      className="mobile-settings-panel"
      style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 180 }}
    >
      <div className="mobile-settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, color: theme.textSecondary }}>{'主题'}</span>
        <ThemeToggle theme={theme} themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
      </div>
      <div className="mobile-settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, color: theme.textSecondary }}>{'语言'}</span>
        <LocaleToggle theme={theme} />
      </div>
      <div
        className="mobile-settings-row"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8, borderTop: `1px solid ${theme.border}` }}
      >
        <span style={{ fontSize: 13, color: theme.textSecondary }}>{t('admin.switchAdmin')}</span>
        <button
          type="button"
          onClick={() => onToggleAdmin && onToggleAdmin(!isAdmin)}
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            border: `1px solid ${isAdmin ? '#f59e0b' : theme.border}`,
            background: isAdmin ? 'rgba(245,158,11,0.12)' : 'transparent',
            color: isAdmin ? '#f59e0b' : theme.textMuted,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.3,
            transition: 'all 0.2s',
          }}
        >
          {isAdmin ? `👑 ${t('admin.adminMode')}` : t('admin.enterAdmin')}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="mobile-header"
      style={{ background: theme.bgSecondary, borderBottom: `1px solid ${theme.border}` }}
    >
      <span className="mobile-header__title" style={{ color: theme.textPrimary }}>
        <HighlightOutlined style={{ marginRight: 6, color: theme.accent }} />
        {t('app.title')}
      </span>
      <div className="mobile-header__actions">
        <Dropdown
          dropdownRender={() => settingsDropdown}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<SettingOutlined />}
            className="mobile-header__setting-btn"
            style={{ color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: 8 }}
          />
        </Dropdown>
        <ColorPicker
          value={canvasBackground}
          onChange={(_, hex) => onCanvasBackgroundChange(hex)}
          size="small"
          trigger="click"
          className="mobile-bg-picker"
        >
          <Button
            type="text"
            icon={<BgColorsOutlined />}
            className="mobile-header__bg-btn"
            style={{ background: canvasBackground, border: `1px solid ${theme.border}` }}
          />
        </ColorPicker>
        <Button
          type="primary"
          onClick={onExport}
          disabled={isExporting}
          className={`export-btn export-btn--mobile ${isExporting ? 'export-btn--loading' : 'export-btn--active'}`}
        >
          {isExporting
            ? <><LoadingOutlined /> {t('toolbar.exporting')}</>
            : <><DownloadOutlined /> {t('toolbar.export')}</>}
        </Button>
      </div>
    </div>
  );
};

// ─── PC 端顶部栏 ─────────────────────────────────────────────────────────────

export const AppTopBar = ({ theme, themeMode, onThemeModeChange, isAdmin, onToggleAdmin }) => {
  const { t } = useLocale();
  return (
    <div
      className="app-topbar"
      style={{ background: theme.bgSecondary, borderBottom: `1px solid ${theme.border}` }}
    >
      <div className="app-topbar__left">
        <div className="app-topbar__title" style={{ color: theme.textPrimary }}>
          <HighlightOutlined style={{ marginRight: 6, color: theme.accent }} />
          {t('app.title')}
        </div>
        <ThemeToggle theme={theme} themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
      </div>
      <div className="app-topbar__controls">
        {/* 管理员 mock 切换按钮 */}
        <button
          type="button"
          onClick={() => onToggleAdmin(!isAdmin)}
          title={isAdmin ? t('admin.exitAdmin') : t('admin.enterAdmin')}
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            border: `1px solid ${isAdmin ? '#f59e0b' : theme.border}`,
            background: isAdmin ? 'rgba(245,158,11,0.12)' : 'transparent',
            color: isAdmin ? '#f59e0b' : theme.textMuted,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.3,
            transition: 'all 0.2s',
          }}
        >
          {isAdmin ? `👑 ${t('admin.adminMode')}` : t('admin.switchAdmin')}
        </button>
        <LocaleToggle theme={theme} />
      </div>
    </div>
  );
};
