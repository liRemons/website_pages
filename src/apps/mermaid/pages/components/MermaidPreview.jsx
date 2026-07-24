import React from "react";
import style from "../index.module.less";
import { renderMermaid } from "remons-render-markdown";

/**
 * 右栏：Mermaid 图表预览
 * 包装 MermaidRenderer 组件，补充主题选择器
 */
export default function MermaidPreview({ source }) {
  return (
    <div className={style.rightPane}>
      <div className={style.previewWrap}>
        {
          renderMermaid({
            source: source,
            debounceMs: 300, // 防抖时间，防止频繁渲染
          })
        }
      </div>
    </div>
  );
}
