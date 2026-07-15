import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { createRoot } from "react-dom/client";
import { Dropdown, message, Modal, Button, Tooltip } from "antd";
import {
  PlusOutlined, MinusOutlined,
  FullscreenOutlined, FullscreenExitOutlined,
  DownloadOutlined, ReloadOutlined, CodeOutlined,
  UpOutlined, DownOutlined,
  ImportOutlined, ExportOutlined, LoadingOutlined
} from "@ant-design/icons";
import { downloadSVG, downloadSVGAsPNG } from "@utils";
import { copy } from "methods-r";
import { useTheme, ThemeProvider } from "@/hooks/useTheme";
import useMermaidRender from "./useMermaidRender";
import usePanzoom from "./usePanzoom";
import style from "./index.module.less";
import '@assets/css/index.global.less';
import classNames from "classnames/bind";
import { IsPC } from 'methods-r';

// ==================== 统一 Mermaid 渲染组件 ====================
const MermaidRenderer = forwardRef(function MermaidRenderer(
  {
    source,
    debounceMs = 300,
    enablePanzoom = true,
    showDownload = true,
    showSourceView = false,
    showCollapse = false,
    defaultCollapsed = true,
    className = "",
    minHeight = 200,
  },
  ref
) {
  const titleMatch = source.match(/---\s*\n\s*title:\s*(.+)\s*\n\s*---/);
  const title = titleMatch ? titleMatch[1].trim() : 'mermaid 图表';
  const { isDark } = useTheme();

  const { svg, error, loading } = useMermaidRender({ source, debounceMs, isDark });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showSource, setShowSource] = useState(false);
  const [isMinimize, setIsMinimize] = useState(showSourceView);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const isPanzoomActive = enablePanzoom && (isFullscreen || !isCollapsed || !showCollapse);
  const panzoomRef = usePanzoom({
    contentRef, wrapperRef,
    enabled: isPanzoomActive && !!svg,
    svg, isFullscreen,
  });

  useImperativeHandle(ref, () => ({
    handleAction(action) {
      const pz = panzoomRef.current;
      switch (action) {
        case "zoomIn": pz?.zoomIn(); break;
        case "zoomOut": pz?.zoomOut(); break;
        case "reset": pz?.reset(); break;
        case "toggleFullscreen": {
          const el = wrapperRef.current;
          if (!el) return;
          pz?.reset();
          if (document.fullscreenElement) document.exitFullscreen();
          else el.requestFullscreen?.();
          break;
        }
      }
    },
  }));

  // 监听原生全屏状态
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && showCollapse) {
        setIsCollapsed(true);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [showCollapse]);

  const handleDownloadSVG = useCallback(() => {
    if (!svg) { message.warning("暂无图表"); return; }
    downloadSVG(svg, "mermaid");
  }, [svg]);

  const handleDownloadPNG = useCallback(() => {
    if (!svg) { message.warning("暂无图表"); return; }
    downloadSVGAsPNG(svg, "mermaid", 2);
  }, [svg]);

  const downloadMenu = {
    items: [
      { key: "svg", label: "下载 SVG" },
      { key: "png", label: "下载 PNG" },
    ],
    onClick: ({ key }) => (key === "svg" ? handleDownloadSVG() : handleDownloadPNG()),
  };

  const hasDiagram = !!svg;

  return (
    <div
      ref={wrapperRef}
      className={
        classNames(
          showCollapse ? "mermaid-wrapper" : "",
          isCollapsed && showCollapse && !isMinimize ? " mermaid-collapsed" : "",
          className,
          isMinimize && isCollapsed && !isFullscreen ? 'mermaid-mini' : ''
        )
      }
      style={{ minHeight: isMinimize ? 0 : minHeight, position: "relative", height: '100%' }}
    >
      {/* 工具栏 */}
      <div className="mermaid-title">{title}</div>
     {!hasDiagram && <div className="mermaid-toolbar-loading"><LoadingOutlined /></div>}
      {hasDiagram && (
        <div className="mermaid-toolbar">
          {[
            {
              isShow: showSourceView && isCollapsed && !isFullscreen,
              icon: isMinimize ? <ExportOutlined /> : <ImportOutlined />,
              tooltip: isMinimize ? '缩略图' : '最小化',
              onClick: () => setIsMinimize((prev) => !prev),
              className: 'minimize-btn',
            },
            {
              isShow: isPanzoomActive,
              icon: <PlusOutlined />,
              tooltip: '放大',
              onClick: () => panzoomRef.current?.zoomIn(),
            },
            {
              isShow: isPanzoomActive,
              icon: <MinusOutlined />,
              tooltip: '缩小',
              onClick: () => panzoomRef.current?.zoomOut(),
            },
            {
              isShow: isPanzoomActive,
              icon: <ReloadOutlined />,
              tooltip: '重置',
              onClick: () => panzoomRef.current?.reset(),
            },
            {
              isShow: true,
              icon: isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
              tooltip: isFullscreen ? '退出全屏' : '全屏',
              onClick: () => {
                if (document.fullscreenElement) document.exitFullscreen();
                else wrapperRef.current?.requestFullscreen?.();
              },
            },
            {
              isShow: showDownload,
              icon: <DownloadOutlined />,
              tooltip: '下载',
              dropdown: downloadMenu,
            },
            {
              isShow: showSourceView && !isFullscreen,
              icon: <CodeOutlined />,
              tooltip: '查看源码',
              onClick: () => setShowSource(true),
            },
            {
              isShow: showCollapse && !isFullscreen,
              icon: isCollapsed ? <DownOutlined /> : <UpOutlined />,
              tooltip: isCollapsed ? '展开' : '收起',
              onClick: () => setIsCollapsed((prev) => !prev),
            },
          ].map((item, index) => {
            if (item.isShow === false) return null;
            const btn = item.dropdown ? (
              <Dropdown key={index} menu={item.dropdown} trigger={["click"]}>
                <div className={`circle${item.className ? ` ${item.className}` : ''}`}>{item.icon}</div>
              </Dropdown>
            ) : (
              <div key={index} className={`circle${item.className ? ` ${item.className}` : ''}`} onClick={item.onClick}>
                {item.icon}
              </div>
            );
            return item.tooltip && IsPC() ? (
              <Tooltip key={index} title={item.tooltip}>
                {btn}
              </Tooltip>
            ) : btn;
          })}
        </div>
      )}

      {/* 错误提示 */}
      {error && <div className={style.errorTip}>⚠️ {error}</div>}

      {/* 预览区域 */}
      <div className={style.previewArea} style={{ minHeight: hasDiagram ? "auto" : minHeight }}>
        <div
          ref={contentRef}
          className={style.previewContent}
          dangerouslySetInnerHTML={{ __html: svg || "" }}
        />
        {((!hasDiagram && !error) || loading) && (
          <div className={style.emptyTip}>
            {source?.trim() ? "渲染中..." : "\u2190 输入 Mermaid 源码"}
          </div>
        )}
      </div>

      {/* 源码弹窗 */}
      {showSourceView && (
        <Modal
          open={showSource}
          title="Mermaid 源码"
          width={800}
          destroyOnClose
          onCancel={() => setShowSource(false)}
          footer={[
            <Button key="copy" type="primary" onClick={() => {
              if (typeof copy === "function") { copy(source); message.success("复制成功"); }
              else { navigator.clipboard.writeText(source).then(() => message.success("复制成功")); }
            }}>
              复制源码
            </Button>,
          ]}
        >
          <pre><code>{source}</code></pre>
        </Modal>
      )}
    </div>
  );
});

// ==================== DOM 扫描入口（文档页使用） ====================
async function renderMermaidWithControls() {
  const blocks = document.querySelectorAll("code.language-mermaid");

  for (const block of blocks) {
    const pre = block.parentElement;
    const source = block.textContent.trim();

    const container = document.createElement("div");
    container.className = "mermaid-react-root";
    pre.replaceWith(container);

    const root = createRoot(container);

    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <MermaidRenderer
            source={source}
            enablePanzoom
            showDownload
            showSourceView
            showCollapse
            defaultCollapsed
            minHeight={200}
          />
        </ThemeProvider>
      </React.StrictMode>
    );
  }
}

export default MermaidRenderer;
export { renderMermaidWithControls };
