/**
 * usePersistedToggle 持久化开关状态（localStorage）
 * docList / project 等 Markdown 页面的菜单显隐、列表面板收起等状态共用
 */
import { useState } from 'react';

/**
 * @param storageKey - localStorage 存储键
 * @param defaultValue - 无存储记录时的默认值
 * @returns [value, toggle] - 当前值与切换函数（切换时自动持久化）
 */
export default function usePersistedToggle(storageKey: string, defaultValue = false): [boolean, () => void] {
  const read = (): boolean => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === null ? defaultValue : stored === 'true';
    } catch {
      // 存储不可用（隐身模式/App 环境）时退回默认值
      return defaultValue;
    }
  };

  const [value, setValue] = useState<boolean>(read);

  const toggle = () => {
    const next = !value;
    setValue(next);
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {
      // 存储不可用时仅本次会话生效
    }
  };

  return [value, toggle];
}
