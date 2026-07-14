import React from "react";
import { Space, Select } from "antd";
import { THEME_OPTIONS } from "../constants";
import style from "../index.module.less";
import MermaidRenderer from "@/components/MermaidRenderer";

/**
 * 右栏：Mermaid 图表预览
 * 包装 MermaidRenderer 组件，补充主题选择器
 */
export default function MermaidPreview({ source, theme, onThemeChange }) {
  return (
    <div className={style.rightPane}>
      <div className={style.paneHeader}>
        <span className={style.paneTitle}>
          图表预览
          {!source.trim() && <span className={style.subHint}>渲染中...</span>}
        </span>
        <Space size={6} wrap>
          <Select
            size="small"
            value={theme}
            onChange={onThemeChange}
            options={THEME_OPTIONS}
            style={{ width: 86 }}
            popupMatchSelectWidth={false}
          />
        </Space>
      </div>

      <div className={style.previewWrap}>
        <MermaidRenderer source={source} debounceMs={300} />
      </div>
    </div>
  );
}
