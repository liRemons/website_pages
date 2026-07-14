import React from "react";
import { Tooltip, Dropdown } from "antd";
import { useTheme, THEME_LIGHT, THEME_DARK, THEME_SYSTEM } from "@/hooks/useTheme";

const MODE_META = {
  [THEME_LIGHT]: { icon: "☀️", label: "浅色", next: THEME_DARK },
  [THEME_DARK]: { icon: "🌙", label: "深色", next: THEME_SYSTEM },
  [THEME_SYSTEM]: { icon: "🌓", label: "跟随系统", next: THEME_LIGHT },
};

const menuItems = [
  { key: THEME_LIGHT, icon: "☀️", label: "浅色" },
  { key: THEME_DARK, icon: "🌙", label: "深色" },
  { key: THEME_SYSTEM, icon: "🌓", label: "跟随系统" },
];

export default function ThemeToggle({ dropdown = false, className = "" }) {
  const { mode, setMode } = useTheme();
  const meta = MODE_META[mode];

  if (dropdown) {
    const items = menuItems.map((item) => ({
      key: item.key,
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </span>
      ),
    }));

    return (
      <Dropdown
        menu={{
          items,
          selectedKeys: [mode],
          onClick: ({ key }) => setMode(key),
        }}
        trigger={["click"]}
        placement="topRight"
        arrow
        destroyPopupOnHide
      >
        <div
          className={`circle ${className}`}
          title={`当前：${meta.label}（点击切换）`}
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{meta.icon}</span>
        </div>
      </Dropdown>
    );
  }

  // 默认：点击轮换
  const handleClick = () => setMode(meta.next);

  return (
    <Tooltip title={`当前：${meta.label}（点击切换至 ${MODE_META[meta.next].label}）`}>
      <div
        className={`circle ${className}`}
        onClick={handleClick}
        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{meta.icon}</span>
      </div>
    </Tooltip>
  );
}
