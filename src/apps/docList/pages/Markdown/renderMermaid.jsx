import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Modal, Button, message, Tooltip } from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  ReloadOutlined,
  CodeOutlined,
  UpOutlined,
  DownOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { copy, IsPC } from "methods-r";
import { ThemeProvider } from "@/hooks/useTheme";
import MermaidRenderer from "@/components/MermaidRenderer";

// ==================== 源码弹窗组件 ====================
function SourceModal({ code, open, onClose }) {
  const handleCopy = () => {
    if (typeof copy === "function") {
      copy(code);
      message.success("复制成功");
    } else {
      navigator.clipboard.writeText(code).then(() => message.success("复制成功"));
    }
  };

  return (
    <Modal
      open={open}
      title="Mermaid 源码"
      width={800}
      destroyOnClose
      onCancel={onClose}
      footer={[
        <Button key="copy" type="primary" onClick={handleCopy}>
          复制源码
        </Button>,
      ]}
    >
      <pre>
        <code>{code}</code>
      </pre>
    </Modal>
  );
}

// ==================== 单个 Mermaid 图表组件 ====================
// 基于 MermaidRenderer 封装，补充折叠/展开和源码查看功能
function MermaidBlock({ source }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wrapperRef = useRef(null);
  const rendererRef = useRef(null);
  const [panzoomKey, setPanzoomKey] = useState(0);

  // 监听原生全屏状态
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setIsCollapsed(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleAction = useCallback((action) => {
    switch (action) {
      case "viewSource":
        setShowSource(true);
        break;
      case "toggleCollapse":
        setIsCollapsed((prev) => {
          const next = !prev;
          if (!next) setPanzoomKey((k) => k + 1);
          return next;
        });
        break;
      case "toggleFullscreen": {
        const el = wrapperRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsCollapsed(true);
        } else {
          el.requestFullscreen();
          setIsCollapsed(false);
        }
        break;
      }
      default:
        break;
    }
  }, []);

  const isPC = IsPC();
  const shouldEnablePanzoom = isFullscreen || !isCollapsed;

  const toolbarButtons = [
    { icon: <PlusOutlined />, title: "放大", action: "zoomIn", isShow: !!shouldEnablePanzoom },
    { icon: <MinusOutlined />, title: "缩小", action: "zoomOut", isShow: !!shouldEnablePanzoom },
    { icon: <ReloadOutlined />, title: "重置", action: "reset" },
    { icon: <CodeOutlined />, title: "查看源码", action: "viewSource", isShow: !isFullscreen },
    {
      icon: isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
      title: isFullscreen ? "退出全屏" : "全屏",
      action: "toggleFullscreen",
    },
    {
      icon: isCollapsed ? <DownOutlined /> : <UpOutlined />,
      title: isCollapsed ? "展开" : "收起",
      action: "toggleCollapse",
      isShow: !isFullscreen,
    },
  ].filter((item) => item.isShow !== false);

  return (
    <div
      ref={wrapperRef}
      className={`mermaid-wrapper${isCollapsed ? " mermaid-collapsed" : ""}`}
      style={{ position: "relative" }}
    >
      <div className="mermaid-toolbar">
        {toolbarButtons.map((btn) => (
          <Tooltip title={btn.title} key={btn.action}>
            <button
              className={`circle${isPC ? "" : " circle-mobile"}`}
              title={btn.title}
              onClick={() => {
                if (["viewSource", "toggleCollapse", "toggleFullscreen"].includes(btn.action)) {
                  handleAction(btn.action);
                } else if (rendererRef.current?.handleAction) {
                  rendererRef.current.handleAction(btn.action);
                }
              }}
            >
              {btn.icon}
            </button>
          </Tooltip>
        ))}
      </div>

      <div
        className="mermaid-fullscreen-target"
        style={{ width: "100%", height: "100%", background: "var(--color-bg-card, #f8f9fa)" }}
      >
        <MermaidRenderer
          key={panzoomKey}
          source={source}
          showToolbar={false}
          enablePanzoom={shouldEnablePanzoom}
          minHeight={0}
          ref={rendererRef}
        />
      </div>

      <SourceModal code={source} open={showSource} onClose={() => setShowSource(false)} />
    </div>
  );
}

// ==================== 主入口函数 ====================
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
          <MermaidBlock source={source} />
        </ThemeProvider>
      </React.StrictMode>
    );
  }
}

export default renderMermaidWithControls;
