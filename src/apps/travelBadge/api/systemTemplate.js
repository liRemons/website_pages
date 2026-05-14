import { service } from '@axios';

const BASE_URL = '/systemTemplate';

/**
 * 查询系统模板列表（仅返回启用状态）
 */
export const fetchSystemTemplateList = () =>
  service({ method: 'get', url: `${BASE_URL}/list` });

/**
 * 新增系统模板
 * @param {object} payload
 * @param {string} payload.label          模板名称（必填）
 * @param {string} [payload.desc]         副标题
 * @param {string} [payload.coverUrl]     封面缩略图 URL
 * @param {object} payload.templateContent 模板内容 JSON（必填）
 * @param {number} [payload.sortOrder]    排序权重
 * @param {string} [payload.createdBy]    创建人
 */
export const createSystemTemplate = (payload) =>
  service({ method: 'post', url: `${BASE_URL}/add`, data: payload });

/**
 * 更新系统模板
 * @param {object} payload
 * @param {number} payload.id             模板 ID（必填）
 * @param {string} [payload.label]
 * @param {string} [payload.desc]
 * @param {string} [payload.coverUrl]
 * @param {object} [payload.templateContent]
 * @param {number} [payload.sortOrder]
 * @param {number} [payload.status]       1=启用 / 0=禁用
 */
export const updateSystemTemplate = (payload) =>
  service({ method: 'put', url: `${BASE_URL}/update`, data: payload });

/**
 * 删除系统模板
 * @param {number} id 模板 ID
 */
export const removeSystemTemplate = (id) =>
  service({ method: 'delete', url: `${BASE_URL}/delete`, data: { id } });

/**
 * 上传模板图片（封面或元素图片），返回服务器访问路径
 * @param {File|Blob} file  图片文件
 * @param {'cover'|'element'} scene  用途标识
 * @returns {Promise<string>} 图片访问路径
 */
export const uploadTemplateImage = async (file, scene = 'element') => {
  const formData = new FormData();
  // 确保传入的是 File 对象（带文件名），formidable 才能正确解析
  const fileToUpload = file instanceof File
    ? file
    : new File([file], `template_${Date.now()}.png`, { type: file.type || 'image/png' });
  formData.append('file', fileToUpload);
  formData.append('scene', scene);

  const res = await service({
    method: 'post',
    url: `${BASE_URL}/uploadImage`,
    data: formData,
  });

  if (!res?.success) throw new Error(res?.msg || '图片上传失败');
  return res.data.url;
};

/**
 * 将 base64 dataURL 转成 File，再上传换取服务器路径
 * @param {string} base64DataUrl
 * @returns {Promise<string>} 服务器图片路径
 */
export const uploadBase64Image = async (base64DataUrl) => {
  // 手动解析 base64，避免某些环境下 fetch(dataURL) 不兼容
  const [meta, base64Str] = base64DataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/png';
  const binaryStr = atob(base64Str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const ext = mime.split('/')[1] || 'png';
  const file = new File([bytes], `template_${Date.now()}.${ext}`, { type: mime });
  return uploadTemplateImage(file, 'element');
};
