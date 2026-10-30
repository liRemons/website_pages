/**
 * useDocTitle 动态页面标题
 * 组合标题片段，更新 document.title 与 OGP meta 标签
 * docList（分类: 标题）与 project（项目：标题）共用
 */
import { useEffect } from 'react';

/**
 * @param parts - 标题片段（按顺序以分隔符拼接，空片段跳过）
 * @param options.separator - 分隔符，默认 '：'
 * @param options.syncDescription - 是否同步更新 description meta（project 需要）
 * @returns 拼接后的完整标题（可直接展示在 Header 上）
 */
export default function useDocTitle(
  parts: (string | undefined | null)[],
  options: { separator?: string; syncDescription?: boolean } = {}
): string {
  const { separator = '：', syncDescription = false } = options;
  const title = parts.filter(Boolean).join(separator);

  useEffect(() => {
    if (!title) return;
    document.title = title;

    // 更新 OGP meta 标签
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="twitter:title"]', title);
    if (syncDescription) setMeta('meta[name="description"]', title);
  }, [title, syncDescription]);

  return title;
}
