import React from 'react';

/**
 * Markdown 渲染组件
 * 简单的 Markdown 渲染实现
 */
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // 简单的 Markdown 解析
  const renderMarkdown = (text) => {
    // 转义 HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 代码块 ```language\ncode```
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre style="background:#282c34;color:#abb2bf;padding:16px;border-radius:6px;overflow:auto;font-size:13px;line-height:1.6;font-family:Monaco,Menlo,monospace;margin:12px 0;"><code>${code.trim()}</code></pre>`;
    });

    // 行内代码 `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:0.9em;font-family:Monaco,Menlo,monospace;color:#d73a49;">$1</code>');

    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3 style="margin:20px 0 12px;font-size:18px;font-weight:600;color:#333;border-bottom:1px solid #eee;padding-bottom:8px;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="margin:24px 0 16px;font-size:22px;font-weight:600;color:#333;border-bottom:2px solid #eee;padding-bottom:8px;">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="margin:24px 0 16px;font-size:26px;font-weight:700;color:#333;border-bottom:2px solid #1890ff;padding-bottom:8px;">$1</h1>');

    // 加粗
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#000;">$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:#555;">$1</em>');

    // 列表
    html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;">$1</li>');
    html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, '<ul style="margin:12px 0;padding-left:24px;line-height:1.8;">$&</ul>');

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;">$1</li>');

    // 引用
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="margin:12px 0;padding:12px 16px;background:#f6f8fa;border-left:4px solid #1890ff;color:#586069;">$1</blockquote>');

    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#1890ff;text-decoration:none;" target="_blank" rel="noopener noreferrer">$1</a>');

    // 分隔线
    html = html.replace(/^---$/gm, '<hr style="margin:20px 0;border:none;border-top:1px solid #e1e4e8;">');

    // 段落
    html = html.replace(/\n\n/g, '</p><p style="margin:10px 0;line-height:1.8;color:#333;">');
    html = '<p style="margin:10px 0;line-height:1.8;color:#333;">' + html + '</p>';

    // 清理空段落
    html = html.replace(/<p[^>]*><\/p>/g, '');
    html = html.replace(/<p[^>]*>\n+/g, '<p>');

    return html;
  };

  return (
    <div 
      style={{
        fontSize: '14px',
        color: '#333',
        lineHeight: '1.6',
      }}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};

export default MarkdownRenderer;