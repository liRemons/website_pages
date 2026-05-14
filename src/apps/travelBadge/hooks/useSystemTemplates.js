import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { FRAME_TEMPLATES } from '../utils/constants';
import {
  fetchSystemTemplateList,
  createSystemTemplate,
  updateSystemTemplate as updateSystemTemplateApi,
  removeSystemTemplate,
  uploadTemplateImage,
  uploadBase64Image,
} from '../api/systemTemplate';

/**
 * 判断字符串是否为 base64 dataURL
 */
const isBase64DataUrl = (str) =>
  typeof str === 'string' && str.startsWith('data:image/');

/**
 * 将模板中所有 type=image 且 src 为 base64 的元素批量上传，返回替换后的 elements
 */
const uploadElementImages = async (elements) => {
  return Promise.all(
    elements.map(async (element) => {
      if (element.type === 'image' && isBase64DataUrl(element.src)) {
        const url = await uploadBase64Image(element.src);
        return { ...element, src: url };
      }
      return element;
    })
  );
};

/**
 * 系统模板管理 Hook（仅管理员可用）
 *
 * 数据来源优先级：接口 > FRAME_TEMPLATES 常量兜底
 * 管理员操作（增删改）直接调用接口，完成后重新拉取列表同步状态
 */
export const useSystemTemplates = () => {
  const [systemTemplates, setSystemTemplates] = useState(FRAME_TEMPLATES);
  const [loading, setLoading] = useState(false);

  // 拉取系统模板列表
  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetchSystemTemplateList();
      if (res?.success && Array.isArray(res.data)) {
        // 将服务端数据映射为前端运行时结构
        const templates = res.data.map((item) => ({
          id: String(item.id),
          label: item.label,
          desc: item.desc || '',
          coverUrl: item.cover_url || '',
          sortOrder: item.sort_order,
          status: item.status,
          ...(item.template_content || {}),
        }));
        setSystemTemplates(templates);
      }
    } catch {
      // 接口异常时保持 FRAME_TEMPLATES 兜底，不提示用户
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /**
   * 新增系统模板（管理员）
   * @param {object} templateData
   * @param {string} templateData.label
   * @param {string} [templateData.desc]
   * @param {Blob|null} [templateData.coverBlob]    封面截图 Blob
   * @param {number} templateData.canvasRatio
   * @param {Array}  templateData.elements
   * @param {string} [templateData.createdBy]
   */
  const addSystemTemplate = useCallback(async (templateData) => {
    setLoading(true);
    try {
      // 1. 上传封面截图（如果有）
      let coverUrl = templateData.coverUrl || '';
      if (templateData.coverBlob) {
        coverUrl = await uploadTemplateImage(templateData.coverBlob, 'cover');
      }

      // 2. 批量上传 elements 中的 base64 图片
      const elements = await uploadElementImages(templateData.elements || []);

      // templatePanel 已处理好字段映射（去掉 id，url→src），直接使用
      const cleanedElements = elements;

      // 4. 调新增接口
      const res = await createSystemTemplate({
        label: templateData.label.trim(),
        desc: templateData.desc?.trim() || '',
        coverUrl,
        templateContent: {
          canvasRatio: templateData.canvasRatio,
          elements: cleanedElements,
        },
        sortOrder: templateData.sortOrder || 0,
        createdBy: templateData.createdBy || '',
      });

      if (res?.success) {
        message.success('系统模板已新增');
        await loadTemplates();
      }
    } catch (error) {
      message.error(error.message || '新增失败');
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  /**
   * 更新系统模板（管理员）
   * @param {string|number} templateId
   * @param {object} templateData  同 addSystemTemplate 的 templateData 结构
   */
  const updateSystemTemplate = useCallback(async (templateId, templateData) => {
    setLoading(true);
    try {
      // 1. 上传封面（如果有新截图）
      let coverUrl = templateData.coverUrl;
      if (templateData.coverBlob) {
        coverUrl = await uploadTemplateImage(templateData.coverBlob, 'cover');
      }

      // 2. 批量上传 elements 中的 base64 图片
      const elements = templateData.elements
        ? await uploadElementImages(templateData.elements)
        : undefined;

      const cleanedElements = elements || undefined;

      const payload = { id: templateId };
      if (templateData.label !== undefined) payload.label = templateData.label.trim();
      if (templateData.desc !== undefined) payload.desc = templateData.desc.trim();
      if (coverUrl !== undefined) payload.coverUrl = coverUrl;
      if (cleanedElements !== undefined) {
        payload.templateContent = {
          canvasRatio: templateData.canvasRatio,
          elements: cleanedElements,
        };
      }
      if (templateData.sortOrder !== undefined) payload.sortOrder = templateData.sortOrder;
      if (templateData.status !== undefined) payload.status = templateData.status;

      const res = await updateSystemTemplateApi(payload);
      if (res?.success) {
        message.success('系统模板已更新');
        await loadTemplates();
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  /**
   * 删除系统模板（管理员）
   * @param {string|number} templateId
   */
  const deleteSystemTemplate = useCallback(async (templateId) => {
    setLoading(true);
    try {
      const res = await removeSystemTemplate(templateId);
      if (res?.success) {
        message.success('系统模板已删除');
        await loadTemplates();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  // 手动刷新列表
  const refreshSystemTemplates = useCallback(() => loadTemplates(), [loadTemplates]);

  return {
    systemTemplates,
    loading,
    addSystemTemplate,
    updateSystemTemplate,
    deleteSystemTemplate,
    refreshSystemTemplates,
  };
};
