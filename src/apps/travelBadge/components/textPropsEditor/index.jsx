import React, { useState } from 'react';
import { Select, InputNumber, ConfigProvider, Slider, ColorPicker, Input } from 'antd';
import { FONT_FAMILIES } from '../../utils/constants';
import { makeSelectToken, makeInputNumberToken, makeInputToken } from '../../utils/styleHelpers';
import { useLocale } from '../../i18n';

const FONT_OPTIONS = FONT_FAMILIES.map(({ value, label }) => ({ value, label }));

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'props.fontWeightNormal' },
  { value: 'bold',   label: 'props.fontWeightBold' },
  { value: '100',    label: '100 Thin' },
  { value: '300',    label: '300 Light' },
  { value: '500',    label: '500 Medium' },
  { value: '700',    label: '700 Bold' },
  { value: '900',    label: '900 Black' },
];

const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'props.fontStyleNormal' },
  { value: 'italic', label: 'props.fontStyleItalic' },
];

// ─── 通用原子组件 ─────────────────────────────────────────────────────────────

/** 属性分组卡片 */
export const PropGroup = ({ title, children, theme }) => (
  <div className="prop-group" style={{ background: theme.bgTertiary, borderColor: theme.border }}>
    <div className="prop-group__title" style={{ color: theme.textMuted }}>{title}</div>
    <div className="prop-group__body">{children}</div>
  </div>
);

/** 单行属性行：左侧 label，右侧控件 */
export const PropRow = ({ label, value, children, theme }) => (
  <div className="prop-row">
    <span className="prop-row__label" style={{ color: theme.textSecondary }}>{label}</span>
    <div className="prop-row__control">
      {value !== undefined && (
        <span className="prop-row__value" style={{ color: theme.textMuted }}>{value}</span>
      )}
      {children}
    </div>
  </div>
);

/** 带数值显示的 Slider 行 */
export const SliderRow = ({ label, value, min, max, step = 1, onChange, unit = 'px', theme }) => (
  <div className="prop-slider-row">
    <div className="prop-slider-row__header">
      <span className="prop-row__label" style={{ color: theme.textSecondary }}>{label}</span>
      <span className="prop-slider-row__value" style={{ color: theme.textMuted }}>
        {value}{unit}
      </span>
    </div>
    <Slider min={min} max={max} step={step} value={value} onChange={onChange} className="prop-slider" />
  </div>
);

// 通用 Select 包装（支持主题）
const ThemedSelect = ({ value, onChange, options, optionRender, labelRender, theme = {}, ...rest }) => (
  <ConfigProvider theme={{ components: { Select: makeSelectToken(theme) } }}>
    <Select
      value={value}
      onChange={onChange}
      options={options}
      optionRender={optionRender}
      labelRender={labelRender}
      style={{ width: '100%' }}
      popupMatchSelectWidth={false}
      {...rest}
    />
  </ConfigProvider>
);

// 字体选择器（每个选项用对应字体渲染）
const FontSelect = ({ value, onChange, theme }) => (
  <ThemedSelect
    value={value}
    onChange={onChange}
    options={FONT_OPTIONS}
    theme={theme}
    optionRender={(option) => (
      <span style={{ fontFamily: option.value, fontSize: 14, color: theme.textPrimary }}>{option.label}</span>
    )}
    labelRender={(option) => (
      <span style={{ fontFamily: option.value, fontSize: 13 }}>{option.label}</span>
    )}
    filterOption={(input, option) =>
      option.value.toLowerCase().includes(input.toLowerCase())
    }
  />
);

// ─── 文字属性编辑区 ───────────────────────────────────────────────────────────

/**
 * 文字属性编辑器
 * 包含：文字内容、字体样式、颜色、描边、阴影、保存为字体模板
 */
const TextPropsEditor = ({ element, onUpdate, theme, fontTemplateProps }) => {
  const { t } = useLocale();
  const { textProps } = element;
  const [updateName, setUpdateName] = useState('');

  const {
    saveFontTemplateName,
    setSaveFontTemplateName,
    showFontSaveInput,
    setShowFontSaveInput,
    saveCurrentAsFontTemplate,
    updateFontTemplate,
    customFontTemplates,
    editingFontTemplate,
    setEditingFontTemplate,
  } = fontTemplateProps || {};

  // 进入更新模式时，初始化名称
  const prevEditingRef = React.useRef(null);
  if (editingFontTemplate && editingFontTemplate !== prevEditingRef.current) {
    prevEditingRef.current = editingFontTemplate;
    setUpdateName(editingFontTemplate.label);
  }

  const updateTextProp = (key, value) => {
    onUpdate(element.id, { textProps: { ...textProps, [key]: value } });
  };

  const fontWeightOptions = FONT_WEIGHT_OPTIONS.map((opt) =>
    opt.label.startsWith('props.') ? { ...opt, label: t(opt.label) } : opt
  );
  const fontStyleOptions = FONT_STYLE_OPTIONS.map((opt) =>
    opt.label.startsWith('props.') ? { ...opt, label: t(opt.label) } : opt
  );

  const handleSaveOrUpdate = () => {
    if (editingFontTemplate) {
      updateFontTemplate(editingFontTemplate.id, updateName || editingFontTemplate.label, element.textProps);
      setEditingFontTemplate(null);
      setShowFontSaveInput(false);
    } else {
      saveCurrentAsFontTemplate();
    }
  };

  return (
    <div className="text-props-editor">
      {/* 文字内容 */}
      <PropGroup title={t('props.content')} theme={theme}>
        <ConfigProvider theme={{ components: { Input: makeInputToken(theme) } }}>
          <Input.TextArea
            value={textProps.content}
            onChange={(e) => updateTextProp('content', e.target.value)}
            autoSize={{ minRows: 2, maxRows: 5 }}
            className="text-props__textarea"
          />
        </ConfigProvider>
      </PropGroup>

      {/* 字体样式 */}
      <PropGroup title={t('props.font')} theme={theme}>
        <div className="prop-group__field">
          <FontSelect value={textProps.fontFamily} onChange={(v) => updateTextProp('fontFamily', v)} theme={theme} />
        </div>
        <div className="prop-group__two-col">
          <div>
            <div className="prop-group__sublabel" style={{ color: theme.textSecondary }}>{t('props.fontSize')}</div>
            <ConfigProvider theme={{ components: { InputNumber: makeInputNumberToken(theme) } }}>
              <InputNumber
                min={8} max={200}
                value={textProps.fontSize}
                onChange={(v) => updateTextProp('fontSize', v)}
                className="text-props__input-number"
              />
            </ConfigProvider>
          </div>
          <div>
            <div className="prop-group__sublabel" style={{ color: theme.textSecondary }}>{t('props.fontWeight')}</div>
            <ThemedSelect
              value={textProps.fontWeight}
              onChange={(v) => updateTextProp('fontWeight', v)}
              options={fontWeightOptions}
              theme={theme}
            />
          </div>
        </div>
        <div className="prop-group__field">
          <div className="prop-group__sublabel" style={{ color: theme.textSecondary }}>{t('props.fontStyle')}</div>
          <ThemedSelect
            value={textProps.fontStyle}
            onChange={(v) => updateTextProp('fontStyle', v)}
            options={fontStyleOptions}
            theme={theme}
          />
        </div>
        <SliderRow
          label={t('props.letterSpacing')}
          value={textProps.letterSpacing ?? 0}
          min={-10} max={50}
          onChange={(v) => updateTextProp('letterSpacing', v)}
          theme={theme}
        />
      </PropGroup>

      {/* 颜色 */}
      <PropGroup title={t('props.color')} theme={theme}>
        <PropRow label={t('props.textColor')} theme={theme}>
          <ColorPicker
            value={textProps.color}
            onChange={(_, hex) => updateTextProp('color', hex)}
            size="small"
            showText
          />
        </PropRow>
      </PropGroup>

      {/* 描边 */}
      <PropGroup title={t('props.stroke')} theme={theme}>
        <PropRow label={t('props.strokeColor')} theme={theme}>
          <ColorPicker
            value={textProps.strokeColor}
            onChange={(_, hex) => updateTextProp('strokeColor', hex)}
            size="small"
            showText
          />
        </PropRow>
        <SliderRow
          label={t('props.strokeWidth')}
          value={textProps.strokeWidth}
          min={0} max={10}
          onChange={(v) => updateTextProp('strokeWidth', v)}
          theme={theme}
        />
      </PropGroup>

      {/* 阴影 */}
      <PropGroup title={t('props.shadow')} theme={theme}>
        <PropRow label={t('props.shadowColor')} theme={theme}>
          <ColorPicker
            value={textProps.shadowColor}
            onChange={(_, hex) => updateTextProp('shadowColor', hex)}
            size="small"
            showText
          />
        </PropRow>
        <SliderRow
          label={t('props.shadowBlur')}
          value={textProps.shadowBlur}
          min={0} max={30}
          onChange={(v) => updateTextProp('shadowBlur', v)}
          theme={theme}
        />
        <SliderRow
          label={t('props.shadowOffsetX')}
          value={textProps.shadowOffsetX}
          min={-20} max={20}
          onChange={(v) => updateTextProp('shadowOffsetX', v)}
          theme={theme}
        />
        <SliderRow
          label={t('props.shadowOffsetY')}
          value={textProps.shadowOffsetY}
          min={-20} max={20}
          onChange={(v) => updateTextProp('shadowOffsetY', v)}
          theme={theme}
        />
      </PropGroup>

      {/* 保存为字体模板 */}
      {fontTemplateProps && (
        <div className="font-template-save-area">
          <div className="font-template-save-area__header">
            <span className="font-template-save-area__title" style={{ color: theme.textSecondary }}>
              {editingFontTemplate ? t('fontTemplate.updateExisting') : t('props.saveFontTemplate')}
            </span>
            <button
              type="button"
              className={`font-template-save-area__toggle ${showFontSaveInput ? 'font-template-save-area__toggle--active' : ''}`}
              style={{ color: showFontSaveInput ? theme.textMuted : theme.accent }}
              onClick={() => {
                setShowFontSaveInput((v) => !v);
                if (showFontSaveInput && editingFontTemplate) setEditingFontTemplate(null);
              }}
            >
              {showFontSaveInput ? t('template.cancel') : t('template.save')}
            </button>
          </div>

          {showFontSaveInput && (
            <div className="font-template-save-area__row">
              <ConfigProvider theme={{ components: { Input: makeInputToken(theme) } }}>
                <Input
                  value={editingFontTemplate ? updateName : saveFontTemplateName}
                  onChange={(e) => editingFontTemplate
                    ? setUpdateName(e.target.value)
                    : setSaveFontTemplateName(e.target.value)
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveOrUpdate()}
                  placeholder={editingFontTemplate ? editingFontTemplate.label : t('template.inputPlaceholder')}
                  autoFocus
                />
              </ConfigProvider>
              <button
                type="button"
                className="font-template-save-area__save-btn"
                style={{ color: theme.accent }}
                disabled={!editingFontTemplate && (customFontTemplates?.length ?? 0) >= 10}
                onClick={handleSaveOrUpdate}
              >
                {editingFontTemplate
                  ? t('fontTemplate.update')
                  : ((customFontTemplates?.length ?? 0) >= 10 ? t('template.full') : t('template.save'))}
              </button>
            </div>
          )}

          <div className="font-template-save-area__count" style={{ color: theme.textMuted }}>
            {t('template.fontSavedCount', { count: customFontTemplates?.length ?? 0 })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextPropsEditor;
