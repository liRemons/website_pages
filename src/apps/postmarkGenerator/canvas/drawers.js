/** 角度（度）→ 弧度 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/** 磨损做旧效果（所有样式共用），enabled=false 时跳过 */
function applyWornEffect(ctx, centerX, centerY, radius, enabled = true) {
  if (!enabled) return;
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
function drawArcText(ctx, text, centerX, centerY, arcRadius, isTop, font, color, letterSpacingDeg = 1.5) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.split('');
  const totalWidth = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
  const totalAngle = totalWidth / arcRadius;
  const letterSpacingAngle = degToRad(letterSpacingDeg);
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

  applyWornEffect(ctx, cx, cy, radius, opts.wornEffect);
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

  applyWornEffect(ctx, cx, cy, outerRadius, opts.wornEffect);
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

  applyWornEffect(ctx, cx, cy, radius, opts.wornEffect);
}

/**
 * arcStamp：弧形章
 *
 * 精确结构：
 *   ① 外圆（粗线）
 *   ② 内圆（细线）
 *   ③ 五颗五角星在外圆与内圆之间的环形带上半圆均匀分布
 *   ④ 内圆内部：两道平行装饰弧，上下各一段（四段弧形成完整双环装饰）
 *      - 上段：从 -150° 到 -30°，经过顶部 -90°
 *      - 下段：从  30°  到 150°，经过底部  90°
 *   ⑤ 地点大字居中
 *   ⑥ 日期在外圆与内圆之间的环形带下半部分，沿弧排列（isTop=false）
 */
function drawArcStamp(ctx, opts) {
  const { location, date, color, stampSize, locationFont, locationFontSize, dateFontFamily, dateFontSize } = opts;
  const cx = stampSize / 2;
  const cy = stampSize / 2;

  const outerRadius = stampSize / 2 - stampSize * 0.055;
  const ringW       = stampSize * 0.125;
  const innerRadius = outerRadius - ringW;

  ctx.strokeStyle = color;
  ctx.fillStyle   = color;

  // ① 外圆（粗线）
  ctx.lineWidth = Math.max(2, stampSize * 0.024);
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // ③ 五颗五角星：在环形带上半圆均匀分布
  const starTrackR = (outerRadius + innerRadius) / 2;
  const starSize   = Math.max(3, ringW * 0.35);
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + degToRad(-60 + i * 30);
    drawStar(ctx, cx + starTrackR * Math.cos(angle), cy + starTrackR * Math.sin(angle), starSize, color);
  }

  // ④ 内部装饰弧：上下各两道平行弧，形成完整的双环装饰
  //    arcOuterR 接近 innerRadius（环形带内侧边缘）
  //    断口：-167.5° 到 -12.5°（覆盖 155°，断口仅 25°）
  const arcOuterR  = innerRadius * 0.97;
  const arcInnerR  = arcOuterR - stampSize * 0.04;
  const arcUpStart = degToRad(-155);
  const arcUpEnd   = degToRad(-25);
  const arcDnStart = degToRad(25);
  const arcDnEnd   = degToRad(155);

  // 上段外弧
  ctx.lineWidth = Math.max(1.5, stampSize * 0.018);
  ctx.beginPath();
  ctx.arc(cx, cy, arcOuterR, arcUpStart, arcUpEnd);
  ctx.stroke();

  // 下段外弧
  ctx.beginPath();
  ctx.arc(cx, cy, arcOuterR, arcDnStart, arcDnEnd);
  ctx.stroke();

  // 上段内弧
  ctx.lineWidth = Math.max(1, stampSize * 0.011);
  ctx.beginPath();
  ctx.arc(cx, cy, arcInnerR, arcUpStart, arcUpEnd);
  ctx.stroke();

  // 下段内弧
  ctx.beginPath();
  ctx.arc(cx, cy, arcInnerR, arcDnStart, arcDnEnd);
  ctx.stroke();

  // ⑤ 地点大字居中
  const mainFontSize = Math.min(stampSize * 0.185, locationFontSize * 1.65);
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font      = `bold ${mainFontSize}px ${locationFont}`;
  ctx.fillStyle = color;
  ctx.fillText(location, cx, cy);

  // ⑥ 日期在环形带下半部分，沿下弧排列
  drawArcText(
    ctx, date, cx, cy, starTrackR, false,
    `${dateFontSize}px ${dateFontFamily}`, color,
  );

  applyWornEffect(ctx, cx, cy, outerRadius, opts.wornEffect);
}

/**
 * approval：审批章（横幅穿透双圆，双圆断开）
 *
 * 精确结构：
 *   ① 外圆（粗）+ 内圆（细）在横幅位置断开，断开处留明显缝隙
 *   ② 上方环形带：3颗五角星沿上弧排列
 *   ③ 中间：圆角矩形横幅（水平，不倾斜），宽度超出外圆，左右边缘可见
 *   ④ 下方环形带：日期沿下弧排列（字朝下）
 *
 * 关键约束：bannerHalfH + arcGap 必须 < innerRadius，否则 Math.asin 越界返回 NaN
 */
function drawApproval(ctx, opts) {
  const { location, date, color, stampSize, locationFont, locationFontSize, dateFontFamily, dateFontSize } = opts;
  const cx = stampSize / 2;
  const cy = stampSize / 2;

  // 圆的参数
  const outerRadius = stampSize / 2 - stampSize * 0.05;
  const ringW       = stampSize * 0.20;
  const innerRadius = outerRadius - ringW;
  // innerRadius ≈ 0.45S - 0.20S = 0.25S

  // 横幅参数（不倾斜，水平）
  // bannerH 的一半必须 < innerRadius 才能让内圆正确断弧
  // 约束：bannerHalfH < innerRadius（0.25S）→ bannerH < 0.50S
  // 同时保证缝隙可见：bannerHalfH + arcGap < innerRadius
  // 取 bannerH = 0.22S → bannerHalfH = 0.11S，arcGap = 0.04S → dyTop = -0.15S < 0.25S ✅
  const bannerH     = stampSize * 0.3;
  const bannerW     = outerRadius * 2 * 1.04;  // 比外圆宽4%，在 canvas 内可见
  const bannerHalfH = bannerH / 2;             // 0.11S
  const arcGap      = stampSize * 0.06;        // 横幅边缘到弧线之间的空白
  // dyTop = -(0.11 + 0.04)S = -0.15S，绝对值 < innerRadius(0.25S) ✅
  // dyTop = -0.15S < outerRadius(0.45S) ✅

  const bannerCenterY = cy;
  const bannerLeft    = cx - bannerW / 2;
  const bannerTop     = bannerCenterY - bannerHalfH;
  const bannerBottom  = bannerCenterY + bannerHalfH;
  const cornerR       = bannerHalfH * 0.30;

  // 断弧的 Y 偏移（横幅边缘 + 缝隙）
  const dyTop    = -(bannerHalfH + arcGap);  // 负值（上方），绝对值必须 < innerRadius
  const dyBottom =  (bannerHalfH + arcGap);  // 正值（下方）

  const outerTopAngle    = Math.asin(dyTop    / outerRadius);
  const outerBottomAngle = Math.asin(dyBottom / outerRadius);
  const innerTopAngle    = Math.asin(dyTop    / innerRadius);
  const innerBottomAngle = Math.asin(dyBottom / innerRadius);

  ctx.strokeStyle = color;
  ctx.fillStyle   = color;

  // ① 外圆上段弧（逆时针从右上交点经顶部到左上交点）
  ctx.lineWidth = Math.max(2, stampSize * 0.024);
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, outerTopAngle, Math.PI - outerTopAngle, true);
  ctx.stroke();

  // ① 外圆下段弧（逆时针从左下交点经底部到右下交点）
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, Math.PI - outerBottomAngle, outerBottomAngle, true);
  ctx.stroke();

  // ① 内圆上段弧
  ctx.lineWidth = Math.max(1, stampSize * 0.013);
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, innerTopAngle, Math.PI - innerTopAngle, true);
  ctx.stroke();

  // ① 内圆下段弧
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, Math.PI - innerBottomAngle, innerBottomAngle, true);
  ctx.stroke();

  // ② 上方3颗五角星：在环形带上半圆，正上方1颗，左右各1颗
  const starTrackR = (outerRadius + innerRadius) / 2;
  const starSize   = Math.max(3.5, ringW * 0.26);
  const starAngles = [-Math.PI / 2, -Math.PI / 2 - Math.PI * 0.16, -Math.PI / 2 + Math.PI * 0.16];
  starAngles.forEach((angle) => {
    drawStar(ctx, cx + starTrackR * Math.cos(angle), cy + starTrackR * Math.sin(angle), starSize, color);
  });

  // ③ 圆角矩形横幅（水平，不倾斜）
  ctx.lineWidth = Math.max(1.5, stampSize * 0.014);
  ctx.beginPath();
  ctx.moveTo(bannerLeft + cornerR, bannerTop);
  ctx.lineTo(bannerLeft + bannerW - cornerR, bannerTop);
  ctx.quadraticCurveTo(bannerLeft + bannerW, bannerTop, bannerLeft + bannerW, bannerTop + cornerR);
  ctx.lineTo(bannerLeft + bannerW, bannerBottom - cornerR);
  ctx.quadraticCurveTo(bannerLeft + bannerW, bannerBottom, bannerLeft + bannerW - cornerR, bannerBottom);
  ctx.lineTo(bannerLeft + cornerR, bannerBottom);
  ctx.quadraticCurveTo(bannerLeft, bannerBottom, bannerLeft, bannerBottom - cornerR);
  ctx.lineTo(bannerLeft, bannerTop + cornerR);
  ctx.quadraticCurveTo(bannerLeft, bannerTop, bannerLeft + cornerR, bannerTop);
  ctx.closePath();
  ctx.stroke();

  // 横幅内地点粗体大字
  const bannerFontSize = Math.min(bannerH * 0.55, locationFontSize * 1.6);
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font      = `bold ${bannerFontSize}px ${locationFont}`;
  ctx.fillStyle = color;
  ctx.fillText(location, cx, bannerCenterY);

  // ④ 下方日期：在环形带下半圆沿弧排列（isTop=false，字朝下）
  drawArcText(
    ctx, date, cx, cy, starTrackR, false,
    `${dateFontSize}px ${dateFontFamily}`, color,
  );

  applyWornEffect(ctx, cx, cy, outerRadius, opts.wornEffect);
}

/** 绘制五角星辅助函数 */
function drawStar(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI / 2) + (i * Math.PI * 2) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = cx + size * Math.cos(outerAngle);
    const oy = cy - size * Math.sin(outerAngle);
    const ix = cx + (size * 0.4) * Math.cos(innerAngle);
    const iy = cy - (size * 0.4) * Math.sin(innerAngle);
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * postal：中国邮政日戳
 *
 * 结构：
 *   ① 单圆粗边框
 *   ② 上半圆弧形：地点大字，沿上弧排列
 *   ③ 圆圈中间：日期，水平居中显示
 *   ④ 下半圆弧形：副标题/单位名，沿下弧排列
 */
function drawPostal(ctx, opts) {
  const {
    location, date, color, stampSize,
    locationFont, locationFontSize,
    dateFontFamily, dateFontSize,
    subtitle = '',
  } = opts;

  const cx = stampSize / 2;
  const cy = stampSize / 2;
  const radius = stampSize / 2 - stampSize * 0.06;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  // ① 单圆粗边框
  ctx.lineWidth = Math.max(3, stampSize * 0.038);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 弧形文字弧半径：贴近圆内侧，arcRadius = radius * 0.88
  // 文字中心在此处，字体向圆心延伸，不超出圆边
  const arcRadius = radius * 0.76;

  // 固定字间距角度：3°（紧凑但不拥挤）
  // 字号由「目标弧长 / 字数」决定：字数多则字小，字数少则字大
  // 目标弧长 = 总字宽 + 总字间距 → 反推字号
  // 设固定字间距 = SPACING_DEG 度，则：
  //   fontSize × n + (n-1) × SPACING_RAD × arcRadius = arcRadius × SPAN_RAD
  //   fontSize = (arcRadius × SPAN_RAD - (n-1) × SPACING_RAD × arcRadius) / n
  const SPACING_DEG = 4;
  const TOP_SPACING_DEG = 15; 
  const SPACING_RAD = degToRad(SPACING_DEG);
  const SPAN_RAD = degToRad(150);

  function calcArcFontSize(text, minSize, maxSize, spacingDeg = SPACING_DEG) {
    const n = text.length;
    if (n === 0) return { fontSize: minSize, spacingDeg: spacingDeg };
    const charTotalArcLen = arcRadius * SPAN_RAD - (n - 1) * SPACING_RAD * arcRadius;
    const fontSize = Math.min(maxSize, Math.max(minSize, charTotalArcLen / n));
    return { fontSize, spacingDeg: spacingDeg };
  }

  // ② 上弧地点（bold）：字号范围 [radius*0.13, radius*0.30]
  const locParams = calcArcFontSize(location, radius * 0.14, radius * 0.38, TOP_SPACING_DEG);
  drawArcText(
    ctx, location, cx, cy, arcRadius, true,
    `bold ${locParams.fontSize}px ${locationFont}`, color,
    locParams.spacingDeg,
  );

  // ③ 日期水平居中，位于圆心
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  const actualDateFontSize = Math.max(dateFontSize, radius * 0.25);
  ctx.font = `${actualDateFontSize}px ${dateFontFamily}`;
  ctx.fillText(date, cx, cy);

  // ④ 下弧单位名：字号范围 [radius*0.12, radius*0.22]
  //    minSize 提高到 0.12 确保多字时仍然清晰可见
  if (subtitle) {
    const subParams = calcArcFontSize(subtitle, radius * 0.22, radius * 0.24);
    drawArcText(
      ctx, subtitle, cx, cy, arcRadius, false,
      `${subParams.fontSize}px ${locationFont}`, color,
      subParams.spacingDeg,
    );
  }

  applyWornEffect(ctx, cx, cy, radius, opts.wornEffect);
}

// ─── 汇总导出 ─────────────────────────────────────────────────────────────────

const STAMP_DRAWERS = {
  classic: drawClassic,
  arc: drawArc,
  vintage: drawVintage,
  approval: drawApproval,
  arcStamp: drawArcStamp,
  postal: drawPostal,
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
