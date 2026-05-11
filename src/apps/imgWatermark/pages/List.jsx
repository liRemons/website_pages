import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@components/Header';
import handleContent from '../handle.md';
import { Input, Slider, Tooltip, ColorPicker } from 'antd';
import Fixed from '@components/Fixed';
import style from './index.module.less';
import { ArrowDownOutlined, PictureOutlined } from '@ant-design/icons';

// 基于旋转矩阵的精准水印平铺算法
function drawWatermarks(ctx, canvasWidth, canvasHeight, text, fontSize, rotationDeg, color) {
  const rad = (rotationDeg * Math.PI) / 180;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px PingFang SC, Microsoft YaHei, sans-serif`;
  ctx.textBaseline = 'middle';

  const textWidth = ctx.measureText(text).width;
  const textHeight = fontSize;

  // 旋转后包围盒尺寸（含间距）
  const paddingX = textWidth * 0.6;
  const paddingY = textHeight * 2;
  const boundingW = Math.abs(textWidth * Math.cos(rad)) + Math.abs(textHeight * Math.sin(rad)) + paddingX;
  const boundingH = Math.abs(textWidth * Math.sin(rad)) + Math.abs(textHeight * Math.cos(rad)) + paddingY;

  const cols = Math.ceil(canvasWidth / boundingW) + 2;
  const rows = Math.ceil(canvasHeight / boundingH) + 2;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const centerX = col * boundingW + boundingW / 2;
      const centerY = row * boundingH + boundingH / 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rad);
      ctx.fillText(text, -textWidth / 2, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

function List() {
  const [imgSrc, setImgSrc] = useState('');
  const [fileName, setFileName] = useState('');
  const [watermarkText, setWatermarkText] = useState('');
  // color 存 css rgba 字符串，直接用于 canvas fillStyle
  const [color, setColor] = useState('rgba(0,0,0,0.15)');
  const [rotate, setRotate] = useState(30);
  const [fontSize, setFontSize] = useState(18);
  const [spacing, setSpacing] = useState(60);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const renderWatermark = useCallback(() => {
    const imgEl = imgRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !imgEl || !imgEl.naturalWidth) return;

    const naturalW = imgEl.naturalWidth;
    const naturalH = imgEl.naturalHeight;

    canvas.width = naturalW;
    canvas.height = naturalH;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, naturalW, naturalH);
    ctx.drawImage(imgEl, 0, 0, naturalW, naturalH);

    if (watermarkText.trim()) {
      const adjustedFontSize = fontSize + spacing * 0.3;
      drawWatermarks(ctx, naturalW, naturalH, watermarkText, adjustedFontSize, rotate, color);
    }
  }, [watermarkText, color, rotate, fontSize, spacing, imgSrc]);

  useEffect(() => {
    if (!imgSrc) return;
    const imgEl = imgRef.current;
    if (!imgEl) return;

    const onLoad = () => {
      setHasImage(true);
      renderWatermark();
    };

    if (imgEl.complete && imgEl.naturalWidth) {
      onLoad();
    } else {
      imgEl.addEventListener('load', onLoad);
      return () => imgEl.removeEventListener('load', onLoad);
    }
  }, [imgSrc]);

  useEffect(() => {
    if (hasImage) renderWatermark();
  }, [renderWatermark, hasImage]);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    setImgSrc(URL.createObjectURL(file));
    setHasImage(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `watermark_${fileName || 'image'}.png`;
    anchor.click();
  };

  // antd ColorPicker onChange 返回 { toRgbString() } 对象
  const handleColorChange = (colorValue) => {
    setColor(colorValue.toRgbString());
  };

  return (
    <div className={style.container}>
      <Header name="图片文字水印" leftPath={`/${APP_NAME}/tool`} handleContent={handleContent} />
      <Fixed />

      {/* img 用 display:none 隐藏，仅作 drawImage 数据源 */}
      <img ref={imgRef} src={imgSrc} alt="" style={{ display: 'none' }} />

      <div className={style.layout}>
        {/* ── 左侧控制面板 ── */}
        <aside className={style.sidebar}>
          <div className={style.panelScroll}>

            {/* 上传区域 */}
            <div
              className={`${style.uploadZone} ${isDragOver ? style.dragOver : ''} ${imgSrc ? style.uploadZoneWithImg : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              {imgSrc ? (
                <>
                  <img src={imgSrc} className={style.thumbImg} alt="缩略图" />
                  <div className={style.thumbOverlay}>
                    <PictureOutlined />
                    点击更换图片
                  </div>
                </>
              ) : (
                <>
                  <PictureOutlined className={style.uploadIcon} />
                  <span className={style.uploadText}>点击或拖拽图片到这里</span>
                </>
              )}
            </div>

            {/* 水印文字 */}
            <div className={style.fieldGroup}>
              <label className={style.fieldLabel}>水印文字</label>
              <Input
                placeholder="请输入水印文字"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
              />
            </div>

            {/* 旋转角度 */}
            <div className={style.fieldGroup}>
              <label className={style.fieldLabel}>
                旋转角度
                <span className={style.fieldValue}>{rotate}°</span>
              </label>
              <Slider value={rotate} min={0} max={360} onChange={setRotate} />
            </div>

            {/* 字体大小 */}
            <div className={style.fieldGroup}>
              <label className={style.fieldLabel}>
                字体大小
                <span className={style.fieldValue}>{fontSize}px</span>
              </label>
              <Slider value={fontSize} min={10} max={80} onChange={setFontSize} />
            </div>

            {/* 水印间距 */}
            <div className={style.fieldGroup}>
              <label className={style.fieldLabel}>
                水印间距
                <span className={style.fieldValue}>{spacing}</span>
              </label>
              <Slider value={spacing} min={0} max={200} onChange={setSpacing} />
            </div>

            {/* 水印颜色：antd ColorPicker 弹出模式，不撑开布局 */}
            <div className={style.fieldGroup}>
              <label className={style.fieldLabel}>水印颜色</label>
              <ColorPicker
                value={color}
                onChange={handleColorChange}
                showText
                format="rgb"
              />
            </div>
          </div>

          {/* 下载按钮固定底部 */}
          <div className={style.sidebarFooter}>
            <Tooltip title={!hasImage ? '请先上传图片' : ''}>
              <button
                className={style.downloadBtn}
                onClick={handleDownload}
                disabled={!hasImage}
              >
                <ArrowDownOutlined />
                下载处理后的图片
              </button>
            </Tooltip>
          </div>
        </aside>

        {/* ── 右侧预览区域 ── */}
        <main className={style.preview}>
          {!hasImage && (
            <div className={style.emptyTip}>
              <PictureOutlined className={style.emptyIcon} />
              <span>上传图片后，实时预览水印效果</span>
            </div>
          )}
          <div className={style.imageWrap} style={{ display: hasImage ? 'inline-block' : 'none' }}>
            <canvas ref={canvasRef} className={style.previewCanvas} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default List;

