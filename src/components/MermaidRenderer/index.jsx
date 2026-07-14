import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Tooltip, Dropdown, message } from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  AimOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import Panzoom from "@panzoom/panzoom";
import useLoadMermaid from "@/hooks/useLoadMermaid";
import { useTheme } from "@/hooks/useTheme";
import { downloadSVG, downloadSVGAsPNG } from "@utils";
import style from "./index.module.less";

let renderIdSeq = 0;

const MermaidRenderer = forwardRef(function MermaidRenderer(
  {
    source,
    debounceMs = 300,
    showToolbar = true,
    enablePanzoom = true,
    className = "",
    minHeight = 200,
  },
  ref
) {
  const { mermaid, loading } = useLoadMermaid();
  const { isDark } = useTheme();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const panzoomRef = useRef(null);
  const renderSeqRef = useRef(0);

  // 暴露 handleAction 给父组件
  useImperativeHandle(ref, () => ({
    handleAction(action) {
      const pz = panzoomRef.current;
      switch (action) {
        case "zoomIn":
          pz?.zoomIn();
          break;
        case "zoomOut":
          pz?.zoomOut();
          break;
        case "reset":
          pz?.reset();
          break;
        case "toggleFullscreen": {
          const el = wrapperRef.current;
          if (!el) return;
          pz?.reset();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            el.requestFullscreen?.();
          }
          break;
        }
        default:
          break;
      }
    },
  }));

  // 主题变化时重新初始化 mermaid
  useEffect(() => {
    if (!mermaid) return;
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "loose",
    });
  }, [mermaid, isDark]);

  // 防抖渲染
  useEffect(() => {
    if (!mermaid) return;
    const text = (source || "").trim();
    if (!text) {
      setSvg("");
      setError("");
      return;
    }
    setError("");
    const seq = ++renderSeqRef.current;
    const timer = setTimeout(async () => {
      const id = `mermaid-render-${renderIdSeq++}`;
      try {
        const { svg: svgStr } = await mermaid.render(id, text);
        if (seq !== renderSeqRef.current) return;
        setSvg(svgStr);
        setError("");
      } catch (err) {
        if (seq !== renderSeqRef.current) return;
        console.error("Mermaid render error:", err);
        setError(err?.message?.split("\n")[0] || String(err));
      } finally {
        const leftover = document.getElementById(id) || document.getElementById(`d${id}`);
        if (leftover && leftover.parentNode) leftover.parentNode.removeChild(leftover);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [source, isDark, mermaid, debounceMs]);

  // 初始化 Panzoom
  useEffect(() => {
    if (!enablePanzoom || !contentRef.current || !svg) return;
    if (panzoomRef.current) {
      panzoomRef.current.destroy();
      panzoomRef.current = null;
    }
    panzoomRef.current = Panzoom(contentRef.current, {
      maxScale: 5,
      minScale: 0.1,
      startScale: 1,
      contain: isFullscreen ? false : "outside",
    });
    const wheelTarget = wrapperRef.current;
    const handleWheel = panzoomRef.current.zoomWithWheel;
    wheelTarget?.addEventListener("wheel", handleWheel);
    return () => {
      wheelTarget?.removeEventListener("wheel", handleWheel);
      panzoomRef.current?.destroy();
      panzoomRef.current = null;
    };
  }, [svg, isFullscreen, enablePanzoom]);

  // 监听原生全屏状态
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleDownloadSVG = useCallback(() => {
    if (!svg) {
      message.warning("暂无图表");
      return;
    }
    downloadSVG(svg, "mermaid");
  }, [svg]);

  const handleDownloadPNG = useCallback(() => {
    if (!svg) {
      message.warning("暂无图表");
      return;
    }
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

  if (loading) {
    return (
      <div className={style.emptyTip} style={{ minHeight }}>
        图表加载中...
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`${style.wrapper} ${className}`} style={{ minHeight }}>
      {/* 工具栏 */}
      {showToolbar && hasDiagram && (
        <div className={style.toolbar}>
          <Tooltip title="放大">
            <button className={style.toolbarBtn} onClick={() => panzoomRef.current?.zoomIn()}>
              <PlusOutlined />
            </button>
          </Tooltip>
          <Tooltip title="缩小">
            <button className={style.toolbarBtn} onClick={() => panzoomRef.current?.zoomOut()}>
              <MinusOutlined />
            </button>
          </Tooltip>
          <Tooltip title="重置">
            <button className={style.toolbarBtn} onClick={() => panzoomRef.current?.reset()}>
              <AimOutlined />
            </button>
          </Tooltip>
          <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
            <button className={style.toolbarBtn} onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                wrapperRef.current?.requestFullscreen?.();
              }
            }}>
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
          </Tooltip>
          <Dropdown menu={downloadMenu} trigger={["click"]}>
            <button className={style.toolbarBtn}>
              <DownloadOutlined />
            </button>
          </Dropdown>
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
        {!hasDiagram && !error && (
          <div className={style.emptyTip}>
            {source?.trim() ? "渲染中..." : "← 输入 Mermaid 源码"}
          </div>
        )}
      </div>
    </div>
  );
});

export default MermaidRenderer;
