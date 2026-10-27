/**
 * useItemSwitcher 文档/文章切换
 * 维护当前选中项，点击切换时：关闭移动端抽屉 → 加载内容 → 同步 URL
 * docList（pageId）与 project（docId）共用；App 环境走 openApp，避免 file:// 下 pushState 报错
 */
import { useState } from 'react';
import { getSearchParams } from 'methods-r';
import { isApp, openApp } from '@utils/nav';

export interface SwitcherOptions {
  /** 页面路径，如 '/docList'、'/project' */
  path: string;
  /** URL 中表示选中项的参数名，如 'pageId'、'docId' */
  idParam: string;
  /** 加载选中项内容（store.getMarkdown / store.getProjectDoc 等） */
  load: (id: string) => void;
  /** 初始选中 ID（通常为 ''，由页面初始化逻辑 setActive 设置） */
  initialId?: string;
}

export default function useItemSwitcher(options: SwitcherOptions) {
  const { path, idParam, load, initialId = '' } = options;
  const [activeId, setActiveId] = useState(initialId);
  const [drawerVisible, setDrawerVisible] = useState(false);

  /** 直接设置当前项并加载内容（供页面初始化时调用） */
  const select = (id: string) => {
    setActiveId(id);
    load(id);
  };

  /** 点击列表项：切换当前项、关闭抽屉并更新 URL */
  const handleClick = (data: { id: string }) => {
    const { id } = data;
    if (id === activeId) return;
    setActiveId(id);
    setDrawerVisible(false);
    load(id);
    const newParams = new URLSearchParams({ ...getSearchParams(), [idParam]: id });
    // App（file://）环境下 pushState 绝对路径会被解析为 file:///xxx?... 触发加载错误，改用 openApp
    if (!isApp()) {
      const pageURL = newParams.toString() ? `${path}?${newParams.toString()}` : path;
      history.pushState('', '', pageURL);
    } else {
      openApp({ url: path, params: { ...getSearchParams(), [idParam]: id } });
    }
  };

  return { activeId, setActiveId, drawerVisible, setDrawerVisible, select, handleClick };
}
