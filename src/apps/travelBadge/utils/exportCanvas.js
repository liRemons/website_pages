/**
 * 原生 Canvas API 导出图片
 * 遍历画布中的所有元素，逐一绘制到离屏 Canvas 上，最终导出为 PNG。
 */

// 将 CSS 颜色字符串解析为 rgba 分量（用于 Canvas 绘图）
const hexToRgba = (hex, alpha = 1) => {
  const cleaned = hex.replace('#', '');
  const fullHex = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// 加载图片为 HTMLImageElement（支持跨域）
const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    img.src = url;
  });

// 根据 objectFit 计算图片在容器内的实际绘制区域
const calcObjectFitRect = (img, x, y, width, height, objectFit) => {
  if (!objectFit || objectFit === 'fill') {
    return { dx: x, dy: y, dw: width, dh: height };
  }
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = width / height;
  let dw, dh;
  if (objectFit === 'contain') {
    if (imgRatio > boxRatio) { dw = width; dh = width / imgRatio; }
    else { dh = height; dw = height * imgRatio; }
  } else if (objectFit === 'cover') {
    if (imgRatio > boxRatio) { dh = height; dw = height * imgRatio; }
    else { dw = width; dh = width / imgRatio; }
  } else {
    dw = img.naturalWidth; dh = img.naturalHeight;
  }
  return { dx: x + (width - dw) / 2, dy: y + (height - dh) / 2, dw, dh };
};

// 绘制单个图片元素
const drawImageElement = async (ctx, element) => {
  try {
    const img = await loadImage(element.url);
    const { x, y, width, height, borderRadius = 0, objectFit = 'cover' } = element;
    const { dx, dy, dw, dh } = calcObjectFitRect(img, x, y, width, height, objectFit);
    
    // 如果有圆角或 objectFit=cover 需要裁剪
    if (borderRadius > 0 || objectFit === 'cover') {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, borderRadius);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  } catch {
    const { x, y, width, height, borderRadius = 0 } = element;
    ctx.fillStyle = '#333';
    
    // 如果有圆角，绘制圆角矩形
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
    }
    
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('图片加载失败', x + width / 2, y + height / 2);
  }
};

// 计算一行文字在指定 letterSpacing 下的总宽度
const measureLineWidth = (ctx, text, letterSpacing) => {
  if (!letterSpacing) return ctx.measureText(text).width;
  let totalWidth = 0;
  for (const char of text) {
    totalWidth += ctx.measureText(char).width + letterSpacing;
  }
  // 最后一个字符后不加间距
  return totalWidth - letterSpacing;
};

// 逐字符绘制一行文字（支持 letterSpacing）
const drawLineWithSpacing = (ctx, text, startX, lineY, letterSpacing, drawFn) => {
  if (!letterSpacing) {
    drawFn(text, startX, lineY);
    return;
  }
  let currentX = startX;
  for (const char of text) {
    drawFn(char, currentX, lineY);
    currentX += ctx.measureText(char).width + letterSpacing;
  }
};

// 绘制单个文字元素
const drawTextElement = (ctx, element) => {
  const { textProps, x, y, width, height } = element;
  const {
    fontFamily, fontSize, fontWeight, fontStyle,
    letterSpacing = 0,
    useGradient, color, gradientFrom, gradientTo, gradientAngle,
    strokeWidth, strokeColor,
    shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor,
    content,
  } = textProps;

  ctx.save();

  // 阴影
  if (shadowBlur || shadowOffsetX || shadowOffsetY) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
  }

  // 字体
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // 填充色（纯色或渐变）
  if (useGradient) {
    const angleRad = (gradientAngle * Math.PI) / 180;
    const gradientLength = Math.sqrt(width * width + height * height);
    const gx1 = centerX - (Math.cos(angleRad) * gradientLength) / 2;
    const gy1 = centerY - (Math.sin(angleRad) * gradientLength) / 2;
    const gx2 = centerX + (Math.cos(angleRad) * gradientLength) / 2;
    const gy2 = centerY + (Math.sin(angleRad) * gradientLength) / 2;
    const gradient = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
    gradient.addColorStop(0, gradientFrom);
    gradient.addColorStop(1, gradientTo);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = color;
  }

  // 多行文字处理
  const lines = content.split('\n');
  const lineHeight = fontSize * 1.3;
  const totalTextHeight = lines.length * lineHeight;
  const startY = centerY - totalTextHeight / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    // 计算行宽，使文字水平居中
    const lineWidth = measureLineWidth(ctx, line, letterSpacing);
    const lineStartX = centerX - lineWidth / 2;

    drawLineWithSpacing(ctx, line, lineStartX, lineY, letterSpacing, (char, charX, charY) => {
      ctx.fillText(char, charX, charY);
    });

    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      drawLineWithSpacing(ctx, line, lineStartX, lineY, letterSpacing, (char, charX, charY) => {
        ctx.strokeText(char, charX, charY);
      });
    }
  });

  ctx.restore();
};

// 绘制相框边框
const drawFrame = (ctx, canvasWidth, canvasHeight, frameStyle) => {
  if (!frameStyle || !frameStyle.border) return;

  // 解析 border 字符串，如 "12px solid #c8a84b"
  const borderMatch = frameStyle.border.match(/(\d+)px\s+\w+\s+(\S+)/);
  if (!borderMatch) return;

  const borderWidth = parseInt(borderMatch[1], 10);
  const borderColor = borderMatch[2];

  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth * 2;
  ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
  ctx.restore();
};

/**
 * 主导出函数
 * @param {object} options
 * @param {Array}  options.elements        - 画布元素列表
 * @param {string} options.backgroundColor - 画布背景色
 * @param {object} options.frameStyle      - 相框样式对象
 * @param {number} options.canvasWidth     - 画布宽度（px）
 * @param {number} options.canvasHeight    - 画布高度（px）
 * @param {number} [options.scale=2]       - 导出分辨率倍数
 */
export const exportToImage = async ({
  elements,
  backgroundColor,
  frameStyle,
  canvasWidth,
  canvasHeight,
  scale = 2,
}) => {
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = canvasWidth * scale;
  offscreenCanvas.height = canvasHeight * scale;

  const ctx = offscreenCanvas.getContext('2d');
  ctx.scale(scale, scale);

  // 背景：未设置背景色时保持透明，编辑态棋盘格仅用于视觉提示，不参与导出
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 按 zIndex 排序后依次绘制元素
  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  for (const element of sortedElements) {
    if (element.type === 'image') {
      await drawImageElement(ctx, element);
    } else if (element.type === 'text') {
      drawTextElement(ctx, element);
    }
  }

  // 相框叠加在最上层
  drawFrame(ctx, canvasWidth, canvasHeight, frameStyle);

  // 触发下载：无背景色时导出 PNG 以保留透明通道
  const exportType = backgroundColor ? 'image/jpeg' : 'image/png';
  const fileExt = backgroundColor ? 'jpg' : 'png';
  const dataUrl = offscreenCanvas.toDataURL(exportType, 0.9);
  const link = document.createElement('a');
  link.download = `photo-editor-${Date.now()}.${fileExt}`;
  link.href = dataUrl;
  link.click();
};

/**
 * 截取画布内容生成封面缩略图 Blob
 * @param {object} options
 * @param {Array}  options.elements        - 画布元素列表
 * @param {string} options.backgroundColor - 画布背景色
 * @param {object} options.frameStyle      - 相框样式对象
 * @param {number} options.canvasWidth     - 画布宽度（px）
 * @param {number} options.canvasHeight    - 画布高度（px）
 * @returns {Promise<Blob>} JPEG 格式的封面图 Blob
 */
export const captureCanvasCover = async ({
  elements,
  backgroundColor = '#ffffff',
  frameStyle,
  canvasWidth,
  canvasHeight,
}) => {
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = canvasWidth;
  offscreenCanvas.height = canvasHeight;

  const ctx = offscreenCanvas.getContext('2d');

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  for (const element of sortedElements) {
    if (element.type === 'image') {
      await drawImageElement(ctx, element);
    } else if (element.type === 'text') {
      drawTextElement(ctx, element);
    }
  }

  drawFrame(ctx, canvasWidth, canvasHeight, frameStyle);

  return new Promise((resolve) => {
    offscreenCanvas.toBlob((blob) => resolve(blob), 'image/png');
  });
};
