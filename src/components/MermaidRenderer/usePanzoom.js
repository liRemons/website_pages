import { useRef, useEffect } from "react";
import Panzoom from "@panzoom/panzoom";

/**
 * 共享 Panzoom 平移缩放逻辑
 * - 在 contentRef 上初始化 Panzoom
 * - 绑定滚轮事件到 wrapperRef
 * - 返回 panzoomRef 以便外部调用 zoomIn / zoomOut / reset
 */
export default function usePanzoom({ contentRef, wrapperRef, enabled, svg, isFullscreen }) {
  const panzoomRef = useRef(null);

  useEffect(() => {
    if (!enabled || !contentRef.current || !svg) {
      // 条件不满足时销毁已有实例
      if (panzoomRef.current) {
        panzoomRef.current.destroy();
        panzoomRef.current = null;
      }
      return;
    }
    // 重新创建前先销毁旧实例
    if (panzoomRef.current) {
      panzoomRef.current.destroy();
      panzoomRef.current = null;
    }
    const elem = contentRef.current;
    panzoomRef.current = Panzoom(elem, {
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
  }, [svg, isFullscreen, enabled, contentRef, wrapperRef]);

  return panzoomRef;
}
