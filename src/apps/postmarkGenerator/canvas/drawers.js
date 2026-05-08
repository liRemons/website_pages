/** 角度（度）→ 弧度 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/** 磨损做旧效果（所有样式共用） */
function applyWornEffect(ctx, centerX, centerY, radius) {
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 45; i++) {
    const x = centerX + (Math.random() - 0.5) * radius * 1.6;
    const y = centerY + (Math.random() - 0.5) * radius * 1.6;
    const w = Math.random() * 10 + 2;
    const h = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * 沿圆弧逐字绘制文本
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text       要绘制的文字
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} arcRadius  文字基线所在圆弧半径
 * @param {boolean} isTop     true=上弧（字朝上），false=下弧（字朝下）
 * @param {string} font
 * @param {string} color
 */
function drawArcText(ctx, text, centerX, centerY, arcRadius, isTop, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.split('');
  const totalWidth = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
  const totalAngle = totalWidth / arcRadius;
  const letterSpacingAngle = degToRad(1.5);
  const totalSpacingAngle = letterSpacingAngle * (chars.length - 1);
  const spanAngle = totalAngle + totalSpacingAngle;

  if (isTop) {
    let currentAngle = -Math.PI / 2 - spanAngle / 2;
    chars.forEach((ch) => {
      const charAngle = ctx.measureText(ch).width / arcRadius;
      const drawAngle = currentAngle + charAngle / 2;
      ctx.save();
      ctx.translate(
        centerX + arcRadius * Math.cos(drawAngle),
        centerY + arcRadius * Math.sin(drawAngle),
      );
      ctx.rotate(drawAngle + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      currentAngle += charAngle + letterSpacingAngle;
    });
  } else {
    let currentAngle = Math.PI / 2 + spanAngle / 2;
    chars.forEach((ch) => {
      const charAngle = ctx.measureText(ch).width / arcRadius;
      const drawAngle = currentAngle - charAngle / 2;
      ctx.save();
      ctx.translate(
        centerX + arcRadius * Math.cos(drawAngle),
        centerY + arcRadius * Math.sin(drawAngle),
      );
      ctx.rotate(drawAngle - Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      currentAngle -= charAngle + letterSpacingAngle;
    });
  }
}

// ─── 各样式绘制函数 ───────────────────────────────────────────────────────────

/** classic：经典双圆，地点居中上方，日期居中下方 */
function drawClassic(ctx, opts) {
  const { location, date, color, stampSize, locationFont, locationFontSize, dateFontFamily, dateFontSize } = opts;
  const cx = stampSize / 2;
  const cy = stampSize / 2;
  const radius = stampSize / 2 - stampSize * 0.07;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  ctx.lineWidth = Math.max(2, stampSize * 0.027);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = Math.max(1, stampSize * 0.013);
  ctx.beginPath();
  ctx.arc(cx, cy, radius - stampSize * 0.05, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${locationFontSize}px ${locationFont}`;
  ctx.fillStyle = color;
  ctx.fillText(location.toUpperCase(), cx, cy - locationFontSize * 0.6);

  ctx.font = `${dateFontSize}px ${dateFontFamily}`;
  ctx.fillText(date, cx, cy + dateFontSize * 0.8);

  applyWornEffect(ctx, cx, cy, radius);
}

/** arc：弧形文字，地点沿上圆弧，日期沿下圆弧 */
function drawArc(ctx, opts) {
  const { location, date, color, stampSize, locationFont, locationFontSize, dateFontFamily, dateFontSize } = opts;
  const cx = stampSize / 2;
  const cy = stampSize / 2;
  const outerRadius = stampSize / 2 - stampSize * 0.07;
  const innerRadius = outerRadius - stampSize * 0.06;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  ctx.lineWidth = Math.max(2, stampSize * 0.027);
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = Math.max(1, stampSize * 0.013);
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 水平中间分隔线
  ctx.lineWidth = Math.max(1, stampSize * 0.013);
  const lineHalf = innerRadius * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - lineHalf, cy);
  ctx.lineTo(cx + lineHalf, cy);
  ctx.stroke();

  const topArcRadius = innerRadius - locationFontSize * 1.2;
  drawArcText(ctx, location.toUpperCase(), cx, cy, topArcRadius, true,
    `bold ${locationFontSize}px ${locationFont}`, color);

  const bottomArcRadius = innerRadius - dateFontSize * 1.2;
  drawArcText(ctx, date, cx, cy, bottomArcRadius, false,
    `${dateFontSize}px ${dateFontFamily}`, color);

  applyWornEffect(ctx, cx, cy, outerRadius);
}

/** vintage：复古单圆，粗外框 + 星号分隔符 */
function drawVintage(ctx, opts) {
  const { location, date, color, stampSize, locationFont, locationFontSize, dateFontFamily, dateFontSize } = opts;
  const cx = stampSize / 2;
  const cy = stampSize / 2;
  const radius = stampSize / 2 - stampSize * 0.07;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  ctx.lineWidth = Math.max(4, stampSize * 0.05);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const starSize = Math.max(8, stampSize * 0.06);
  const totalHeight = locationFontSize + starSize * 1.6 + dateFontSize;
  const startY = cy - totalHeight / 2;

  ctx.font = `bold ${locationFontSize}px ${locationFont}`;
  ctx.fillStyle = color;
  ctx.fillText(location.toUpperCase(), cx, startY + locationFontSize / 2);

  ctx.font = `${starSize}px serif`;
  const starY = startY + locationFontSize + starSize * 0.8 + 4;
  ctx.fillText('★  ★  ★', cx, starY);

  ctx.font = `${dateFontSize}px ${dateFontFamily}`;
  ctx.fillText(date, cx, starY + starSize * 0.8 + dateFontSize / 2 + 4);

  applyWornEffect(ctx, cx, cy, radius);
}

// ─── 汇总导出 ─────────────────────────────────────────────────────────────────

const STAMP_DRAWERS = {
  classic: drawClassic,
  arc: drawArc,
  vintage: drawVintage,
};

export function drawStampToCanvas(canvas, options) {
  const { stampSize, rotation, stampStyle } = options;

  canvas.width = stampSize;
  canvas.height = stampSize;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, stampSize, stampSize);

  const cx = stampSize / 2;
  const cy = stampSize / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  const drawer = STAMP_DRAWERS[stampStyle] || drawClassic;
  drawer(ctx, options);

  ctx.restore();
}
