import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button, Slider, Upload, Space, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import Fixed from '@components/Fixed';
import './app.css';

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function SimpleSketches() {
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const uploadInputRef = useRef(null);

  const [threshold, setThreshold] = useState(30);
  const [blurValue, setBlurValue] = useState(2);
  const [hasImage, setHasImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processImage = useCallback((currentThreshold, currentBlur) => {
    const originalImage = originalImageRef.current;
    const canvas = canvasRef.current;
    if (!originalImage || !canvas) return;

    const ctx = canvas.getContext('2d');
    setIsLoading(true);

    requestAnimationFrame(() => {
      const imageWidth = originalImage.width;
      const imageHeight = originalImage.height;

      canvas.width = imageWidth;
      canvas.height = imageHeight;

      // 第一步：绘制灰度 + 模糊预处理图（去噪，让线条更平滑）
      ctx.filter = `grayscale(100%) blur(${currentBlur}px)`;
      ctx.drawImage(originalImage, 0, 0, imageWidth, imageHeight);
      ctx.filter = 'none';

      const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
      const pixelData = imageData.data;

      const outputImageData = ctx.createImageData(imageWidth, imageHeight);
      const outputPixels = outputImageData.data;

      // 预计算灰度数组，提高性能
      // 人眼对绿色的敏感度最高，红色次之，蓝色最低
      const grayMap = new Uint8Array(imageWidth * imageHeight);
      for (let i = 0; i < pixelData.length; i += 4) {
        grayMap[i / 4] = 0.299 * pixelData[i] + 0.587 * pixelData[i + 1] + 0.114 * pixelData[i + 2];
      }

      // 第二步：梯度边缘检测，比较右侧和下侧像素的色差
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          const idx = y * imageWidth + x;
          const pixelIdx = idx * 4;

          const isNonBoundaryPixel = x < imageWidth - 1 && y < imageHeight - 1;
          if (isNonBoundaryPixel) {
            const diffRight = Math.abs(grayMap[idx] - grayMap[idx + 1]);
            const diffBottom = Math.abs(grayMap[idx] - grayMap[idx + imageWidth]);
            const isEdge = diffRight > currentThreshold || diffBottom > currentThreshold;

            // 边缘设为黑色（线条），非边缘设为白色（背景）
            const colorValue = isEdge ? 0 : 255;
            outputPixels[pixelIdx] = colorValue;
            outputPixels[pixelIdx + 1] = colorValue;
            outputPixels[pixelIdx + 2] = colorValue;
            outputPixels[pixelIdx + 3] = 255;
          } else {
            // 边界像素直接设为白色
            outputPixels[pixelIdx] = 255;
            outputPixels[pixelIdx + 1] = 255;
            outputPixels[pixelIdx + 2] = 255;
            outputPixels[pixelIdx + 3] = 255;
          }
        }
      }

      ctx.putImageData(outputImageData, 0, 0);
      setIsLoading(false);
    });
  }, []);

  // 防抖版本，避免拖动滑块时计算过于频繁
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedProcessImage = useCallback(
    debounce((nextThreshold, nextBlur) => processImage(nextThreshold, nextBlur), 100),
    [processImage]
  );

  // 监听参数变化，重新处理图片
  useEffect(() => {
    if (hasImage) {
      debouncedProcessImage(threshold, blurValue);
    }
  }, [threshold, blurValue]);

  // antd Upload 的 beforeUpload 返回 false 阻止自动上传，手动处理文件读取
  const handleBeforeUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setHasImage(true);
        processImage(threshold, blurValue);
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
    return false;
  }, [threshold, blurValue, processImage]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageRef.current) return;

    const link = document.createElement('a');
    link.download = 'sketch-output.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return (
    <div className="page-body">
      <header className="page-header">
        <h1 className="page-title">图片转白底简笔画</h1>
      </header>

      <div className="page-content">
        <div className="container">
          <div className="controls">
            <div className="control-group">
              <span className="control-label">上传图片</span>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleBeforeUpload}
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  选择图片
                </Button>
              </Upload>
            </div>

            <Divider type="vertical" style={{ height: 48, margin: '0 8px' }} />

            <div className="control-group">
              <span className="control-label">线条灵敏度（阈值）</span>
              <Slider
                className="control-slider"
                min={5}
                max={100}
                value={threshold}
                onChange={setThreshold}
              />
            </div>

            <div className="control-group">
              <span className="control-label">平滑度（模糊）</span>
              <Slider
                className="control-slider"
                min={0}
                max={10}
                step={1}
                value={blurValue}
                onChange={setBlurValue}
              />
            </div>

            <Divider type="vertical" style={{ height: 48, margin: '0 8px' }} />

            <div className="control-group">
              <span className="control-label">&nbsp;</span>
              <Button
                icon={<DownloadOutlined />}
                disabled={!hasImage}
                onClick={handleDownload}
              >
                下载简笔画
              </Button>
            </div>
          </div>

          <div className="canvas-container">
            {!hasImage && (
              <span className="placeholder-text">请上传图片以开始转换</span>
            )}
            {isLoading && (
              <div className="loading-text">处理中...</div>
            )}
            <canvas ref={canvasRef} className="result-canvas" />
          </div>
        </div>
      </div>
      <Fixed homeUrl="/tool" />
    </div>
  );
}
