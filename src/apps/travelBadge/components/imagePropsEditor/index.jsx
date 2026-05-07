import React from 'react';
import { Slider } from 'antd';
import { PropGroup, PropRow, SliderRow } from '../textPropsEditor';
import { useLocale } from '../../i18n';

const OBJECT_FIT_OPTIONS = [
  { value: 'cover',      labelKey: 'props.objectFitCover' },
  { value: 'contain',    labelKey: 'props.objectFitContain' },
  { value: 'fill',       labelKey: 'props.objectFitFill' },
  { value: 'scale-down', labelKey: 'props.objectFitScaleDown' },
  { value: 'none',       labelKey: 'props.objectFitNone' },
];

const SNAP_ANGLES = [-180, -90, 0, 90, 180];
const SNAP_THRESHOLD = 5;

/**
 * 图片元素属性编辑器
 * 包含：图片适应方式、圆角、旋转、翻转
 */
const ImagePropsEditor = ({ element, onUpdate, theme }) => {
  const { t } = useLocale();
  const currentFit = element.objectFit ?? 'cover';

  const handleRotateChange = (value) => {
    const snappedAngle = SNAP_ANGLES.find((angle) => Math.abs(value - angle) <= SNAP_THRESHOLD);
    const finalRotate = snappedAngle !== undefined ? snappedAngle : value;
    onUpdate(element.id, { rotate: finalRotate, _showRotateGuide: snappedAngle !== undefined });
  };

  return (
    <div className="text-props-editor">
      <PropGroup title={t('props.imageStyle')} theme={theme}>
        <div className="prop-group__field">
          <div className="prop-group__sublabel" style={{ color: theme.textSecondary }}>{t('props.objectFit')}</div>
          <div className="object-fit-selector">
            {OBJECT_FIT_OPTIONS.map((option) => {
              const isActive = currentFit === option.value;
              return (
                <button
                  key={option.value}
                  className={`object-fit-btn ${isActive ? 'object-fit-btn--active' : ''}`}
                  style={{ color: isActive ? theme.accent : theme.textSecondary }}
                  onClick={() => onUpdate(element.id, { objectFit: option.value })}
                >
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
        <SliderRow
          label={t('props.borderRadius')}
          value={element.borderRadius ?? 0}
          min={0} max={500}
          onChange={(value) => onUpdate(element.id, { borderRadius: value })}
          theme={theme}
        />
      </PropGroup>

      <PropGroup title={t('props.rotate')} theme={theme}>
        <div className="prop-slider-row">
          <div className="prop-slider-row__header">
            <span className="prop-row__label" style={{ color: theme.textSecondary }}>{t('props.rotate')}</span>
            <span className="prop-slider-row__value" style={{ color: theme.textMuted }}>
              {element.rotate ?? 0}°
            </span>
          </div>
          <Slider
            min={-180} max={180} step={1}
            value={element.rotate ?? 0}
            className="prop-slider"
            onChange={handleRotateChange}
            onChangeComplete={() => onUpdate(element.id, { _showRotateGuide: false })}
          />
        </div>
      </PropGroup>

      <PropGroup title={t('props.flip')} theme={theme}>
        <div className="flip-btn-group">
          <button
            className={`flip-btn ${element.flipX ? 'flip-btn--active' : ''}`}
            style={{ color: element.flipX ? theme.accent : theme.textSecondary }}
            onClick={() => onUpdate(element.id, { flipX: !element.flipX })}
          >
            ↔ {t('props.flipH')}
          </button>
          <button
            className={`flip-btn ${element.flipY ? 'flip-btn--active' : ''}`}
            style={{ color: element.flipY ? theme.accent : theme.textSecondary }}
            onClick={() => onUpdate(element.id, { flipY: !element.flipY })}
          >
            ↕ {t('props.flipV')}
          </button>
        </div>
      </PropGroup>
    </div>
  );
};

export default ImagePropsEditor;
