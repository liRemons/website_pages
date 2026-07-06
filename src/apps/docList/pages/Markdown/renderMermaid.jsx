import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Modal, Button, message, Tooltip } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  ReloadOutlined,
  CodeOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { copy } from 'methods-r';
import mermaid from 'mermaid';
import Panzoom from '@panzoom/panzoom';

// 初始化 Mermaid
mermaid.initialize({ startOnLoad: false, theme: 'default' });

// ==================== Mermaid 工具栏组件 ====================
function MermaidToolbar({ onAction, isCollapsed }) {
  const buttons = [
    { icon: <PlusOutlined />, title: '放大', action: 'zoomIn' },
    { icon: <MinusOutlined />, title: '缩小', action: 'zoomOut' },
    { icon: <ReloadOutlined />, title: '重置', action: 'reset' },
    { icon: <CodeOutlined />, title: '查看源码', action: 'viewSource' },
    {
      icon: isCollapsed ? <DownOutlined /> : <UpOutlined />,
      title: isCollapsed ? '展开' : '收起',
      action: 'toggleCollapse',
    },
  ];

  return (
    <div className="mermaid-toolbar">
      {buttons.map((btn) => (
        <Tooltip title={btn.title} key={btn.action}>
          <button
            className="circle"
            title={btn.title}
            onClick={() => onAction(btn.action)}
          >
            {btn.icon}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

// ==================== 源码弹窗组件 ====================
function SourceModal({ code, open, onClose }) {
  const handleCopy = () => {
    if (typeof copy === 'function') {
      copy(code);
      message.success('复制成功');
    } else {
      navigator.clipboard.writeText(code).then(() => message.success('复制成功'));
    }
  };

  return (
    <Modal
      open={open}
      title="Mermaid 源码"
      width={800}
      destroyOnClose
      onCancel={onClose}
      footer={[
        <Button key="copy" type="primary" onClick={handleCopy}>
          复制源码
        </Button>,
      ]}
    >
      <pre>
        <code>{code}</code>
      </pre>
    </Modal>
  );
}

// ==================== 单个 Mermaid 图表组件 ====================
function MermaidBlock({ source }) {
  const [svg, setSvg] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showSource, setShowSource] = useState(false);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const panzoomRef = useRef(null);

  // 渲染 Mermaid SVG
  useEffect(() => {
    const id = `mermaid-${Math.random().toString(36).substring(2)}`;
    mermaid.render(id, source).then(({ svg }) => {
      setSvg(svg);
    }).catch((err) => {
      console.error('Mermaid render error:', err);
      setSvg(`<span style="color:red">图表渲染失败: ${err.message}</span>`);
    });
  }, [source]);

  // 初始化 Panzoom
  useEffect(() => {
    if (!contentRef.current || !svg) return;

    panzoomRef.current = Panzoom(contentRef.current, {
      maxScale: 5,
      minScale: 0.1,
      contain: 'outside',
    });

    const handleWheel = panzoomRef.current.zoomWithWheel;
    const wrapper = wrapperRef.current;
    wrapper?.addEventListener('wheel', handleWheel);

    return () => {
      wrapper?.removeEventListener('wheel', handleWheel);
      panzoomRef.current?.destroy();
      panzoomRef.current = null;
    };
  }, [svg]);

  // 动作处理
  const handleAction = useCallback((action) => {
    const pz = panzoomRef.current;
    switch (action) {
      case 'zoomIn':
        pz?.zoomIn();
        break;
      case 'zoomOut':
        pz?.zoomOut();
        break;
      case 'reset':
        pz?.reset();
        break;
      case 'viewSource':
        setShowSource(true);
        break;
      case 'toggleCollapse':
        setIsCollapsed((prev) => !prev);
        break;
      default:
        break;
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`mermaid-wrapper${isCollapsed ? ' mermaid-collapsed' : ''}`}
      style={{ position: 'relative' }}
    >
      <MermaidToolbar
        onAction={handleAction}
        isCollapsed={isCollapsed}
      />
      <div
        ref={contentRef}
        className="mermaid-content"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <SourceModal
        code={source}
        open={showSource}
        onClose={() => setShowSource(false)}
      />
    </div>
  );
}

// ==================== 主入口函数 ====================
async function renderMermaidWithControls() {
  const blocks = document.querySelectorAll('code.language-mermaid');

  for (const block of blocks) {
    const pre = block.parentElement;
    const source = block.textContent.trim();

    // 创建挂载容器
    const container = document.createElement('div');
    container.className = 'mermaid-react-root';
    pre.replaceWith(container);

    // 使用 React 渲染
    ReactDOM.render(<MermaidBlock source={source} />, container);
  }
}

export default renderMermaidWithControls;
