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
  FullscreenOutlined,
  FullscreenExitOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { copy, IsPC } from 'methods-r';
// import mermaid from 'mermaid';
import Panzoom from '@panzoom/panzoom';
import useLoadMermaid from '@/hooks/useLoadMermaid';


// ==================== Mermaid 工具栏组件 ====================
function MermaidToolbar({ onAction, isCollapsed, isFullscreen }) {
  const isPC = IsPC();
  const buttons = [
    { icon: <PlusOutlined />, title: '放大', action: 'zoomIn' },
    { icon: <MinusOutlined />, title: '缩小', action: 'zoomOut' },
    { icon: <ReloadOutlined />, title: '重置', action: 'reset' },
    { icon: <CodeOutlined />, title: '查看源码', action: 'viewSource' },
    {
      icon: isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
      title: isFullscreen ? '退出全屏' : '全屏',
      action: 'toggleFullscreen',
    },
    {
      icon: isCollapsed ? <DownOutlined /> : <UpOutlined />,
      title: isCollapsed ? '展开' : '收起',
      action: 'toggleCollapse',
      isShow: !isFullscreen
    },
  ].filter(item => item.isShow !== false);

  return (
    <div className="mermaid-toolbar">
      {buttons.map((btn) => (
        <Tooltip title={btn.title} key={btn.action}>
          <button
            className={`circle${isPC ? '' : ' circle-mobile'}`}
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
  const { mermaid, loading } = useLoadMermaid()
  const [svg, setSvg] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rendering, setRendering] = useState(false);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const panzoomRef = useRef(null);

  // 渲染 Mermaid SVG
  useEffect(() => {
    if (!mermaid) return;
    setRendering(true);
    // 初始化 Mermaid
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    const id = `mermaid-${Math.random().toString(36).substring(2)}`;
    mermaid.render(id, source).then(({ svg }) => {
      setSvg(svg);
    }).catch((err) => {
      console.error('Mermaid render error:', err);
      setSvg(`<span style="color:red">图表渲染失败: ${err.message}</span>`);
    }).finally(() => {
      setRendering(false);
    });
  }, [source, mermaid]);

  // 初始化 Panzoom（全屏状态变化时重建，以适配新的容器尺寸）
  useEffect(() => {
    if (!contentRef.current || !svg) return;

    panzoomRef.current = Panzoom(contentRef.current, {
      maxScale: 5,
      minScale: 0.1,
      startScale: 1,
      // 全屏下不限制拖拽边界，方便查看 SVG 任意区域
      contain: isFullscreen ? false : 'outside',
    });

    // 全屏时滚轮事件绑定到全屏元素，否则绑定到 wrapper
    const wheelTarget = (isFullscreen || !isCollapsed) ? wrapperRef.current : null;
    const handleWheel = panzoomRef.current.zoomWithWheel;
    wheelTarget?.addEventListener('wheel', handleWheel);

    return () => {
      wheelTarget?.removeEventListener('wheel', handleWheel);
      panzoomRef.current?.destroy();
      panzoomRef.current = null;
    };
  }, [svg, isFullscreen, isCollapsed]);

  // 监听浏览器原生全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
      case 'toggleFullscreen': {
        const el = wrapperRef.current;
        if (!el) return;
        pz?.setOptions({
          scale: 1
        });
        if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsCollapsed(true);
        } else {
          el.requestFullscreen();
          setIsCollapsed(false);
        }
        break;
      }
      default:
        break;
    }
  }, []);

  const isMove = !isCollapsed || isFullscreen;

  if (loading) {
    return (
      <div className="mermaid-loading">
       <span> 图表加载中 <LoadingOutlined /></span> 
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`mermaid-wrapper${isCollapsed ? ' mermaid-collapsed' : ''}`}
      style={{ position: 'relative' }}
    >
      <MermaidToolbar
        onAction={handleAction}
        isCollapsed={isCollapsed}
        isFullscreen={isFullscreen}
      />
      <div
        className="mermaid-fullscreen-target"
        style={{ width: '100%', height: '100%', background: '#f8f9fa' }}
      >
        <div
          ref={contentRef}
          className={`mermaid-content ${isMove ? 'move' : 'disabled-move'}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
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
