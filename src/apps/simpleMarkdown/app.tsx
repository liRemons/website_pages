import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input, message } from 'antd';
import RenderMarkdown, { initHighlighter, languagesCommon } from 'remons-render-markdown';
import 'remons-render-markdown/dist/index.css';
import { HOST } from '@/utils'
import '@assets/css/index.global.less';
import { service } from '@/axios';
import Container from '@components/Container';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import handleContent from './handle.md';
import style from './index.module.less';

initHighlighter(languagesCommon);

const defaultMarkdown = ''

const MIN_EDITOR_PERCENT = 20;
const MAX_EDITOR_PERCENT = 80;

export default function App() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [isMobile, setIsMobile] = useState(false);
  const [editorPercent, setEditorPercent] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 拖拽处理
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    document.body.style.userSelect = 'none';
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  }, []);

  function getRelevantCSS(rootElement: HTMLElement): string {
    const relevantRules = new Set<string>();

    // 收集目标元素及其后代的所有标签名、类名、ID
    const selectors = new Set<string>();
    const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;

    while (node) {
      if (node instanceof Element) {
        const element = node as Element;
        if (element.tagName) selectors.add(element.tagName.toLowerCase());
        if (element.id) selectors.add(`#${element.id}`);
        if (element.classList) {
          for (const cls of Array.from(element.classList)) {
            selectors.add(`.${cls}`);
          }
        }
      }
      node = walker.nextNode();
    }

    const selectorList = Array.from(selectors);
    const styleSheets = Array.from(document.styleSheets) as CSSStyleSheet[];

    for (const sheet of styleSheets) {
      try {
        const cssRules = Array.from(sheet.cssRules || []);
        for (const rule of cssRules) {
          // 强制保留 :root 和 html 的规则（用于 CSS 变量定义）
          if (rule instanceof CSSStyleRule && (rule.selectorText === ':root' || rule.selectorText === 'html')) {
            relevantRules.add(rule.cssText);
            continue;
          }

          // 仅保留选择器匹配目标元素的规则
          if (rule instanceof CSSStyleRule) {
            const ruleSelectors = rule.selectorText.split(',').map((s) => s.trim());
            const isRelevant = ruleSelectors.some((sel) => {
              return selectorList.some((target) => sel.includes(target));
            });
            if (isRelevant) relevantRules.add(rule.cssText);
          }
          // 保留 @media print / @page 等关键 at-rules
          else if (rule instanceof CSSMediaRule && rule.conditionText?.includes('print')) {
            const innerRules = Array.from(rule.cssRules);
            for (const innerRule of innerRules) {
              relevantRules.add(innerRule.cssText);
            }
          } else if (rule instanceof CSSPageRule) {
            relevantRules.add(rule.cssText);
          }
        }
      } catch (e) {
        console.warn('跳过不可读样式表:', sheet.href);
      }
    }

    return Array.from(relevantRules).join('\n');
  }

  const handlePrint = async () => {
    const res = await service({
      method: 'post',
      url: '/content/createHtml',
      data: {
        dom: document.getElementById('previewContent')?.outerHTML,
        css: getRelevantCSS(document.getElementById('previewContent') as HTMLElement),
      },
    });

    if (res?.success) {
      window.open(`${HOST}${res.path}`, '_blank');
    } else {
      message.error('打印失败，请重试');
    }
  }

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let percent;
    if (isMobile) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const ratio = ((clientY - rect.top) / rect.height) * 100;
      percent = Math.min(MAX_EDITOR_PERCENT, Math.max(MIN_EDITOR_PERCENT, ratio));
    } else {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const ratio = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.min(MAX_EDITOR_PERCENT, Math.max(MIN_EDITOR_PERCENT, ratio));
    }
    setEditorPercent(percent);
  }, [isDragging, isMobile]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const dividerClass = `${style.divider} ${isMobile ? style.vertical : style.horizontal}${isDragging ? ` ${style.dragging}` : ''}`;

  const printButton = (
    <div onClick={handlePrint} className={style.printBtn}>
      打印
    </div>
  );

  return (
    <>
      <Container
        header={<Header name="简易 Markdown" handleContent={handleContent} leftPath={`/${APP_NAME}/tool`} />}
        main={
          <div className={style.page} ref={containerRef}>

            <div className={style.editorPane} style={isMobile ? { height: `${editorPercent}%` } : { width: `${editorPercent}%` }}>
              <Input.TextArea
                className={style.editor}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="请输入 Markdown 内容..."
              />
            </div>
            <div className={dividerClass}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            />
            <div className={style.previewPane}>
              {printButton}
              <div className={style.previewContent} id="previewContent">
                <RenderMarkdown
                  isPrintPreview
                  showBackTop={false}
                  content={markdown}
                />
              </div>
            </div>
          </div>
        }
      />
      <Fixed />
    </>
  );
}