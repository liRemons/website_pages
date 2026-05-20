/**
 * 吸附与对齐辅助线计算
 * 供 DraggableElement 在拖拽/缩放时使用
 */

const SNAP_THRESHOLD = 6;

/**
 * 计算元素拖拽/缩放时的吸附位置和对齐辅助线
 *
 * @param {{ x, y, width, height }} movingElement - 当前正在移动的元素
 * @param {Array} otherElements - 其他元素列表
 * @param {{ width, height }} canvas - 画布尺寸
 * @returns {{ snappedX, snappedY, lines }}
 */
export const computeSnapAndGuideLines = (movingElement, otherElements, canvas) => {
  const { x, y, width, height } = movingElement;

  const mLeft    = x;
  const mCenterX = x + width / 2;
  const mRight   = x + width;
  const mTop     = y;
  const mCenterY = y + height / 2;
  const mBottom  = y + height;

  let snappedX = x;
  let snappedY = y;
  const lines = [];

  // 参考线来源：画布边缘/中线 + 其他元素的边缘/中线
  const referenceXLines = [
    { pos: 0 },
    { pos: canvas.width / 2 },
    { pos: canvas.width },
  ];
  const referenceYLines = [
    { pos: 0 },
    { pos: canvas.height / 2 },
    { pos: canvas.height },
  ];

  otherElements.forEach((el) => {
    referenceXLines.push(
      { pos: el.x },
      { pos: el.x + el.width / 2 },
      { pos: el.x + el.width },
    );
    referenceYLines.push(
      { pos: el.y },
      { pos: el.y + el.height / 2 },
      { pos: el.y + el.height },
    );
  });

  // 检测 X 方向吸附（垂直标线）
  let bestDx = SNAP_THRESHOLD + 1;
  referenceXLines.forEach(({ pos }) => {
    [
      { movingPos: mLeft,    offset: 0 },
      { movingPos: mCenterX, offset: width / 2 },
      { movingPos: mRight,   offset: width },
    ].forEach(({ movingPos, offset }) => {
      const dx = Math.abs(movingPos - pos);
      if (dx < SNAP_THRESHOLD && dx < bestDx) {
        bestDx = dx;
        snappedX = pos - offset;
        lines.push({ type: 'v', pos });
      }
    });
  });

  // 检测 Y 方向吸附（水平标线）
  let bestDy = SNAP_THRESHOLD + 1;
  referenceYLines.forEach(({ pos }) => {
    [
      { movingPos: mTop,     offset: 0 },
      { movingPos: mCenterY, offset: height / 2 },
      { movingPos: mBottom,  offset: height },
    ].forEach(({ movingPos, offset }) => {
      const dy = Math.abs(movingPos - pos);
      if (dy < SNAP_THRESHOLD && dy < bestDy) {
        bestDy = dy;
        snappedY = pos - offset;
        lines.push({ type: 'h', pos });
      }
    });
  });

  // 去重
  const uniqueLines = lines.filter(
    (line, index, self) =>
      index === self.findIndex((l) => l.type === line.type && l.pos === line.pos)
  );

  return {
    snappedX,
    snappedY,
    lines: uniqueLines,
  };
};
