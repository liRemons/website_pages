import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, message, Space, Divider, Select, Checkbox, Input } from 'antd';
import {
  DeleteOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import ReactJson from '@microlink/react-json-view';
import JSON5 from 'json5';
import Container from '@components/Container';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import '@assets/css/index.global.less';
import style from './index.module.less';
import handleContent from '../handle.md'

// 递归将字符串类型的值尝试解析为 JSON（自解析序列化 JSON）
function autoParseStringValues(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 2) {
      try {
        const parsed = JSON.parse(trimmed);
        return autoParseStringValues(parsed);
      } catch {
        // 不是合法 JSON，保留原字符串
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(autoParseStringValues);
  }
  if (value !== null && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = autoParseStringValues(value[key]);
    }
    return result;
  }
  return value;
}

export default function List() {
  const [inputText, setInputText] = useState('');
  const [parsedJson, setParsedJson] = useState(undefined);
  const [parseError, setParseError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [collapsedLevel, setCollapsedLevel] = useState(1);
  const [theme, setTheme] = useState('rjv-default');
  const [viewerNoWrap, setViewerNoWrap] = useState(false);
  const [autoExpand, setAutoExpand] = useState(true);
  const debounceTimer = useRef(null);
  const textareaRef = useRef(null);
  const treeWrapRef = useRef(null);
  const [jsonVersion, setJsonVersion] = useState(0);

  // 气泡编辑状态：{ namespace, editValue, x, y }
  const [editBubble, setEditBubble] = useState(null);
  const editInputRef = useRef(null);
  const editBubbleRef = useRef(null);

  // 记录右键触发时选中的节点信息，供右键弹出气泡使用
  const lastSelectedNode = useRef(null);

  // 点击气泡外部时关闭气泡
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editBubbleRef.current && !editBubbleRef.current.contains(e.target)) {
        setEditBubble(null);
      }
    };
    if (editBubble) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editBubble]);

  // onSelect 回调：记录节点信息，不直接弹气泡
  const handleRjvSelect = useCallback((selection) => {
    const fullNamespace = [
      ...selection.namespace,
      ...(selection.name !== null && selection.name !== undefined ? [selection.name] : []),
    ];
    const rawValue = selection.value;
    const editValue = rawValue !== null && typeof rawValue === 'object'
      ? JSON.stringify(rawValue, null, 2)
      : String(rawValue ?? '');
    lastSelectedNode.current = { namespace: fullNamespace, editValue };
  }, []);

  // 右键回调：先触发当前节点选择，再用选中信息弹出气泡
  const handleTreeContextMenu = useCallback((e) => {
    e.preventDefault();

    lastSelectedNode.current = null;
    e.target.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }));

    if (!lastSelectedNode.current) return;

    const { namespace, editValue } = lastSelectedNode.current;
    const x = e.clientX;
    const y = e.clientY;
    setEditBubble({ namespace, editValue, x, y });
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, []);

  const THEME_OPTIONS = [
    { value: 'rjv-default', label: '默认' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'twilight', label: 'Twilight' },
    { value: 'monokai', label: 'Monokai' },
    { value: 'solarized', label: 'Solarized' },
    { value: 'ocean', label: 'Ocean' },
    { value: 'google', label: 'Google' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'harmonic', label: 'Harmonic' },
  ];

  const parseJson = useCallback((text, shouldAutoExpand) => {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      setParsedJson(undefined);
      setParseError('');
      setIsParsing(false);
      return;
    }
    try {
      const raw = JSON5.parse(trimmed);
      const result = shouldAutoExpand ? autoParseStringValues(raw) : raw;
      setJsonVersion((v) => v + 1);
      setParsedJson(result);
      setParseError('');
    } catch (error) {
      setParsedJson(undefined);
      setParseError(error.message);
    }
    setIsParsing(false);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setIsParsing(true);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => parseJson(text, autoExpand), 500);
  };

  const handleClear = () => {
    setInputText('');
    setParsedJson(undefined);
    setParseError('');
  };

  const applyTextTransform = (transformFn, successMsg) => {
    if (!inputText.trim()) return;
    try {
      const transformed = transformFn(inputText);
      setInputText(transformed);
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => parseJson(transformed, autoExpand), 500);
      message.success(successMsg);
    } catch (error) {
      message.error(`操作失败：${error.message}`);
    }
  };

  const handleUniEncode = () =>
    applyTextTransform(
      (text) => text.replace(/[\u0080-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`),
      'Unicode 编码完成'
    );

  const handleUniDecode = () =>
    applyTextTransform(
      (text) => text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))),
      'Unicode 解码完成'
    );

  const handleUrlDecode = () =>
    applyTextTransform((text) => decodeURIComponent(text), 'URL 解码完成');

  const handleAutoExpandChange = (checked) => {
    setAutoExpand(checked);
    if (inputText.trim()) parseJson(inputText, checked);
  };

  // 深度设置/删除 JSON 某个路径的值
  const setValueAtPath = (obj, namespace, newValue, shouldDelete) => {
    if (!namespace || namespace.length === 0) return obj;
    const cloned = Array.isArray(obj) ? [...obj] : { ...obj };
    const [head, ...rest] = namespace;
    if (rest.length === 0) {
      if (shouldDelete) {
        if (Array.isArray(cloned)) cloned.splice(Number(head), 1);
        else delete cloned[head];
      } else {
        cloned[head] = newValue;
      }
    } else {
      cloned[head] = setValueAtPath(cloned[head], rest, newValue, shouldDelete);
    }
    return cloned;
  };

  const handleEditConfirm = () => {
    if (!editBubble) return;
    const { namespace, editValue } = editBubble;
    let parsedValue;
    try {
      parsedValue = JSON5.parse(editValue);
    } catch {
      parsedValue = editValue;
    }
    const updated = setValueAtPath(parsedJson, namespace, parsedValue, false);
    const newText = JSON.stringify(updated, null, 2);
    setInputText(newText);
    setParsedJson(updated);
    setEditBubble(null);
  };

  const handleDeleteConfirm = () => {
    if (!editBubble) return;
    const updated = setValueAtPath(parsedJson, editBubble.namespace, undefined, true);
    const newText = JSON.stringify(updated, null, 2);
    setInputText(newText);
    setParsedJson(updated);
    setEditBubble(null);
  };

  return (
    <>
      <Container
        header={<Header name="JSON 解析器" handleContent={handleContent} leftPath={`/${APP_NAME}/tool`} />}
        main={
          <div className={style.page}>
            {/* 操作说明 tips */}
            <div className={style.tipsBar}>
              💡 <strong>操作说明：</strong>右键节点弹出编辑 / 删除操作
            </div>

            {/* 左右两栏 */}
            <div className={style.panesRow}>
              {/* 左栏：输入区 */}
              <div className={style.leftPane}>
                <div className={style.paneHeader}>
                  <span className={style.paneTitle}>输入</span>
                  <Space size={4} wrap>
                    <Divider type="vertical" style={{ margin: '0 2px' }} />
                    <Button size="small" onClick={handleUniEncode}>Uni 编码</Button>
                    <Button size="small" onClick={handleUniDecode}>Uni 解码</Button>
                    <Button size="small" onClick={handleUrlDecode}>URL 解码</Button>
                    <Divider type="vertical" style={{ margin: '0 2px' }} />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={handleClear}>清空</Button>
                  </Space>
                </div>
                <div className={style.editorWrap}>
                  <textarea
                    ref={textareaRef}
                    className={style.textarea}
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder='请输入 JSON 内容，支持 JSON5（注释、尾随逗号）...'
                    spellCheck={false}
                  />
                </div>
                {parseError && <div className={style.errorTip}>⚠️ {parseError}</div>}
              </div>

              {/* 右栏：展示区 */}
              <div className={style.rightPane}>
                <div className={style.paneHeader}>
                  <span className={style.paneTitle}>
                    解析结果
                    {isParsing && <span className={style.parsingTip}>解析中…</span>}
                  </span>
                  <Space size={6} wrap>
                    <Checkbox checked={viewerNoWrap} onChange={(e) => setViewerNoWrap(e.target.checked)}>不换行</Checkbox>
                    <Checkbox checked={autoExpand} onChange={(e) => handleAutoExpandChange(e.target.checked)}>自解析</Checkbox>
                    <Select
                      size="small"
                      value={theme}
                      onChange={setTheme}
                      options={THEME_OPTIONS}
                      style={{ width: 110 }}
                      popupMatchSelectWidth={false}
                    />
                    {parsedJson !== undefined && (
                      <Button
                        size="small"
                        icon={collapsedLevel !== false ? <ExpandAltOutlined /> : <ShrinkOutlined />}
                        onClick={() => {
                          const nextLevel = collapsedLevel !== false ? false : 1;
                          setCollapsedLevel(nextLevel);
                          setJsonVersion((v) => v + 1);
                        }}
                      >
                        {collapsedLevel !== false ? '展开全部' : '折叠全部'}
                      </Button>
                    )}
                  </Space>
                </div>
                <div className={`${style.viewerWrap} ${viewerNoWrap ? style.viewerNoWrap : ''}`}>
                  {parsedJson !== undefined ? (
                    <div
                      ref={treeWrapRef}
                      className={style.treeViewInner}
                      onContextMenu={handleTreeContextMenu}
                    >
                      <ReactJson
                        key={jsonVersion}
                        src={parsedJson}
                        collapsed={collapsedLevel}
                        enableClipboard
                        displayDataTypes={false}
                        displayObjectSize={false}
                        name={false}
                        theme={theme}
                        iconStyle="triangle"
                        onSelect={handleRjvSelect}
                        style={{ fontSize: 13, lineHeight: 1.7, fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace", background: 'transparent', padding: '10px 12px' }}
                      />
                    </div>
                  ) : (
                    <div className={style.emptyTip}>
                      {parseError ? '⚠️ JSON 解析失败，请检查输入内容' : '← 在左侧输入 JSON 内容'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />
      <Fixed />

      {/* 跟随鼠标坐标的气泡编辑浮层 */}
      {editBubble && (
        <div
          ref={editBubbleRef}
          className={style.editBubble}
          style={{
            position: 'fixed',
            left: Math.min(editBubble.x + 12, window.innerWidth - 316),
            top: Math.min(editBubble.y + 12, window.innerHeight - 220),
            zIndex: 9999,
          }}
        >
          <div className={style.editBubblePath}>
            {editBubble.namespace.join(' › ')}
          </div>
          <Input.TextArea
            ref={editInputRef}
            className={style.editBubbleInput}
            value={editBubble.editValue}
            autoSize={{ minRows: 1, maxRows: 8 }}
            onChange={(e) => setEditBubble((prev) => ({ ...prev, editValue: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEditConfirm();
              if (e.key === 'Escape') setEditBubble(null);
            }}
          />
          <div className={style.editBubbleActions}>
            <Button size="small" danger onClick={handleDeleteConfirm}>
              删除节点
            </Button>
            <Space size={6}>
              <Button size="small" onClick={() => setEditBubble(null)}>取消</Button>
              <Button size="small" type="primary" onClick={handleEditConfirm}>确认 ⌘↵</Button>
            </Space>
          </div>
        </div>
      )}
    </>
  );
}
