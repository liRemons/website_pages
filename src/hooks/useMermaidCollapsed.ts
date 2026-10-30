/**
 * useMermaidCollapsed mermaid 图表折叠状态
 * docList / project 共用同一 localStorage key，切换后刷新页面使渲染器重新初始化
 */
import usePersistedToggle from '@/hooks/usePersistedToggle';

const STORAGE_KEY = 'mermaidCollapsed';

export default function useMermaidCollapsed(): [boolean, () => void] {
  // 默认展开（无存储记录时视为 false）
  const [collapsed, setCollapsed] = usePersistedToggle(STORAGE_KEY, true);

  const toggle = () => {
    setCollapsed();
    window.location.reload();
  };

  return [collapsed, toggle];
}
