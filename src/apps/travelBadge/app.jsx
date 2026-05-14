import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.less';
import { Button, ConfigProvider } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { FRAME_TEMPLATES } from './utils/constants';
import { useIsMobile } from './hooks/useIsMobile';
import { useTheme } from './hooks/useTheme';
import { useTemplates } from './hooks/useTemplates';
import { useFontTemplates } from './hooks/useFontTemplates';
import { useSystemTemplates } from './hooks/useSystemTemplates';
import { useSystemFontTemplates } from './hooks/useSystemFontTemplates';
import { createChangeZIndex, createAddImageElement, createAddTextElement } from './utils/canvasHelpers';
import { exportToImage } from './utils/exportCanvas';
import { loadRemoteFonts, REMOTE_FONTS } from './utils/fontLoader';
import PanelTabs from './components/panelTabs';
import PropsPanel from './components/propsPanel';
import TemplatePanel from './components/templatePanel';
import ImagePanel from './components/imagePanel';
import TextPanel from './components/textPanel';
import CanvasArea from './components/canvasArea';
import Fixed from '@components/Fixed';
import { AppTopBar, MobileHeader } from './components/appHeader';
import { LocaleProvider } from './i18n';
import handleContent from './handle.md'

// ─── 主应用 ───────────────────────────────────────────────────────────────────

const App = () => {
  const isMobile = useIsMobile();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const drawerDragStartRef = useRef(null);

  // 主题管理
  const { themeMode, setThemeMode, theme, isDark } = useTheme();

  // 管理员 mock（生产环境替换为真实鉴权）
  const [isAdmin, setIsAdmin] = useState(false);

  // 系统模板管理（管理员专用）
  const {
    systemTemplates,
    addSystemTemplate,
    updateSystemTemplate,
    deleteSystemTemplate,
  } = useSystemTemplates();

  // 核心状态
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeFrame, setActiveFrame] = useState('none');
  const [activeTab, setActiveTab] = useState('template');
  const [isExporting, setIsExporting] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');
  const [canvasRatio, setCanvasRatio] = useState(4 / 3);
  const [drawerHeight, setDrawerHeight] = useState(window.innerHeight / 2);
  const [guideLines, setGuideLines] = useState([]);

  const currentFrame = systemTemplates.find((f) => f.id === activeFrame);
  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // 模板管理
  const {
    customTemplates,
    saveTemplateName,
    setSaveTemplateName,
    showSaveInput,
    setShowSaveInput,
    saveCurrentAsTemplate,
    deleteCustomTemplate,
    updateCustomTemplate,
    applyTemplate,
  } = useTemplates({
    elements,
    canvasRef,
    canvasRatio,
    setElements,
    setActiveFrame,
  });

  // 字体模板管理
  const {
    customFontTemplates,
    saveFontTemplateName,
    setSaveFontTemplateName,
    showFontSaveInput,
    setShowFontSaveInput,
    saveCurrentAsFontTemplate,
    deleteCustomFontTemplate,
    updateFontTemplate,
  } = useFontTemplates({ selectedElement });

  // 系统字体模板管理
  const {
    systemFontTemplates,
    addSystemFontTemplate,
    updateSystemFontTemplate: updateSysFontTemplate,
    deleteSystemFontTemplate: deleteSysFontTemplate,
  } = useSystemFontTemplates();

  // 正在编辑的字体模板（从文字 Tab 点击编辑跳转过来时设置）
  const [editingFontTemplate, setEditingFontTemplate] = useState(null);

  const onEditFontTemplate = useCallback((fontTemplate) => {
    // 在画布中新增该模板的文字元素并选中，进入更新模式（属性区常驻，无需跳Tab）
    applyFontTemplate(fontTemplate);
    setEditingFontTemplate(fontTemplate);
    setShowFontSaveInput(true);
  }, [applyFontTemplate, setShowFontSaveInput]);

  // 加载远程字体
  useEffect(() => {
    loadRemoteFonts(REMOTE_FONTS).catch(err => {
      console.warn('远程字体加载失败:', err);
    });
  }, []);

  // 点击画布区域外且不在右侧面板内时自动失焦
  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      const canvas = canvasRef.current;
      const panel = panelRef.current;
      const inCanvas = canvas && canvas.contains(event.target);
      const inPanel = panel && panel.contains(event.target);
      const inPopup = event.target.closest(
        '.ant-select-dropdown, .ant-dropdown, .ant-picker-dropdown, .ant-tooltip, .ant-color-picker, .ant-popover, .ant-float-btn'
      );
      if (!inCanvas && !inPanel && !inPopup) {
        setSelectedId(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, []);

  // 元素操作
  const updateElement = useCallback((id, patch) => {
    setElements((prev) => prev.map((el) => el.id === id ? { ...el, ...patch } : el));
  }, []);

  const deleteElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
  }, []);

  const selectElement = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const changeZIndex = useCallback(createChangeZIndex(setElements), []);
  const addImageElement = useCallback(
    createAddImageElement(setElements, setCanvasRatio, setSelectedId, canvasRef),
    []
  );
  const addTextElement = useCallback(createAddTextElement(setElements, setSelectedId), []);

  // 应用字体模板：选中文字元素时更新 textProps，否则新建文字元素
  const applyFontTemplate = useCallback((fontTemplate) => {
    if (selectedId) {
      const selectedEl = elements.find((el) => el.id === selectedId);
      if (selectedEl && selectedEl.type === 'text') {
        setElements((prev) => prev.map((el) =>
          el.id === selectedId
            ? { ...el, textProps: { ...el.textProps, ...fontTemplate.textProps } }
            : el
        ));
        return;
      }
    }
    // 没有选中文字元素时，新建一个文字元素并应用模板
    setElements((prev) => {
      const maxZ = prev.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
      const newEl = {
        id: `el-${Date.now()}`,
        type: 'text',
        x: 60,
        y: 60,
        width: 240,
        height: 70,
        zIndex: maxZ + 100,
        textProps: { ...fontTemplate.textProps, content: '点击编辑文字' },
      };
      setSelectedId(newEl.id);
      return [...prev, newEl];
    });
  }, [selectedId, elements]);

  // 文件上传
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => addImageElement(e.target.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  }, [addImageElement]);

  // 导出
  const handleExport = useCallback(async () => {
    const canvasDom = canvasRef.current;
    if (!canvasDom) return;
    setIsExporting(true);
    setSelectedId(null);

    try {
      const rect = canvasDom.getBoundingClientRect();
      await exportToImage({
        elements,
        backgroundColor: canvasBackground,
        canvasWidth: rect.width,
        canvasHeight: rect.height,
        scale: 2,
      });
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请检查控制台');
    } finally {
      setIsExporting(false);
    }
  }, [elements, canvasBackground, currentFrame]);

  // 移动端抽屉拖拽调整高度
  const handleDrawerDragStart = useCallback((event) => {
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    drawerDragStartRef.current = { startY: clientY, startHeight: drawerHeight };

    const onMove = (moveEvent) => {
      const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const delta = drawerDragStartRef.current.startY - currentY;
      const newHeight = Math.max(60, Math.min(window.innerHeight * 0.85, drawerDragStartRef.current.startHeight + delta));
      setDrawerHeight(newHeight);
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [drawerHeight]);

  // 面板内容渲染
  const renderPanelContent = () => {
    switch (activeTab) {
      case 'template':
        return (
          <TemplatePanel
            theme={theme}
            isDark={isDark}
            activeFrame={activeFrame}
            customTemplates={customTemplates}
            deleteCustomTemplate={deleteCustomTemplate}
            updateCustomTemplate={updateCustomTemplate}
            applyTemplate={applyTemplate}
            isAdmin={isAdmin}
            systemTemplates={systemTemplates}
            onAddSystemTemplate={addSystemTemplate}
            onUpdateSystemTemplate={updateSystemTemplate}
            onDeleteSystemTemplate={deleteSystemTemplate}
            elements={elements}
            canvasRef={canvasRef}
            canvasRatio={canvasRatio}
            currentFrame={currentFrame}
          />
        );
      case 'image':
        return (
          <ImagePanel
            theme={theme}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            addImageElement={addImageElement}
          />
        );
      case 'text':
        return (
          <TextPanel
            theme={theme}
            addTextElement={addTextElement}
            customFontTemplates={customFontTemplates}
            onApplyFontTemplate={applyFontTemplate}
            deleteCustomFontTemplate={deleteCustomFontTemplate}
            onEditFontTemplate={onEditFontTemplate}
            isAdmin={isAdmin}
            systemFontTemplates={systemFontTemplates}
            onAddSystemFontTemplate={addSystemFontTemplate}
            onUpdateSystemFontTemplate={updateSysFontTemplate}
            onDeleteSystemFontTemplate={deleteSysFontTemplate}
            selectedElement={selectedElement}
          />
        );
      default:
        return null;
    }
  };

  // 画布容器样式（背景色，不应用模板相框样式）
  // 移动端：画布高度不超过空状态时的高度（即宽度 × 3/4），竖图超出时画布保持此上限，图片用 contain 显示
  const canvasWrapStyle = {
    position: 'relative',
    width: isMobile ? '100%' : 'min(600px, 100%)',
    aspectRatio: `${canvasRatio}`,
    ...(isMobile && canvasRatio < 1 ? { maxHeight: `calc(100vw * 3 / 4)` } : {}),
    background: canvasBackground,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  // ── 渲染 ──────────────────────────────────────────────────────────────────

  return (
    <ConfigProvider locale={zhCN}>
      {/* 全局隐藏的文件上传 input，始终挂载，确保任意 tab 下都可触发上传 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <div
        className={`app-root ${isMobile ? 'app-root--mobile' : 'app-root--desktop'} ${isDark ? 'app-root--dark' : ''}`}
        style={{
          background: theme.bgPrimary,
          '--nm-shadow-dark': theme.shadowDark,
          '--nm-shadow-light': theme.shadowLight,
        }}
      >
        {/* 全局顶部栏（仅 PC 端显示） */}
        {!isMobile && <AppTopBar theme={theme} themeMode={themeMode} onThemeModeChange={setThemeMode} isAdmin={isAdmin} onToggleAdmin={setIsAdmin} />}

        {/* 主内容区（顶部栏下方） */}
        <div className={`app-main ${isMobile ? 'app-main--mobile' : 'app-main--desktop'}`}>

        {/* 移动端顶部标题栏 */}
        {isMobile && (
          <MobileHeader
            theme={theme}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            canvasBackground={canvasBackground}
            onCanvasBackgroundChange={setCanvasBackground}
            isExporting={isExporting}
            onExport={handleExport}
            isAdmin={isAdmin}
            onToggleAdmin={setIsAdmin}
          />
        )}

        {/* 画布编辑区（PC 端：主题胶囊通过 slot 注入工具栏左侧） */}
        <CanvasArea
          isMobile={isMobile}
          theme={theme}
          isExporting={isExporting}
          handleExport={handleExport}
          canvasRef={canvasRef}
          canvasWrapStyle={canvasWrapStyle}
          elements={elements}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          selectElement={selectElement}
          updateElement={updateElement}
          changeZIndex={changeZIndex}
          deleteElement={deleteElement}
          canvasBackground={canvasBackground}
          setCanvasBackground={setCanvasBackground}
          guideLines={guideLines}
          onDragGuideLines={setGuideLines}
          fileInputRef={fileInputRef}
          onUploadImage={() => fileInputRef.current?.click()}
        />

        {/* PC 端右侧操作面板 */}
        {!isMobile && (
          <div
            ref={panelRef}
            className="side-panel"
            style={{ background: theme.bgSecondary, borderLeft: `1px solid ${theme.border}` }}
          >
            {/* 属性浮层：绝对定位向左展开，不挤压布局 */}
            {selectedElement && (
              <div
                className="side-panel__props-drawer"
                style={{ background: theme.bgSecondary, borderRight: `1px solid ${theme.border}` }}
              >
                <div className="side-panel__props-drawer-header" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <span className="side-panel__props-drawer-title" style={{ color: theme.textPrimary }}>
                    {selectedElement.type === 'text' ? '文字属性' : '图片属性'}
                  </span>
                </div>
                <div className="side-panel__props-drawer-body">
                  <PropsPanel
                    selectedElement={selectedElement}
                    onUpdate={updateElement}
                    onDelete={deleteElement}
                    onZIndexChange={changeZIndex}
                    theme={theme}
                    fontTemplateProps={{
                      customFontTemplates,
                      saveFontTemplateName,
                      setSaveFontTemplateName,
                      showFontSaveInput,
                      setShowFontSaveInput,
                      saveCurrentAsFontTemplate,
                      updateFontTemplate,
                      editingFontTemplate,
                      setEditingFontTemplate,
                    }}
                  />
                </div>
              </div>
            )}
            <PanelTabs activeTab={activeTab} onChange={setActiveTab} isMobile={false} theme={theme} />
            {/* Tab 内容区（可滚动） */}
            <div className="side-panel__content">
              {renderPanelContent()}
            </div>
          </div>
        )}

        {/* 移动端底部抽屉（浮层，不挤压画布） */}
        {isMobile && (
          <div
            ref={panelRef}
            className="mobile-drawer"
            style={{
              height: drawerHeight,
              background: theme.bgSecondary,
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            {/* 拖拽把手 */}
            <div
              className="mobile-drawer__handle-bar"
              onMouseDown={handleDrawerDragStart}
              onTouchStart={handleDrawerDragStart}
            >
              <div className="mobile-drawer__handle-pill" />
            </div>

            {/* 选中元素时：抽屉整体切换为属性视图 */}
            {selectedElement ? (
              <>
                {/* 属性视图顶栏：返回按钮 + 标题 */}
                <div
                  className="mobile-drawer__props-header"
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                >
                  <button
                    type="button"
                    className="mobile-drawer__props-back-btn"
                    style={{ color: theme.accent }}
                    onClick={() => setSelectedId(null)}
                  >
                    <LeftOutlined /> 返回
                  </button>
                  <span className="mobile-drawer__props-title" style={{ color: theme.textPrimary }}>
                    {selectedElement.type === 'text' ? '文字属性' : '图片属性'}
                  </span>
                  <div style={{ width: 52 }} />
                </div>
                {/* 属性内容区（可滚动，充分利用整个抽屉高度） */}
                <div className="mobile-drawer__content">
                  <PropsPanel
                    selectedElement={selectedElement}
                    onUpdate={updateElement}
                    onDelete={deleteElement}
                    onZIndexChange={changeZIndex}
                    theme={theme}
                    fontTemplateProps={{
                      customFontTemplates,
                      saveFontTemplateName,
                      setSaveFontTemplateName,
                      showFontSaveInput,
                      setShowFontSaveInput,
                      saveCurrentAsFontTemplate,
                      updateFontTemplate,
                      editingFontTemplate,
                      setEditingFontTemplate,
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* 未选中时：正常 Tab 视图 */}
                <PanelTabs activeTab={activeTab} onChange={setActiveTab} isMobile={true} theme={theme} />
                <div className="mobile-drawer__content">
                  {renderPanelContent()}
                </div>
              </>
            )}
          </div>
        )}
        </div>{/* end app-main */}
      </div>
      <Fixed homeUrl="/tool" handleContent={handleContent} position="left" />
    </ConfigProvider>
  );
};

const AppWithLocale = () => (
  <LocaleProvider>
    <App />
  </LocaleProvider>
);

export default AppWithLocale;
