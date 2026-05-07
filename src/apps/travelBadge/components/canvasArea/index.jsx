import React, { useRef, useCallback } from 'react';
import { DownloadOutlined, LoadingOutlined, BgColorsOutlined } from '@ant-design/icons';
import { Button, ColorPicker } from 'antd';
import DraggableElement from '../draggableElement';
import { useLocale } from '../../i18n';
import './index.less';

/**
 * 标线层：渲染拖拽对齐时的参考线
 * lines: Array<{ type: 'v'|'h', pos: number }>
 *   v = 垂直线（x 坐标），h = 水平线（y 坐标）
 */
const GuideLineLayer = ({ lines }) => {
  if (!lines || lines.length === 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {lines.map((line, index) => (
        <div
          key={`${line.type}-${line.pos}-${index}`}
          style={
            line.type === 'v'
              ? {
                  position: 'absolute',
                  left: line.pos,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'rgba(0, 122, 255, 0.45)',
                  boxShadow: '0 0 3px rgba(0, 122, 255, 0.3)',
                }
              : {
                  position: 'absolute',
                  top: line.pos,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'rgba(0, 122, 255, 0.45)',
                  boxShadow: '0 0 3px rgba(0, 122, 255, 0.3)',
                }
          }
        />
      ))}
    </div>
  );
};

/**
 * 画布区域组件
 *
 * 顶部工具栏：左侧为主题切换胶囊（由父组件传入），右侧为颜色选择器 + 导出按钮组
 */
const CanvasArea = ({
  isMobile,
  theme,
  isExporting,
  handleExport,
  canvasRef,
  canvasWrapStyle,
  elements,
  selectedId,
  setSelectedId,
  selectElement,
  updateElement,
  changeZIndex,
  deleteElement,
  canvasBackground,
  setCanvasBackground,
  guideLines,
  onDragGuideLines,
  fileInputRef,
  onUploadImage,
}) => {
  const { t } = useLocale();

  // 隐藏的文件 input，专用于「更换图片」操作
  const replaceImageInputRef = useRef(null);
  const replacingElementIdRef = useRef(null);

  const handleReplaceImage = useCallback((elementId) => {
    replacingElementIdRef.current = elementId;
    replaceImageInputRef.current?.click();
  }, []);

  const handleReplaceImageFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (!file || !replacingElementIdRef.current) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateElement(replacingElementIdRef.current, { url: e.target.result });
      replacingElementIdRef.current = null;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }, [updateElement]);

  return (
    <div
      className={`canvas-area ${isMobile ? 'canvas-area--mobile' : 'canvas-area--desktop'}`}
      style={{ background: theme.bgPrimary }}
    >
      {/* PC 端顶部工具栏：左侧空白占位 + 右侧操作按钮组 */}
      {!isMobile && (
        <div className="canvas-area__toolbar">
          {/* 左侧：空占位（保持布局平衡） */}
          <div className="canvas-area__toolbar-left" />

          {/* 右侧：颜色选择器 + 导出按钮 */}
          <div className="canvas-area__toolbar-actions">
            <ColorPicker
              value={canvasBackground}
              onChange={(_, hex) => setCanvasBackground(hex)}
              size="small"
              trigger="click"
              placement="bottomRight"
            >
              <div className="canvas-area__color-trigger" title={t('toolbar.canvasBg')}>
                <BgColorsOutlined style={{ color: '#fff', fontSize: 14, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
              </div>
            </ColorPicker>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className={`export-btn export-btn--desktop ${isExporting ? 'export-btn--loading' : 'export-btn--active'}`}
            >
              {isExporting
                ? <><LoadingOutlined style={{ marginRight: 6 }} />{t('toolbar.exporting')}</>
                : <><DownloadOutlined style={{ marginRight: 6 }} />{t('toolbar.export')}</>
              }
            </Button>
          </div>
        </div>
      )}

      {/* 画布主体 */}
      <div
        ref={canvasRef}
        style={canvasWrapStyle}
        onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
      >
        {/* 空状态：点击可上传图片 */}
        {elements.length === 0 && (
          <div
            className="canvas-empty-state canvas-empty-state--clickable"
            onClick={onUploadImage}
            title={t('canvas.emptyText')}
          >
            <div className="canvas-empty-state__icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="10" width="36" height="28" rx="4" stroke="#D1D5DB" strokeWidth="2" fill="none" />
                <circle cx="16" cy="20" r="4" stroke="#D1D5DB" strokeWidth="2" fill="none" />
                <path d="M6 32 L16 22 L24 30 L32 22 L42 32" stroke="#D1D5DB" strokeWidth="2" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <div className="canvas-empty-state__text">{t('canvas.emptyText')}</div>
            <div className="canvas-empty-state__hint">{t('canvas.uploadHint')}</div>
          </div>
        )}

        {/* 更换图片专用隐藏 input */}
        <input
          ref={replaceImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleReplaceImageFileChange}
        />

        {/* 元素列表 */}
        {elements.map((element) => (
          <DraggableElement
            key={element.id}
            element={element}
            isSelected={selectedId === element.id}
            onSelect={selectElement}
            onUpdate={updateElement}
            onZIndexChange={changeZIndex}
            onDelete={deleteElement}
            onReplaceImage={handleReplaceImage}
            canvasRef={canvasRef}
            otherElements={elements.filter((el) => el.id !== element.id)}
            onDragGuideLines={onDragGuideLines}
          />
        ))}

        {/* 对齐标线层（拖拽时显示） */}
        <GuideLineLayer lines={guideLines} />
      </div>

      {/* PC 端底部操作提示 */}
      {!isMobile && (
        <div className="canvas-area__hint">
          {t('canvas.hint')}
        </div>
      )}
    </div>
  );
};

export default CanvasArea;
