import React, { useRef, useCallback, useState } from 'react';
import { Dropdown } from 'antd';
import {
  VerticalAlignTopOutlined, ArrowUpOutlined, ArrowDownOutlined,
  VerticalAlignBottomOutlined, DeleteOutlined, CloseOutlined, SwapOutlined,
} from '@ant-design/icons';
import { buildTextShadow, buildWebkitStroke } from '../../utils/styleHelpers';
import { computeSnapAndGuideLines } from '../../utils/snapHelpers';
import { useLocale } from '../../i18n';
import './index.less';

const RESIZE_HANDLE_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const HANDLE_POSITIONS = {
  n:  { top: -5, left: '50%', transform: 'translateX(-50%)' },
  ne: { top: -5, right: -5 },
  e:  { top: '50%', right: -5, transform: 'translateY(-50%)' },
  se: { bottom: -5, right: -5 },
  s:  { bottom: -5, left: '50%', transform: 'translateX(-50%)' },
  sw: { bottom: -5, left: -5 },
  w:  { top: '50%', left: -5, transform: 'translateY(-50%)' },
  nw: { top: -5, left: -5 },
};

// cursor 方向列表（顺序对应 0°/45°/90°/135°/180°/225°/270°/315°）
const CURSOR_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

/**
 * 根据元素旋转角度，计算 handle 对应的 cursor 方向
 * 将旋转角度折算成最近的 45° 步进，偏移 cursor 方向索引
 */
const getRotatedCursor = (baseDir, rotateDeg) => {
  const baseIndex = CURSOR_DIRECTIONS.indexOf(baseDir);
  if (baseIndex === -1) return 'default';
  const steps = Math.round(((rotateDeg % 360) + 360) / 45) % 8;
  const rotatedIndex = (baseIndex + steps) % 8;
  return `${CURSOR_DIRECTIONS[rotatedIndex]}-resize`;
};


const DraggableElement = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onZIndexChange,
  onDelete,
  onReplaceImage,
  canvasRef,
  otherElements,
  onDragGuideLines,
}) => {
  const elementRef = useRef(null);
  const textareaRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleMouseDown = useCallback((event) => {
    if (event.target.classList.contains('resize-handle')) return;
    event.stopPropagation();
    onSelect(element.id);

    const startX = event.clientX - element.x;
    const startY = event.clientY - element.y;

    const onMouseMove = (moveEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const rawX = moveEvent.clientX - startX;
      const rawY = moveEvent.clientY - startY;
      const clampedX = Math.max(0, Math.min(rawX, rect.width - element.width));
      const clampedY = Math.max(0, Math.min(rawY, rect.height - element.height));

      // 计算吸附和标线
      const { snappedX, snappedY, lines } = computeSnapAndGuideLines(
        { x: clampedX, y: clampedY, width: element.width, height: element.height },
        otherElements || [],
        { width: rect.width, height: rect.height }
      );

      onDragGuideLines && onDragGuideLines(lines);
      onUpdate(element.id, { x: snappedX, y: snappedY });
    };

    const onMouseUp = () => {
      onDragGuideLines && onDragGuideLines([]);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [element, onSelect, onUpdate, canvasRef, otherElements, onDragGuideLines]);

  const handleTouchStart = useCallback((event) => {
    if (event.target.classList.contains('resize-handle')) return;
    event.stopPropagation();
    onSelect(element.id);
    const touch = event.touches[0];
    const startX = touch.clientX - element.x;
    const startY = touch.clientY - element.y;

    const onTouchMove = (moveEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const t = moveEvent.touches[0];
      const rawX = t.clientX - startX;
      const rawY = t.clientY - startY;
      const clampedX = Math.max(0, Math.min(rawX, rect.width - element.width));
      const clampedY = Math.max(0, Math.min(rawY, rect.height - element.height));

      const { snappedX, snappedY, lines } = computeSnapAndGuideLines(
        { x: clampedX, y: clampedY, width: element.width, height: element.height },
        otherElements || [],
        { width: rect.width, height: rect.height }
      );

      onDragGuideLines && onDragGuideLines(lines);
      onUpdate(element.id, { x: snappedX, y: snappedY });
    };

    const onTouchEnd = () => {
      onDragGuideLines && onDragGuideLines([]);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, [element, onSelect, onUpdate, canvasRef, otherElements, onDragGuideLines]);

  const applyResizeDelta = useCallback((clientX, clientY, startX, startY, startWidth, startHeight, startElX, startElY, direction) => {
    const rotateRad = ((element.rotate ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rotateRad);
    const sin = Math.sin(rotateRad);

    // 将屏幕坐标的 delta 反向旋转到元素本地坐标系
    const screenDx = clientX - startX;
    const screenDy = clientY - startY;
    const localDx = screenDx * cos + screenDy * sin;
    const localDy = -screenDx * sin + screenDy * cos;

    // 在本地坐标系计算新宽高
    let newWidth = startWidth;
    let newHeight = startHeight;

    // 本地坐标系中，中心点相对于初始中心点的偏移（用于修正位置）
    let localCenterDx = 0;
    let localCenterDy = 0;

    // 翻转后 handle 的视觉位置与 direction 字符串的映射关系互换：
    // flipX: 视觉右侧 handle 实为 'w'，视觉左侧 handle 实为 'e'，需对调 e/w
    // flipY: 视觉下方 handle 实为 'n'，视觉上方 handle 实为 's'，需对调 n/s
    const effectiveDir = direction
      .replace(/e/g, element.flipX ? '__W__' : 'e')
      .replace(/w/g, element.flipX ? 'e' : 'w')
      .replace(/__W__/g, 'w')
      .replace(/n/g, element.flipY ? '__S__' : 'n')
      .replace(/s/g, element.flipY ? 'n' : 's')
      .replace(/__S__/g, 's');

    if (effectiveDir.includes('e')) {
      newWidth = Math.max(40, startWidth + localDx);
      localCenterDx += (newWidth - startWidth) / 2;
    }
    if (effectiveDir.includes('s')) {
      newHeight = Math.max(30, startHeight + localDy);
      localCenterDy += (newHeight - startHeight) / 2;
    }
    if (effectiveDir.includes('w')) {
      newWidth = Math.max(40, startWidth - localDx);
      localCenterDx -= (newWidth - startWidth) / 2;
    }
    if (effectiveDir.includes('n')) {
      newHeight = Math.max(30, startHeight - localDy);
      localCenterDy -= (newHeight - startHeight) / 2;
    }

    // 初始中心点（屏幕坐标）
    const startCenterX = startElX + startWidth / 2;
    const startCenterY = startElY + startHeight / 2;

    // 将本地坐标系的中心偏移转回屏幕坐标系
    const screenCenterDx = localCenterDx * cos - localCenterDy * sin;
    const screenCenterDy = localCenterDx * sin + localCenterDy * cos;

    // 新中心点（屏幕坐标）
    const newCenterX = startCenterX + screenCenterDx;
    const newCenterY = startCenterY + screenCenterDy;

    // 由新中心点和新宽高反推新左上角坐标
    const newX = newCenterX - newWidth / 2;
    const newY = newCenterY - newHeight / 2;

    const canvas = canvasRef.current;
    let clampedX = newX;
    let clampedY = newY;
    let clampedWidth = newWidth;
    let clampedHeight = newHeight;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();

      const { lines } = computeSnapAndGuideLines(
        { x: newX, y: newY, width: newWidth, height: newHeight },
        otherElements || [],
        { width: rect.width, height: rect.height }
      );
      onDragGuideLines && onDragGuideLines(lines);

      // 限制元素不超出画布边界：至少保留 20px 宽/高在画布内
      const MIN_VISIBLE = 20;
      clampedWidth = Math.max(40, Math.min(newWidth, rect.width));
      clampedHeight = Math.max(30, Math.min(newHeight, rect.height));
      clampedX = Math.max(-(clampedWidth - MIN_VISIBLE), Math.min(newX, rect.width - MIN_VISIBLE));
      clampedY = Math.max(-(clampedHeight - MIN_VISIBLE), Math.min(newY, rect.height - MIN_VISIBLE));
    }

    onUpdate(element.id, { width: clampedWidth, height: clampedHeight, x: clampedX, y: clampedY });
  }, [element, onUpdate, canvasRef, otherElements, onDragGuideLines]);

  const handleResizeMouseDown = useCallback((event, direction) => {
    event.stopPropagation();
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startElX = element.x;
    const startElY = element.y;

    const onMouseMove = (moveEvent) => {
      applyResizeDelta(moveEvent.clientX, moveEvent.clientY, startX, startY, startWidth, startHeight, startElX, startElY, direction);
    };

    const onMouseUp = () => {
      onDragGuideLines && onDragGuideLines([]);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [element, applyResizeDelta, onDragGuideLines]);

  const handleResizeTouchStart = useCallback((event, direction) => {
    event.stopPropagation();
    event.preventDefault();
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startElX = element.x;
    const startElY = element.y;

    const onTouchMove = (moveEvent) => {
      moveEvent.preventDefault();
      const t = moveEvent.touches[0];
      applyResizeDelta(t.clientX, t.clientY, startX, startY, startWidth, startHeight, startElX, startElY, direction);
    };

    const onTouchEnd = () => {
      onDragGuideLines && onDragGuideLines([]);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, [element, applyResizeDelta, onDragGuideLines]);

  // 动态值（位置/尺寸/层级/圆角/旋转翻转）必须保留内联
  const rotateTransform = element.rotate ? `rotate(${element.rotate}deg)` : '';
  const flipTransform = [
    element.flipX ? 'scaleX(-1)' : '',
    element.flipY ? 'scaleY(-1)' : '',
  ].filter(Boolean).join(' ');
  const combinedTransform = [rotateTransform, flipTransform].filter(Boolean).join(' ') || undefined;

  const elementStyle = {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    outline: isSelected ? '2px solid #4f9eff' : '2px solid transparent',
    zIndex: element.zIndex || 1,
    borderRadius: element.type === 'image' && element.borderRadius ? `${element.borderRadius}px` : undefined,
    overflow: element.type === 'image' && element.borderRadius ? 'hidden' : undefined,
    transform: combinedTransform,
  };

  const { t } = useLocale();

  const contextMenuItems = [
    { key: 'zindex-label', label: t('element.zindexLabel'), type: 'group' },
    { key: 'top',    label: t('element.toTop'),    icon: <VerticalAlignTopOutlined /> },
    { key: 'up',     label: t('element.up'),        icon: <ArrowUpOutlined /> },
    { key: 'down',   label: t('element.down'),      icon: <ArrowDownOutlined /> },
    { key: 'bottom', label: t('element.toBottom'),  icon: <VerticalAlignBottomOutlined /> },
    { type: 'divider' },
    ...(element.type === 'image' ? [
      { key: 'replace-image', label: t('element.replaceImage'), icon: <SwapOutlined /> },
      { type: 'divider' },
    ] : []),
    { key: 'delete', label: t('element.delete'),    icon: <DeleteOutlined />, danger: true },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'delete') {
      onDelete && onDelete(element.id);
    } else if (key === 'replace-image') {
      onReplaceImage && onReplaceImage(element.id);
    } else {
      onZIndexChange && onZIndexChange(element.id, key);
    }
  };

  // 进入内联编辑模式
  const handleDoubleClick = useCallback((event) => {
    if (element.type !== 'text') return;
    event.stopPropagation();
    setIsEditing(true);
    // 等 textarea 渲染后聚焦并选中全部
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  }, [element.type]);

  // 退出编辑模式，保存内容
  const handleEditBlur = useCallback((event) => {
    setIsEditing(false);
    const newContent = event.target.value;
    if (newContent !== element.textProps.content) {
      onUpdate(element.id, { textProps: { ...element.textProps, content: newContent } });
    }
  }, [element, onUpdate]);

  // 按 Escape 退出编辑（不保存），按 Ctrl+Enter 保存退出
  const handleEditKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setIsEditing(false);
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      textareaRef.current?.blur();
    }
    event.stopPropagation();
  }, []);

  return (
    <Dropdown
      menu={{ items: contextMenuItems, onClick: handleMenuClick }}
      trigger={['contextMenu']}
    >
      <div
        ref={elementRef}
        className="draggable-element"
        style={elementStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
      >
        {element.type === 'image' && (
          <img
            src={element.url}
            alt="element"
            className="draggable-element__image"
            style={{
              borderRadius: element.borderRadius ? `${element.borderRadius}px` : 0,
              objectFit: element.objectFit ?? 'cover',
            }}
            draggable={false}
          />
        )}

        {element.type === 'text' && !isEditing && (
          <div
            className="draggable-element__text"
            style={{
              fontFamily: element.textProps.fontFamily,
              fontSize: element.textProps.fontSize,
              fontWeight: element.textProps.fontWeight,
              fontStyle: element.textProps.fontStyle,
              letterSpacing: element.textProps.letterSpacing ? `${element.textProps.letterSpacing}px` : undefined,
              textShadow: buildTextShadow(element.textProps),
              color: element.textProps.color,
              ...buildWebkitStroke(element.textProps),
            }}
          >
            {element.textProps.content}
          </div>
        )}

        {/* 内联编辑 textarea（所见即所得：继承文字组件的字体样式） */}
        {element.type === 'text' && isEditing && (
          <textarea
            ref={textareaRef}
            className="draggable-element__editor"
            defaultValue={element.textProps.content}
            onBlur={handleEditBlur}
            onKeyDown={handleEditKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              fontFamily: element.textProps.fontFamily,
              fontSize: element.textProps.fontSize,
              fontWeight: element.textProps.fontWeight,
              fontStyle: element.textProps.fontStyle,
              letterSpacing: element.textProps.letterSpacing ? `${element.textProps.letterSpacing}px` : undefined,
              color: element.textProps.color,
              textShadow: buildTextShadow(element.textProps),
              ...buildWebkitStroke(element.textProps),
            }}
          />
        )}

        {/* 文字组件选中时右上角删除按钮 */}
        {element.type === 'text' && isSelected && !isEditing && (
          <button
            className="draggable-element__delete-btn"
            onMouseDown={(e) => { e.stopPropagation(); onDelete && onDelete(element.id); }}
            title={t('element.deleteTitle')}
          >
            <CloseOutlined />
          </button>
        )}

        {/* 旋转吸附辅助线：拖动 Slider 且吸附到特定角度时才显示 */}
        {element.type === 'image' && isSelected && element._showRotateGuide && (() => {
          const SNAP_ANGLES = [-180, -90, 0, 90, 180];
          const rotate = element.rotate ?? 0;
          const isSnapped = SNAP_ANGLES.includes(rotate);
          if (!isSnapped) return null;
          const isHorizontal = rotate === 0 || rotate === 180 || rotate === -180;
          return (
            <div
              className="rotate-snap-guide"
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 9999,
                ...(isHorizontal
                  ? { left: '-20%', right: '-20%', top: '50%', height: 1, transform: 'translateY(-50%)' }
                  : { top: '-20%', bottom: '-20%', left: '50%', width: 1, transform: 'translateX(-50%)' }
                ),
                background: 'rgba(0, 122, 255, 0.6)',
                boxShadow: '0 0 4px rgba(0, 122, 255, 0.4)',
              }}
            />
          );
        })()}

        {isSelected && RESIZE_HANDLE_DIRECTIONS.map((dir) => (
          <div
            key={dir}
            className="resize-handle"
            onMouseDown={(event) => handleResizeMouseDown(event, dir)}
            onTouchStart={(event) => handleResizeTouchStart(event, dir)}
            style={{
              ...HANDLE_POSITIONS[dir],
              cursor: getRotatedCursor(dir, element.rotate ?? 0),
            }}
          />
        ))}
      </div>
    </Dropdown>
  );
};

export default DraggableElement;
