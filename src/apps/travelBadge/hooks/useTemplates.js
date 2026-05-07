import { message } from 'antd';
import { useState, useCallback } from 'react';

const CUSTOM_TEMPLATES_KEY = 'photo_editor_custom_templates';

/**
 * 自定义模板管理 Hook
 * 管理自定义模板的增删改查、保存当前画布为模板、应用模板到画布
 */
export const useTemplates = ({ elements, canvasRef, canvasRatio, setElements, setActiveFrame }) => {
  const [customTemplates, setCustomTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  // 保存当前画布为自定义模板（最多 10 个）
  const saveCurrentAsTemplate = useCallback(() => {
    const name = saveTemplateName.trim();
    if (!name) return;
    if (customTemplates.length >= 10) {
      message.warning('最多保存 10 个自定义模板，请先删除一些旧模板');
      return;
    }
    const canvasDom = canvasRef.current;
    const canvasW = canvasDom ? canvasDom.getBoundingClientRect().width : 600;
    const canvasH = canvasDom ? canvasDom.getBoundingClientRect().height : 450;

    // 将当前文字元素转换为比例坐标存储
    const templateElements = elements
      .filter((el) => el.type === 'text')
      .map((el) => ({
        type: 'text',
        rx: el.x / canvasW,
        ry: el.y / canvasH,
        rw: el.width / canvasW,
        rh: el.height / canvasH,
        textProps: { ...el.textProps },
      }));

    const newTemplate = {
      id: `custom_${Date.now()}`,
      label: name,
      desc: `${templateElements.length} 个文字元素`,
      elements: templateElements,
      isCustom: true,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
    setSaveTemplateName('');
    setShowSaveInput(false);
  }, [saveTemplateName, customTemplates, elements, canvasRef]);

  // 删除自定义模板
  const deleteCustomTemplate = useCallback((templateId) => {
    const updated = customTemplates.filter((t) => t.id !== templateId);
    setCustomTemplates(updated);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
  }, [customTemplates]);

  // 更新自定义模板（修改名称/描述，或用当前画布内容覆盖）
  const updateCustomTemplate = useCallback((templateId, patch) => {
    const updated = customTemplates.map((tpl) =>
      tpl.id === templateId ? { ...tpl, ...patch } : tpl
    );
    setCustomTemplates(updated);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
  }, [customTemplates]);

  // 应用模板：设置相框 + 将模板预设元素（比例坐标换算为实际像素）追加到画布
  const applyTemplate = useCallback((template) => {
    setActiveFrame(template.id);

    // 无论新模板是否有预设元素，都先清空画布
    if (!template.elements || template.elements.length === 0) {
      setElements([]);
      return;
    }

    const canvasDom = canvasRef.current;
    const canvasW = canvasDom ? canvasDom.getBoundingClientRect().width : 600;
    const canvasH = canvasW / canvasRatio;

    // 完全应用新模板的预设元素
    const newElements = template.elements.map((tpl, index) => ({
      id: `el_${Date.now()}_${index}`,
      type: tpl.type,
      x: tpl.rx * canvasW,
      y: tpl.ry * canvasH,
      width: tpl.rw * canvasW,
      height: tpl.rh * canvasH,
      zIndex: 100 + index,
      templateElement: true,
      textProps: tpl.textProps ? { ...tpl.textProps } : undefined,
    }));
    setElements(newElements);
  }, [canvasRatio, canvasRef, setActiveFrame, setElements]);

  return {
    customTemplates,
    saveTemplateName,
    setSaveTemplateName,
    showSaveInput,
    setShowSaveInput,
    saveCurrentAsTemplate,
    deleteCustomTemplate,
    updateCustomTemplate,
    applyTemplate,
  };
};
