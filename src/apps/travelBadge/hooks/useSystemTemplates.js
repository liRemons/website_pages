import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FRAME_TEMPLATES } from '../utils/constants';

const SYSTEM_TEMPLATES_OVERRIDE_KEY = 'photo_editor_system_templates_override';

/**
 * 系统模板管理 Hook（仅管理员可用）
 *
 * 采用「覆盖层」策略：
 * - localStorage 中存储管理员对系统模板的修改（新增、编辑、删除）
 * - 有覆盖层时使用覆盖层数据，否则回退到 FRAME_TEMPLATES 常量
 * - 重置功能可清空覆盖层，恢复默认
 */
export const useSystemTemplates = () => {
  const [systemTemplates, setSystemTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem(SYSTEM_TEMPLATES_OVERRIDE_KEY);
      return stored ? JSON.parse(stored) : FRAME_TEMPLATES;
    } catch {
      return FRAME_TEMPLATES;
    }
  });

  const persist = useCallback((updated) => {
    setSystemTemplates(updated);
    localStorage.setItem(SYSTEM_TEMPLATES_OVERRIDE_KEY, JSON.stringify(updated));
  }, []);

  // 新增系统模板
  const addSystemTemplate = useCallback((templateData) => {
    const newTemplate = {
      id: `system_custom_${Date.now()}`,
      label: templateData.label.trim(),
      desc: templateData.desc?.trim() || '',
      elements: templateData.elements || [],
    };
    persist([...systemTemplates, newTemplate]);
    message.success('系统模板已新增');
  }, [systemTemplates, persist]);

  // 更新系统模板
  const updateSystemTemplate = useCallback((templateId, templateData) => {
    const updated = systemTemplates.map((tpl) =>
      tpl.id === templateId
        ? {
            ...tpl,
            label: templateData.label.trim(),
            desc: templateData.desc?.trim() ?? tpl.desc,
            elements: templateData.elements ?? tpl.elements,
          }
        : tpl
    );
    persist(updated);
    message.success('系统模板已更新');
  }, [systemTemplates, persist]);

  // 删除系统模板
  const deleteSystemTemplate = useCallback((templateId) => {
    const updated = systemTemplates.filter((tpl) => tpl.id !== templateId);
    persist(updated);
    message.success('系统模板已删除');
  }, [systemTemplates, persist]);

  // 重置为默认（清空覆盖层）
  const resetSystemTemplates = useCallback(() => {
    localStorage.removeItem(SYSTEM_TEMPLATES_OVERRIDE_KEY);
    setSystemTemplates(FRAME_TEMPLATES);
    message.success('系统模板已重置为默认');
  }, []);

  // 是否已被修改过（相对于默认值）
  const isOverridden = !!localStorage.getItem(SYSTEM_TEMPLATES_OVERRIDE_KEY);

  return {
    systemTemplates,
    addSystemTemplate,
    updateSystemTemplate,
    deleteSystemTemplate,
    resetSystemTemplates,
    isOverridden,
  };
};
