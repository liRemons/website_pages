import { message } from "antd";

/**
 * 通用下载：将 Blob 或 URL 作为文件下载
 * @param {Blob|string} data - Blob 对象或 URL 字符串
 * @param {string} filename - 下载文件名
 * @param {object} [options] - 可选配置
 * @param {string} [options.type] - MIME 类型（data 为 Blob 时自动识别）
 */
export function downloadFile(data, filename, options = {}) {
  let url;
  if (data instanceof Blob) {
    url = URL.createObjectURL(data);
  } else if (typeof data === "string") {
    url = data;
  } else {
    message.error("不支持的下载格式");
    return;
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  message.success(`${filename} 已下载`);
}

/**
 * 下载 SVG 字符串为 .svg 文件
 * @param {string} svgStr - SVG 内容
 * @param {string} filename - 文件名（不含后缀）
 */
export function downloadSVG(svgStr, filename = "image") {
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  downloadFile(blob, `${filename}.svg`);
}

/**
 * 将 SVG 渲染为 PNG 并下载
 * @param {string} svgStr - SVG 内容
 * @param {string} filename - 文件名（不含后缀）
 * @param {number} [scale=2] - 缩放倍数（提高清晰度）
 */
export function downloadSVGAsPNG(svgStr, filename = "image", scale = 2) {
  const { w, h } = getSvgSize(svgStr);
  const encoded = btoa(unescape(encodeURIComponent(svgStr)));
  const url = `data:image/svg+xml;base64,${encoded}`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) {
        message.error("PNG 生成失败");
        return;
      }
      downloadFile(pngBlob, `${filename}.png`);
    }, "image/png");
  };
  img.onerror = () => {
    message.error("PNG 生成失败：图片加载失败");
  };
  img.src = url;
}

/**
 * 从 SVG 字符串中解析宽高（用于导出）
 * @param {string} svgStr
 * @returns {{w: number, h: number}}
 */
function getSvgSize(svgStr) {
  let w = 0;
  let h = 0;
  const wMatch = svgStr.match(/\bwidth="([\d.]+)px?"/i);
  const hMatch = svgStr.match(/\bheight="([\d.]+)px?"/i);
  if (wMatch) w = parseFloat(wMatch[1]);
  if (hMatch) h = parseFloat(hMatch[1]);
  if (!w || !h) {
    const vb = svgStr.match(/viewBox="([^"]+)"/i);
    if (vb) {
      const parts = vb[1].split(/[\s,]+/).map(Number);
      w = w || parts[2] || 0;
      h = h || parts[3] || 0;
    }
  }
  return { w: w || 800, h: h || 600 };
}
