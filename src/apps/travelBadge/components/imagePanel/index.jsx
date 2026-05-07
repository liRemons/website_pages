import React from 'react';
import { MOCK_IMAGES } from '../../utils/constants';
import { useLocale } from '../../i18n';
import './index.less';

/**
 * 图片面板
 */
const ImagePanel = ({ theme, fileInputRef, handleFileUpload, addImageElement }) => {
  const { t } = useLocale();
  return (
    <div className="image-panel">
      <div className="image-panel__title" style={{ color: theme.textPrimary }}>{t('image.title')}</div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="image-panel__upload-btn"
        style={{ color: theme.accent }}
      >
        {t('image.upload')}
      </button>

      <div className="image-panel__hint" style={{ color: theme.textSecondary }}>{t('image.orSelect')}</div>
      <div className="image-panel__grid">
        {MOCK_IMAGES.map((img) => (
          <div
            key={img.id}
            className="image-card"
            onClick={() => addImageElement(img.url)}
            style={{ borderColor: theme.border }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; }}
          >
            <img src={img.url} alt={img.label} className="image-card__img" />
            <div className="image-card__label" style={{ background: theme.bgTertiary, color: theme.textSecondary }}>
              {img.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagePanel;
