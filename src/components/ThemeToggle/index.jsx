import React from "react";
import { Tooltip, Dropdown } from "antd";
import { DesktopOutlined, MoonFilled, SunFilled } from "@ant-design/icons";
import { useTheme, THEME_LIGHT, THEME_DARK, THEME_SYSTEM } from "@/hooks/useTheme";

// 主题图标用 antd SVG 而非 emoji：emoji 依赖系统字体跨端画法不一，SVG 走 currentColor 自动跟随文字颜色、尺寸可控
const MODE_META = {
  [THEME_LIGHT]: { icon: <SunFilled />, label: "浅色", next: THEME_DARK },
  [THEME_DARK]: { icon: <MoonFilled />, label: "深色", next: THEME_SYSTEM },
  [THEME_SYSTEM]: { icon: <DesktopOutlined />, label: "跟随系统", next: THEME_LIGHT },
};

const menuItems = [
  { key: THEME_LIGHT, icon: <SunFilled />, label: "浅色" },
  { key: THEME_DARK, icon: <MoonFilled />, label: "深色" },
  { key: THEME_SYSTEM, icon: <DesktopOutlined />, label: "跟随系统" },
];

export default function ThemeToggle({ dropdown = false, className = "" }) {
  const { mode, setMode } = useTheme();
  const meta = MODE_META[mode];

  if (dropdown) {
    const items = menuItems.map((item) => ({
      key: item.key,
      // antd Dropdown menu 的 items 原生支持 icon 字段，不再手工拼 span 包裹
      icon: item.icon,
      label: item.label,
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
          <span style={{ fontSize: 18, lineHeight: 1, display: "inline-flex" }}>{meta.icon}</span>
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
        <span style={{ fontSize: 18, lineHeight: 1, display: "inline-flex" }}>{meta.icon}</span>
      </div>
    </Tooltip>
  );
}
