import { service } from '@axios';

// 查询项目列表
export const queryProjectList = (params) => {
  return service({
    method: 'get',
    url: '/project/queryProjectList',
    params,
  });
};

// 查询项目文档列表（不含 content）
export const queryProjectDocList = (projectId) => {
  return service({
    method: 'get',
    url: '/project/queryProjectDocList',
    params: { projectId },
  });
};

// 查询单个项目文档（含 content）
export const getProjectDoc = (id) => {
  return service({
    method: 'get',
    url: '/project/getProjectDoc',
    params: { id },
  });
};