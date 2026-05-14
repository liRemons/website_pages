import React, { useState } from 'react';
import { Button, Popconfirm, Input, message } from 'antd';
import { EditOutlined, DeleteOutlined, SyncOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
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
  isAdmin,
  systemFontTemplates,
  onAddSystemFontTemplate,
  onUpdateSystemFontTemplate,
  onDeleteSystemFontTemplate,
  selectedElement,
}) => {
  const { t } = useLocale();
  const [isAdding, setIsAdding] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addDesc, setAddDesc] = useState('');

  // 新增系统字体模板：取当前选中文字元素的 textProps
  const handleAddConfirm = () => {
    if (!addLabel.trim()) {
      message.warning('请输入模板名称');
      return;
    }
    if (!selectedElement || selectedElement.type !== 'text') {
      message.warning('请先选中一个文字元素');
      return;
    }
    onAddSystemFontTemplate({
      label: addLabel.trim(),
      desc: addDesc.trim() || `${selectedElement.textProps?.fontFamily || ''} · ${selectedElement.textProps?.fontSize || ''}px`,
      textProps: { ...selectedElement.textProps },
    });
    setAddLabel('');
    setAddDesc('');
    setIsAdding(false);
  };

  // 同步当前文字样式到系统字体模板
  const handleSyncTextProps = (templateId) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      message.warning('请先选中一个文字元素');
      return;
    }
    const target = systemFontTemplates.find((t) => t.id === templateId);
    onUpdateSystemFontTemplate(templateId, {
      textProps: { ...selectedElement.textProps },
      desc: `${selectedElement.textProps?.fontFamily || ''} · ${selectedElement.textProps?.fontSize || ''}px`,
      label: target?.label,
    });
  };

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
        {isAdmin && (
          <button
            type="button"
            className="text-panel__add-sys-btn"
            style={{ color: isAdding ? theme.textMuted : theme.accent }}
            onClick={() => setIsAdding((v) => !v)}
          >
            {isAdding ? '取消' : '＋ 新增'}
          </button>
        )}
      </div>

      {/* 管理员新增表单 */}
      {isAdmin && isAdding && (
        <div className="text-panel__add-form" style={{ background: theme.bgTertiary, borderColor: theme.borderLight }}>
          <div className="text-panel__add-hint" style={{ color: theme.textMuted }}>
            将当前选中文字元素的样式保存为系统字体模板
          </div>
          <Input
            className="text-panel__add-input"
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            placeholder="模板名称"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddConfirm(); if (e.key === 'Escape') { setIsAdding(false); setAddLabel(''); setAddDesc(''); } }}
            autoFocus
          />
          <Input
            className="text-panel__add-input"
            style={{ marginTop: 6 }}
            value={addDesc}
            onChange={(e) => setAddDesc(e.target.value)}
            placeholder="描述（可选，默认自动生成）"
            onKeyDown={(e) => { if (e.key === 'Escape') { setIsAdding(false); setAddLabel(''); setAddDesc(''); } }}
          />
          <div className="text-panel__add-actions">
            <Button
              className="text-panel__add-confirm-btn"
              type="text"
              size="small"
              icon={<CheckOutlined />}
              style={{ color: theme.accent }}
              onClick={handleAddConfirm}
              disabled={!addLabel.trim()}
            >
              保存
            </Button>
            <Button
              className="text-panel__add-confirm-btn"
              type="text"
              size="small"
              icon={<CloseOutlined />}
              style={{ color: theme.textMuted }}
              onClick={() => { setIsAdding(false); setAddLabel(''); setAddDesc(''); }}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      <div className="text-panel__font-hint" style={{ color: theme.textMuted }}>
        {t('template.fontTemplateHint')}
      </div>
      <div className="text-panel__font-grid">
        {(systemFontTemplates || []).map((fontTemplate) => (
          <div key={fontTemplate.id} className="font-template-card-wrap">
            <FontTemplateCard
              fontTemplate={fontTemplate}
              isCustom={false}
              theme={theme}
              onApply={onApplyFontTemplate}
              onDelete={null}
              onEditFontTemplate={onEditFontTemplate}
            />
            {/* 管理员操作按钮 */}
            {isAdmin && (
              <div className="font-template-card__admin-actions" onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title="用当前文字样式覆盖此模板？"
                  onConfirm={() => handleSyncTextProps(fontTemplate.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" icon={<SyncOutlined />} size="small" title="同步当前样式" />
                </Popconfirm>
                <Popconfirm
                  title="确定删除此系统字体模板？"
                  onConfirm={() => onDeleteSystemFontTemplate(fontTemplate.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" icon={<DeleteOutlined />} size="small" danger title="删除" />
                </Popconfirm>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextPanel;
