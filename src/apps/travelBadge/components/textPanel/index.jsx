import React, { useState } from 'react';
import { Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { FONT_TEMPLATES } from '../../utils/constants';
import { useLocale } from '../../i18n';
import './index.less';

/**
 * 字体模板卡片（系统模板和自定义模板共用）
 * 自定义模板：
 *   - hover 显示「编辑」按钮，点击跳转到属性面板进入更新模式
 *   - hover 显示「删除」按钮
 */
const FontTemplateCard = ({ fontTemplate, isCustom, theme, onApply, onDelete, onEditFontTemplate }) => {
  const { t } = useLocale();
  const { textProps } = fontTemplate;

  const previewStyle = {
    fontFamily: textProps.fontFamily,
    fontSize: Math.min(textProps.fontSize, 20),
    fontWeight: textProps.fontWeight,
    fontStyle: textProps.fontStyle,
    letterSpacing: textProps.letterSpacing ? `${Math.min(textProps.letterSpacing, 4)}px` : undefined,
    color: textProps.useGradient ? 'transparent' : textProps.color,
    background: textProps.useGradient
      ? `linear-gradient(${textProps.gradientAngle}deg, ${textProps.gradientFrom}, ${textProps.gradientTo})`
      : undefined,
    WebkitBackgroundClip: textProps.useGradient ? 'text' : undefined,
    WebkitTextFillColor: textProps.useGradient ? 'transparent' : undefined,
    textShadow: textProps.shadowBlur
      ? `${textProps.shadowOffsetX}px ${textProps.shadowOffsetY}px ${textProps.shadowBlur}px ${textProps.shadowColor}`
      : undefined,
    WebkitTextStroke: textProps.strokeWidth
      ? `${textProps.strokeWidth}px ${textProps.strokeColor}`
      : undefined,
  };

  return (
    <div
      className="font-template-card"
      onClick={() => onApply(fontTemplate)}
      style={{ background: theme.bgTertiary }}
    >
      <div className="font-template-card__preview" style={{ background: theme.bgPrimary }}>
        <span style={previewStyle}>Aa</span>
      </div>
      <div className="font-template-card__info">
        <div className="font-template-card__name" style={{ color: theme.textPrimary }}>
          <span>{fontTemplate.label}</span>
          {isCustom && (
            <span className="font-template-card__custom-badge">{t('template.custom')}</span>
          )}
        </div>
        <div className="font-template-card__desc" style={{ color: theme.textMuted }}>{fontTemplate.desc}</div>
        {isCustom && fontTemplate.createdAt && (
          <div className="font-template-card__created-at" style={{ color: theme.textSecondary }}>
            {fontTemplate.createdAt}
          </div>
        )}
      </div>

      {/* 编辑按钮（hover 显示，仅自定义） */}
      {isCustom && (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => { e.stopPropagation(); onEditFontTemplate(fontTemplate); }}
          title={t('fontTemplate.editTitle')}
          className="font-template-card__edit-btn"
        />
      )}

      {/* 删除按钮（hover 显示，仅自定义） */}
      {isCustom && onDelete && (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={(e) => { e.stopPropagation(); onDelete(fontTemplate.id); }}
          title={t('template.deleteTitle')}
          className="font-template-card__delete-btn"
        />
      )}
    </div>
  );
};
/**
 * 文字面板
 */
const TextPanel = ({
  theme,
  addTextElement,
  customFontTemplates,
  onApplyFontTemplate,
  deleteCustomFontTemplate,
  onEditFontTemplate,
}) => {
  const { t } = useLocale();
  return (
    <div className="text-panel">
      <div className="text-panel__title" style={{ color: theme.textPrimary }}>{t('text.title')}</div>
      <Button
        block
        type="primary"
        onClick={addTextElement}
        icon={<EditOutlined />}
        className="text-panel__add-btn"
      >
        {t('text.addBtn')}
      </Button>
      <div className="text-panel__hint" style={{ color: theme.textMuted }}>
        {t('text.hint')}
      </div>

      {/* 自定义字体模板区 */}
      {customFontTemplates?.length > 0 && (
        <>
          <div className="text-panel__section-title" style={{ color: theme.textMuted }}>
            {t('template.myTemplates')}
          </div>
          <div className="text-panel__font-grid">
            {customFontTemplates.map((fontTemplate) => (
              <FontTemplateCard
                key={fontTemplate.id}
                fontTemplate={fontTemplate}
                isCustom={true}
                theme={theme}
                onApply={onApplyFontTemplate}
                onDelete={deleteCustomFontTemplate}
                onEditFontTemplate={onEditFontTemplate}
              />
            ))}
          </div>
        </>
      )}

      {/* 系统字体模板区 */}
      <div className="text-panel__section-title" style={{ color: theme.textMuted }}>
        {t('template.systemTemplates')}
      </div>
      <div className="text-panel__font-hint" style={{ color: theme.textMuted }}>
        {t('template.fontTemplateHint')}
      </div>
      <div className="text-panel__font-grid">
        {FONT_TEMPLATES.map((fontTemplate) => (
          <FontTemplateCard
            key={fontTemplate.id}
            fontTemplate={fontTemplate}
            isCustom={false}
            theme={theme}
            onApply={onApplyFontTemplate}
            onDelete={null}
          />
        ))}
      </div>
    </div>
  );
};

export default TextPanel;
