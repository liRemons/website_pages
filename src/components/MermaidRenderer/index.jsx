import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { createRoot } from "react-dom/client";
import { Dropdown, message, Modal, Button } from "antd";
import {
  PlusOutlined, MinusOutlined,
  FullscreenOutlined, FullscreenExitOutlined,
  DownloadOutlined, ReloadOutlined, CodeOutlined,
  UpOutlined, DownOutlined,
} from "@ant-design/icons";
import { downloadSVG, downloadSVGAsPNG } from "@utils";
import { copy } from "methods-r";
import { useTheme, ThemeProvider } from "@/hooks/useTheme";
import useMermaidRender from "./useMermaidRender";
import usePanzoom from "./usePanzoom";
import style from "./index.module.less";
import '@assets/css/index.global.less';

// ==================== 统一 Mermaid 渲染组件 ====================
const MermaidRenderer = forwardRef(function MermaidRenderer(
  {
    source,
    debounceMs = 300,
    showToolbar = true,
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
  const { isDark } = useTheme();
  const { svg, error, loading } = useMermaidRender({ source, debounceMs, isDark });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showSource, setShowSource] = useState(false);

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
      className={`${showCollapse ? "mermaid-wrapper" : ""}${isCollapsed && showCollapse ? " mermaid-collapsed" : ""} ${className}`}
      style={{ minHeight, position: "relative", height: '100%' }}
    >
      {/* 工具栏 */}
      {showToolbar && hasDiagram && (
        <div className={showCollapse ? "mermaid-toolbar" : style.toolbar}>
          {/* 放大 / 缩小：仅在 panzoom 可用时显示 */}
          {isPanzoomActive && (
            <>
              <div className="circle" onClick={() => panzoomRef.current?.zoomIn()}>
                <PlusOutlined />
              </div>
              <div className="circle" onClick={() => panzoomRef.current?.zoomOut()}>
                <MinusOutlined />
              </div>
            </>
          )}
          <div className="circle" onClick={() => panzoomRef.current?.reset()}>
            <ReloadOutlined />
          </div>
          <div className="circle" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else wrapperRef.current?.requestFullscreen?.();
          }}>
            {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </div>
          {showDownload && (
            <Dropdown menu={downloadMenu} trigger={["click"]}>
              <div className="circle"><DownloadOutlined /></div>
            </Dropdown>
          )}
          {showSourceView && !isFullscreen && (
            <div className="circle" onClick={() => setShowSource(true)}>
              <CodeOutlined />
            </div>
          )}
          {showCollapse && !isFullscreen && (
            <div className="circle" onClick={() => setIsCollapsed((prev) => !prev)}>
              {isCollapsed ? <DownOutlined /> : <UpOutlined />}
            </div>
          )}
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
            showToolbar
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
