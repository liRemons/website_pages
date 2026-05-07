import { useState, useCallback } from 'react';
import { message } from 'antd';

const CUSTOM_FONT_TEMPLATES_KEY = 'photo_editor_custom_font_templates';

/**
 * 自定义字体模板管理 Hook
 * 管理自定义字体模板的增删改、保存当前选中文字样式为模板、应用模板
 */
export const useFontTemplates = ({ selectedElement }) => {
  const [customFontTemplates, setCustomFontTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_FONT_TEMPLATES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [saveFontTemplateName, setSaveFontTemplateName] = useState('');
  const [showFontSaveInput, setShowFontSaveInput] = useState(false);

  // 持久化到 localStorage
  const persistTemplates = useCallback((updated) => {
    setCustomFontTemplates(updated);
    localStorage.setItem(CUSTOM_FONT_TEMPLATES_KEY, JSON.stringify(updated));
  }, []);

  // 保存当前选中文字元素的 textProps 为自定义字体模板（最多 10 个）
  const saveCurrentAsFontTemplate = useCallback(() => {
    const name = saveFontTemplateName.trim();
    if (!name) return;
    if (!selectedElement || selectedElement.type !== 'text') {
      message.warning('请先选中一个文字元素');
      return;
    }
    if (customFontTemplates.length >= 10) {
      message.warning('最多保存 10 个自定义字体模板，请先删除一些旧模板');
      return;
    }

    const newTemplate = {
      id: `custom_font_${Date.now()}`,
      label: name,
      desc: `${selectedElement.textProps?.fontFamily || ''} · ${selectedElement.textProps?.fontSize || ''}px`,
      textProps: { ...selectedElement.textProps },
      isCustom: true,
      createdAt: new Date().toLocaleDateString(),
    };

    persistTemplates([...customFontTemplates, newTemplate]);
    setSaveFontTemplateName('');
    setShowFontSaveInput(false);
    message.success(`字体模板「${name}」已保存`);
  }, [saveFontTemplateName, customFontTemplates, selectedElement, persistTemplates]);

  // 删除自定义字体模板
  const deleteCustomFontTemplate = useCallback((templateId) => {
    persistTemplates(customFontTemplates.filter((t) => t.id !== templateId));
  }, [customFontTemplates, persistTemplates]);

  // 更新自定义字体模板（名称 + textProps 同时更新）
  const updateFontTemplate = useCallback((templateId, newName, newTextProps) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = customFontTemplates.map((t) =>
      t.id === templateId
        ? {
            ...t,
            label: trimmed,
            textProps: { ...newTextProps },
            desc: `${newTextProps?.fontFamily || ''} · ${newTextProps?.fontSize || ''}px`,
          }
        : t
    );
    persistTemplates(updated);
    message.success(`字体模板「${trimmed}」已更新`);
  }, [customFontTemplates, persistTemplates]);

  return {
    customFontTemplates,
    saveFontTemplateName,
    setSaveFontTemplateName,
    showFontSaveInput,
    setShowFontSaveInput,
    saveCurrentAsFontTemplate,
    deleteCustomFontTemplate,
    updateFontTemplate,
  };
};
