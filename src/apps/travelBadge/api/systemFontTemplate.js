import { service } from '@/axios';

// 获取系统字体模板列表
export const getSystemFontTemplateList = () =>
  service({ method: 'GET', url: '/systemFontTemplate/list' });

// 新增系统字体模板
export const createSystemFontTemplate = (payload) =>
  service({ method: 'POST', url: '/systemFontTemplate/add', data: payload });

// 更新系统字体模板
export const updateSystemFontTemplate = (payload) =>
  service({ method: 'PUT', url: '/systemFontTemplate/update', data: payload });

// 删除系统字体模板
export const deleteSystemFontTemplateApi = (payload) =>
  service({ method: 'DELETE', url: '/systemFontTemplate/delete', data: payload });
