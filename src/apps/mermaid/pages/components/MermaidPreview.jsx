import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Space, Tooltip, Select, Dropdown, message } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  AimOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import Panzoom from '@panzoom/panzoom';
import { THEME_OPTIONS } from '../constants';
import style from '../index.module.less';
import useLoadMermaid from '@/hooks/useLoadMermaid';

// 渲染 id 自增序号，保证每次 mermaid.render 的 DOM id 唯一
let renderIdSeq = 0;

// 从 svg 字符串中解析宽高，用于 PNG 导出
function getSvgSize(svgStr) {
  let w = 0;
  let h = 0;
  const wMatch = svgStr.match(/\bwidth="([\d.]+)px?"/i);
  const hMatch = svgStr.match(/\bheight="([\d.]+)px?"/i);
  if (wMatch) w = parseFloat(wMatch[1]);
  if (hMatch) h = parseFloat(hMatch[1]);
  if (!w || !h) {
    const vb = svgStr.match(/viewBox="([^"]+)"/i);
    if (vb) {
      const parts = vb[1].split(/[\s,]+/).map(Number);
      w = w || parts[2] || 0;
      h = h || parts[3] || 0;
    }
  }
  return { w: w || 800, h: h || 600 };
}

/**
 * 右栏：Mermaid 图表预览
 * - 实时渲染（防抖 300ms）
 * - Panzoom 缩放 / 拖拽 / 滚轮缩放
 * - 全屏 / 下载 SVG·PNG / 主题切换
 * - 渲染错误友好提示
 */
export default function MermaidPreview({ source, theme, onThemeChange }) {
  const { mermaid, loading } = useLoadMermaid();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const panzoomRef = useRef(null);
  const renderSeqRef = useRef(0);

  // 主题变化时重新初始化 mermaid
  useEffect(() => {
    if (!mermaid) {
      return;
    }
    mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'loose' });
  }, [theme, mermaid]);

  // 防抖渲染：source / theme 变化后 300ms 再渲染，避免每次按键都渲染
  useEffect(() => {
    if (!mermaid) {
      return;
    }
    const text = (source || '').trim();
    if (!text) {
      setSvg('');
      setError('');
      return;
    }
    setError('');
    const seq = ++renderSeqRef.current;
    const timer = setTimeout(async () => {
      const id = `mermaid-render-${renderIdSeq++}`;
      try {
        const { svg: svgStr } = await mermaid.render(id, text);
        if (seq !== renderSeqRef.current) return; // 已有更新的渲染请求，丢弃旧结果

        setSvg(svgStr);
        setError('');
      } catch (err) {
        if (seq !== renderSeqRef.current) return;
        // eslint-disable-next-line no-console
        console.error('Mermaid render error:', err);
        setError(err?.message?.split('\n')[0] || String(err));
      } finally {
        // 清理 mermaid 渲染过程中可能残留的临时节点
        const leftover = document.getElementById(id) || document.getElementById(`d${id}`);
        if (leftover && leftover.parentNode) leftover.parentNode.removeChild(leftover);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [source, theme, mermaid]);

  // 初始化 Panzoom（svg 或全屏状态变化时重建）
  useEffect(() => {
    if (!contentRef.current || !svg) return;
    panzoomRef.current = Panzoom(contentRef.current, {
      maxScale: 5,
      minScale: 0.1,
      startScale: 1,
      contain: isFullscreen ? false : 'outside',
    });
    const wheelTarget = wrapperRef.current;
    const handleWheel = panzoomRef.current.zoomWithWheel;
    wheelTarget?.addEventListener('wheel', handleWheel);
    return () => {
      wheelTarget?.removeEventListener('wheel', handleWheel);
      panzoomRef.current?.destroy();
      panzoomRef.current = null;
    };
  }, [svg, isFullscreen]);

  // 监听浏览器原生全屏状态
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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
      case 'toggleFullscreen': {
        const el = wrapperRef.current;
        if (!el) return;
        pz?.reset();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          el.requestFullscreen?.();
        }
        break;
      }
      default:
        break;
    }
  }, []);

  const downloadSVG = useCallback(() => {
    if (!svg) {
      message.warning('暂无图表');
      return;
    }
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid.svg`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('SVG 已下载');
  }, [svg]);

  const downloadPNG = useCallback(() => {
    if (!svg) {
      message.warning('暂无图表');
      return;
    }
    try {
      const { w, h } = getSvgSize(svg);
      // 将 SVG 转为 base64 data URL，避免 canvas 被污染
      const encoded = btoa(unescape(encodeURIComponent(svg)));
      const url = `data:image/svg+xml;base64,${encoded}`;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = 2; // 2 倍图，提升清晰度
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, w, h);
        // URL.revokeObjectURL(url);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            message.error('PNG 生成失败');
            return;
          }
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `mermaid.png`;
          a.click();
          URL.revokeObjectURL(pngUrl);
          message.success('PNG 已下载');
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        message.error('PNG 生成失败：图片加载失败');
      };
      img.src = url;
    } catch (e) {
      message.error(`PNG 生成失败：${e?.message || e}`);
    }
  }, [svg]);

  const downloadMenu = {
    items: [
      { key: 'svg', label: '下载 SVG' },
      { key: 'png', label: '下载 PNG' },
    ],
    onClick: ({ key }) => (key === 'svg' ? downloadSVG() : downloadPNG()),
  };

  const hasDiagram = !!svg;

  return (
    <div className={style.rightPane}>
      <div className={style.paneHeader}>
        <span className={style.paneTitle}>
          图表预览
          {!hasDiagram && source.trim() && <span className={style.subHint}>渲染中…</span>}
        </span>
        <Space size={6} wrap>
          <Tooltip title="放大">
            <Button size="small" icon={<PlusOutlined />} onClick={() => handleAction('zoomIn')} disabled={!hasDiagram} />
          </Tooltip>
          <Tooltip title="缩小">
            <Button size="small" icon={<MinusOutlined />} onClick={() => handleAction('zoomOut')} disabled={!hasDiagram} />
          </Tooltip>
          <Tooltip title="重置">
            <Button size="small" icon={<AimOutlined />} onClick={() => handleAction('reset')} disabled={!hasDiagram} />
          </Tooltip>
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              size="small"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => handleAction('toggleFullscreen')}
              disabled={!hasDiagram}
            />
          </Tooltip>
          <Dropdown menu={downloadMenu} trigger={['click']} disabled={!hasDiagram}>
            <Button size="small" icon={<DownloadOutlined />} disabled={!hasDiagram}>
              下载
            </Button>
          </Dropdown>
          <Select
            size="small"
            value={theme}
            onChange={onThemeChange}
            options={THEME_OPTIONS}
            style={{ width: 86 }}
            popupMatchSelectWidth={false}
          />
        </Space>
      </div>


      <div dangerouslySetInnerHTML={{ __html: svg || '' }} />
      <div className={style.previewWrap}>
        {error && <div className={style.errorTip}>⚠️ {error}</div>}
        <div ref={wrapperRef} className={style.previewCanvas}>
          <div ref={contentRef} className={style.previewContent} dangerouslySetInnerHTML={{ __html: svg || '' }} />
          {!hasDiagram && !error && (
            <div className={style.emptyTip}>
              {source.trim() ? '渲染中…' : '← 在左侧输入 Mermaid 源码'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
