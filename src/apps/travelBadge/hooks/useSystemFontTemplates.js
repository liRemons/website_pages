import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import {
  getSystemFontTemplateList,
  createSystemFontTemplate,
  updateSystemFontTemplate as updateApi,
  deleteSystemFontTemplateApi,
} from '../api/systemFontTemplate';

export const useSystemFontTemplates = () => {
  const [systemFontTemplates, setSystemFontTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSystemFontTemplateList();
      if (res?.success) {
        setSystemFontTemplates(res.data || []);
      }
    } catch (error) {
      message.error(error.message || '加载系统字体模板失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const addSystemFontTemplate = useCallback(async (templateData) => {
    setLoading(true);
    try {
      const res = await createSystemFontTemplate({
        label: templateData.label.trim(),
        desc: templateData.desc?.trim() || '',
        textProps: templateData.textProps,
        sortOrder: templateData.sortOrder || 0,
      });
      if (res?.success) {
        message.success('系统字体模板已新增');
        await loadTemplates();
      }
    } catch (error) {
      message.error(error.message || '新增失败');
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  const updateSystemFontTemplate = useCallback(async (templateId, templateData) => {
    setLoading(true);
    try {
      const payload = { id: templateId };
      if (templateData.label !== undefined) payload.label = templateData.label.trim();
      if (templateData.desc !== undefined) payload.desc = templateData.desc.trim();
      if (templateData.textProps !== undefined) payload.textProps = templateData.textProps;
      if (templateData.sortOrder !== undefined) payload.sortOrder = templateData.sortOrder;
      if (templateData.status !== undefined) payload.status = templateData.status;

      const res = await updateApi(payload);
      if (res?.success) {
        message.success('系统字体模板已更新');
        await loadTemplates();
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  const deleteSystemFontTemplate = useCallback(async (templateId) => {
    setLoading(true);
    try {
      const res = await deleteSystemFontTemplateApi({ id: templateId });
      if (res?.success) {
        message.success('系统字体模板已删除');
        await loadTemplates();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  return {
    systemFontTemplates,
    loading,
    addSystemFontTemplate,
    updateSystemFontTemplate,
    deleteSystemFontTemplate,
    loadTemplates,
  };
};
