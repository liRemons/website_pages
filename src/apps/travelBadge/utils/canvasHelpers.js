import { generateId } from './styleHelpers';
import { DEFAULT_TEXT_PROPS } from './constants';

/**
 * 手动调整层级：up=上移一层, down=下移一层, top=置顶, bottom=置底
 */
export const createChangeZIndex = (setElements) => (id, direction) => {
  setElements((prev) => {
    const sorted = [...prev].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const index = sorted.findIndex((el) => el.id === id);
    if (index === -1) return prev;

    if (direction === 'top') {
      const maxZ = sorted[sorted.length - 1].zIndex || 0;
      return prev.map((el) => el.id === id ? { ...el, zIndex: maxZ + 1 } : el);
    }
    if (direction === 'bottom') {
      const minZ = sorted[0].zIndex || 0;
      return prev.map((el) => el.id === id ? { ...el, zIndex: minZ - 1 } : el);
    }
    if (direction === 'up' && index < sorted.length - 1) {
      const nextZ = sorted[index + 1].zIndex || 0;
      const currentZ = sorted[index].zIndex || 0;
      return prev.map((el) => {
        if (el.id === id) return { ...el, zIndex: nextZ };
        if (el.id === sorted[index + 1].id) return { ...el, zIndex: currentZ };
        return el;
      });
    }
    if (direction === 'down' && index > 0) {
      const prevZ = sorted[index - 1].zIndex || 0;
      const currentZ = sorted[index].zIndex || 0;
      return prev.map((el) => {
        if (el.id === id) return { ...el, zIndex: prevZ };
        if (el.id === sorted[index - 1].id) return { ...el, zIndex: currentZ };
        return el;
      });
    }
    return prev;
  });
};

/**
 * 添加图片元素到画布
 */
export const createAddImageElement = (setElements, setCanvasRatio, setSelectedId, canvasRef) => (url) => {
  const img = new Image();
  img.onload = () => {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const ratio = naturalWidth / naturalHeight;

    const canvasDom = canvasRef.current;
    const canvasDisplayWidth = canvasDom ? canvasDom.getBoundingClientRect().width : 600;
    const canvasDisplayHeight = canvasDom ? canvasDom.getBoundingClientRect().height : 450;

    setElements((prev) => {
      const isFirstImage = !prev.some((el) => el.type === 'image');

      if (isFirstImage) {
        // 第一张图：画布比例跟随图片，图片铺满画布
        // 竖图时画布高度上限 = 空状态时的高度（宽度 × 3/4），超出则用 contain 模式
        const maxCanvasHeight = canvasDisplayWidth * (3 / 4);
        const idealCanvasHeight = canvasDisplayWidth / ratio;
        const isHeightOverLimit = idealCanvasHeight > maxCanvasHeight;

        if (isHeightOverLimit) {
          // 超出上限：画布保持 4/3 比例，图片用 contain 居中展示
          // canvasRatio 保持 4/3 不变（不调用 setCanvasRatio，避免画布变成超高竖向）
          const newEl = {
            id: generateId(),
            type: 'image',
            url,
            x: 0,
            y: 0,
            width: canvasDisplayWidth,
            height: maxCanvasHeight,
            objectFit: 'contain',
            zIndex: 1,
          };
          return [newEl];
        }

        // 未超出上限：正常铺满画布，画布比例跟随图片
        setCanvasRatio(ratio);
        const newEl = {
          id: generateId(),
          type: 'image',
          url,
          x: 0,
          y: 0,
          width: canvasDisplayWidth,
          height: idealCanvasHeight,
          zIndex: 1,
        };
        return [newEl];
      } else {
        // 后续图片：按图片比例缩放，居中放置，最大 60% 画布
        const maxW = canvasDisplayWidth * 0.6;
        const maxH = canvasDisplayHeight * 0.6;
        let displayW = Math.min(naturalWidth, maxW);
        let displayH = displayW / ratio;
        if (displayH > maxH) { displayH = maxH; displayW = maxH * ratio; }
        const newEl = {
          id: generateId(),
          type: 'image',
          url,
          x: (canvasDisplayWidth - displayW) / 2,
          y: (canvasDisplayHeight - displayH) / 2,
          width: displayW,
          height: displayH,
          zIndex: prev.length + 1,
        };
        setSelectedId(newEl.id);
        return [...prev, newEl];
      }
    });
  };
  img.src = url;
};

/**
 * 添加文字元素到画布
 */
export const createAddTextElement = (setElements, setSelectedId) => () => {
  setElements((prev) => {
    const maxZ = prev.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    const newEl = {
      id: generateId(),
      type: 'text',
      x: 60,
      y: 60,
      width: 200,
      height: 60,
      zIndex: maxZ + 100,
      textProps: { ...DEFAULT_TEXT_PROPS },
    };
    setSelectedId(newEl.id);
    return [...prev, newEl];
  });
};
