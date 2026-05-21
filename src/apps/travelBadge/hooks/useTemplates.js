import { message } from 'antd';
import { useState, useCallback } from 'react';

const CUSTOM_TEMPLATES_KEY = 'photo_editor_custom_templates';

/**
 * 自定义模板管理 Hook
 * 管理自定义模板的增删改查、保存当前画布为模板、应用模板到画布
 */
export const useTemplates = ({ elements, canvasRef, canvasRatio, setCanvasRatio, setElements, setActiveFrame }) => {
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

  // 模板基准画布宽度（模板在 PC 端创建时的画布宽度）
  const TEMPLATE_BASE_WIDTH = 600;
  const DEFAULT_TEMPLATE_RATIO = 4 / 3;

  const getTemplateElementValue = (templateElement, ratioKey, canvasSize) => {
    const ratioValue = templateElement[ratioKey];
    if (typeof ratioValue === 'number') {
      return ratioValue * canvasSize;
    }
    return undefined;
  };

  // 应用模板：同步画布比例，并按模板画布宽高分别恢复元素坐标和尺寸
  const applyTemplate = useCallback((template) => {
    const nextCanvasRatio = template.canvasRatio || DEFAULT_TEMPLATE_RATIO;
    setActiveFrame(template.id);
    setCanvasRatio(nextCanvasRatio);

    // 无论新模板是否有预设元素，都先清空画布
    if (!template.elements || template.elements.length === 0) {
      setElements([]);
      return;
    }

    const canvasDom = canvasRef.current;
    const canvasW = canvasDom ? canvasDom.getBoundingClientRect().width : TEMPLATE_BASE_WIDTH;
    const canvasH = canvasW / nextCanvasRatio;
    const scaleX = canvasW / TEMPLATE_BASE_WIDTH;
    const scaleY = canvasH / (TEMPLATE_BASE_WIDTH / nextCanvasRatio);

    // 完全应用新模板的预设元素，按画布宽高分别缩放坐标和尺寸
    const newElements = template.elements.map((tpl, index) => {
      const { src, rx, ry, rw, rh, ...rest } = tpl;
      const element = {
        ...rest,
        id: `el_${Date.now()}_${index}`,
        templateElement: true,
        x: getTemplateElementValue(tpl, 'rx', canvasW) ?? ((rest.x || 0) * scaleX),
        y: getTemplateElementValue(tpl, 'ry', canvasH) ?? ((rest.y || 0) * scaleY),
        width: getTemplateElementValue(tpl, 'rw', canvasW) ?? ((rest.width || 100) * scaleX),
        height: getTemplateElementValue(tpl, 'rh', canvasH) ?? ((rest.height || 100) * scaleY),
        zIndex: Math.max(1, rest.zIndex || index + 1),
      };
      // 文字元素：等比缩放字号
      if (rest.type === 'text' && rest.textProps) {
        element.textProps = {
          ...rest.textProps,
          fontSize: Math.round((rest.textProps.fontSize || 16) * scaleX),
        };
      }
      // image 元素：存库字段 src → 运行时字段 url
      if (tpl.type === 'image') {
        element.url = src || tpl.url || '';
      }
      return element;
    });
    setElements(newElements);
  }, [canvasRef, setActiveFrame, setCanvasRatio, setElements]);

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
