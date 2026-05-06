import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-less';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';

/**
 * 代码高亮组件
 * 使用 Prism.js 实现代码着色高亮
 */
const CodeHighlighter = ({ code, language, fileName }) => {
  const codeRef = useRef(null);

  // 根据文件名推断语言
  const getLanguage = () => {
    if (language) return language;
    
    if (fileName) {
      const ext = fileName.split('.').pop().toLowerCase();
      const langMap = {
        jsx: 'jsx',
        js: 'javascript',
        json: 'json',
        less: 'less',
        css: 'css',
        md: 'markdown',
        markdown: 'markdown',
      };
      return langMap[ext] || 'javascript';
    }
    
    return 'javascript';
  };

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  const lang = getLanguage();

  return (
    <div style={{
      background: '#2d2d2d',
      borderRadius: '8px',
      overflow: 'hidden',
      fontSize: '13px',
      lineHeight: '1.6',
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    }}>
      <div style={{
        background: '#1e1e1e',
        padding: '8px 16px',
        color: '#858585',
        fontSize: '12px',
        borderBottom: '1px solid #3d3d3d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{fileName || lang}</span>
        <span style={{ fontSize: '11px' }}>{code?.split('\n').length || 0} lines</span>
      </div>
      <pre style={{
        margin: 0,
        padding: '16px',
        overflow: 'auto',
        maxHeight: '480px',
        background: 'transparent',
      }}>
        <code 
          ref={codeRef}
          className={`language-${lang}`}
          style={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
          }}
        >
          {code || ''}
        </code>
      </pre>
    </div>
  );
};

export default CodeHighlighter;