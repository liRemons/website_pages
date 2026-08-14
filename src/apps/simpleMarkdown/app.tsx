import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input, message, Modal, Button, Upload } from 'antd';
import RenderMarkdown, { initHighlighter, languagesCommon, markdownFormat } from 'remons-render-markdown';
import 'remons-render-markdown/dist/index.css';
import chartConfig from '@/utils/chart-config';
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
  const [modal] = Modal.useModal();
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

    const message = (event) => {
      if (event.origin !== window.origin) return;
      if (event.data?.type === 'DATA') {
        if (event.data.payload?.type === 'printData' && event.data.payload?.content) {
          setMarkdown(event.data.payload?.content);
          setTimeout(() => {
            handlePrint('once');
          }, 2000);
        }
        // 处理完后回传结果
        window.opener?.postMessage({
          type: 'RESULT',
          payload: { success: true }
        }, window.origin);
      }
    }
    window.addEventListener('resize', checkMobile);
    window.addEventListener('message', message);

    // 页面加载完成后通知父窗口
    window.addEventListener('load', () => {
      window.opener?.postMessage({ type: 'READY' }, window.origin);
    });
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('message', message);
    }
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

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.md')) {
      message.error('仅支持上传 .md 文件');
      return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setMarkdown(e.target?.result as string);
    };
    reader.readAsText(file);
    return false;
  }

  const handlePrint = async (type?: string) => {
    const { anchor } = await markdownFormat(markdown);
    const res = await service({
      method: 'post',
      url: '/content/createHtml',
      data: {
        dom: document.getElementById('previewContent')?.innerHTML,
        css: getRelevantCSS(document.getElementById('previewContent') as HTMLElement),
        fileName: document.getElementById('previewContent')?.querySelector('h1')?.id || '',
        type: type || '',
        tocTree: anchor
      },
    });

    if (res?.success) {
      const path = `${HOST}${res.path}`;
      const newWindow = window.open(path, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        if (type === 'once') {
          alert(`文件已生成，请手动打开新窗口查看：${path}, 10分钟内有效,请及时保存`);
        } else {
          alert(`文件已生成，请手动打开新窗口查看：${path}`);
        }
      } else {
        if (type === 'once') {
          message.success('打印成功正在打开预览窗口, 10分钟内有效, 请及时保存');
        } else {
          message.success('打印成功，文件已生成，正在打开预览窗口');
        }
      }
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

  return (
    <>
      <Container
        header={<Header name="简易 Markdown" handleContent={handleContent} leftPath={`/${APP_NAME}/tool`} />}
        main={
          <div className={style.page} ref={containerRef}>

            <div className={style.editorPane} style={isMobile ? { height: `${editorPercent}%` } : { width: `${editorPercent}%` }}>
              <div className={style.uploadArea}>
                <Upload
                  accept="*"
                  showUploadList={false}
                  beforeUpload={handleFileUpload}
                >
                  <Button size="small" type="dashed">上传 .md 文件</Button>
                </Upload>
              </div>
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
              <Button disabled={!markdown} onClick={() => handlePrint()} className={style.printBtn}>
                打印
              </Button>
              <div className={style.previewContent} id="previewContent">
                <RenderMarkdown
                  chartConfig={chartConfig}
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