import React, { useState } from 'react';
import { DeleteOutlined, SearchOutlined, EditOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, SyncOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import { useLocale } from '../../i18n';
import './index.less';

// 从相框 style 中提取主色（border 颜色），用于卡片顶部色条
const extractFrameColor = (style) => {
  if (!style?.border) return null;
  const match = style.border.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/);
  return match ? match[0] : null;
};

/**
 * 模板卡片
 *
 * 操作按钮区（编辑/删除）统一放在 body 下方，hover 时显示，
 * 避免与 color-bar 上的选中勾章重叠。
 * 支持：自定义模板（编辑名称/描述 + 删除）、系统模板管理员模式（编辑 + 删除）
 */
const TemplateCard = ({
  frame,
  isCustom,
  isAdmin,
  isSystemEditable,
  isActive,
  theme,
  onApply,
  onDelete,
  onEdit,
  onSyncCanvas,
}) => {
  const { t } = useLocale();
  const frameColor = extractFrameColor(frame.style);
  const elementCount = frame.elements?.length ?? 0;
  const showActions = isCustom || (isSystemEditable && isAdmin);

  return (
    <div
      className={`template-card ${isActive ? 'template-card--active' : 'template-card--inactive'}`}
      onClick={() => onApply(frame)}
      style={{
        background: theme.bgTertiary,
        boxShadow: isActive
          ? '0 0 0 2px #007AFF, 0 0 12px rgba(0, 122, 255, 0.15)'
          : undefined,
      }}
    >
      {/* 顶部预览色条 */}
      <div
        className="template-card__color-bar"
        style={{
          background: frameColor
            ? `linear-gradient(135deg, ${frameColor}cc, ${frameColor}44)`
            : `linear-gradient(135deg, ${theme.border}99, ${theme.border}33)`,
        }}
      >
        <div
          className={`template-card__canvas-mock ${isActive ? 'template-card__canvas-mock--active' : ''}`}
          style={{ background: theme.bgPrimary, borderColor: frameColor || theme.border }}
        />
        {isActive && (
          <div className="template-card__check-badge">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {isCustom && <span className="template-card__custom-badge">{t('template.custom')}</span>}
      </div>

      {/* 底部文字信息 */}
      <div className="template-card__body">
        <div className="template-card__name" style={{ color: isActive ? '#007AFF' : theme.textPrimary }}>
          {frame.label}
        </div>
        {frame.desc && (
          <div className="template-card__desc" style={{ color: theme.textMuted }}>
            {frame.desc}
          </div>
        )}
        <div className="template-card__meta">
          {elementCount > 0 && (
            <span className="template-card__dot-count" style={{ color: '#007AFF' }}>
              <span className="template-card__dot" />
              {elementCount}
            </span>
          )}
          {isCustom && frame.createdAt && (
            <span className="template-card__created-at" style={{ color: theme.textMuted }}>
              {frame.createdAt}
            </span>
          )}
        </div>
      </div>

      {/* 操作区（hover 时显示，放在 body 下方，不与 color-bar 内容重叠） */}
      {showActions && (
        <div className="template-card__actions" onClick={(e) => e.stopPropagation()}>
          {/* 用画布内容覆盖（仅系统模板管理员模式） */}
          {onSyncCanvas && (
            <Popconfirm
              title={t('admin.syncCanvasConfirm')}
              onConfirm={() => onSyncCanvas(frame.id)}
              okText={t('admin.confirmOk')}
              cancelText={t('admin.confirmCancel')}
              placement="top"
            >
              <button
                type="button"
                className="template-card__action-btn template-card__action-btn--sync"
                style={{ color: theme.textSecondary }}
                title={t('admin.syncCanvas')}
                onClick={(e) => e.stopPropagation()}
              >
                <SyncOutlined />
              </button>
            </Popconfirm>
          )}
          {/* 编辑名称/描述 */}
          {onEdit && (
            <button
              type="button"
              className="template-card__action-btn"
              style={{ color: theme.textSecondary }}
              title={t('admin.editTemplate')}
              onClick={(e) => { e.stopPropagation(); onEdit(frame); }}
            >
              <EditOutlined />
            </button>
          )}
          {/* 删除 */}
          {onDelete && (
            <Popconfirm
              title={isCustom ? t('template.deleteTitle') : t('admin.deleteConfirm')}
              onConfirm={() => onDelete(frame.id)}
              okText={t('admin.confirmOk')}
              cancelText={t('admin.confirmCancel')}
              placement="top"
            >
              <button
                type="button"
                className="template-card__action-btn template-card__action-btn--danger"
                style={{ color: theme.textSecondary }}
                title={t('template.deleteTitle')}
                onClick={(e) => e.stopPropagation()}
              >
                <DeleteOutlined />
              </button>
            </Popconfirm>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 内联编辑表单（新拟物风格）
 * 用于自定义模板和系统模板的名称/描述修改
 */
const InlineEditForm = ({ initialLabel, initialDesc, theme, onConfirm, onCancel }) => {
  const { t } = useLocale();
  const [label, setLabel] = useState(initialLabel || '');
  const [desc, setDesc] = useState(initialDesc || '');

  const handleConfirm = () => {
    if (!label.trim()) return;
    onConfirm({ label: label.trim(), desc: desc.trim() });
  };

  return (
    <div className="template-panel__inline-form" style={{ background: theme.bgTertiary, borderColor: theme.borderLight }}>
      <input
        className="template-panel__save-input"
        style={{ color: theme.textPrimary }}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t('admin.templateNamePlaceholder')}
        onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel(); }}
        autoFocus
      />
      <input
        className="template-panel__save-input"
        style={{ color: theme.textPrimary, marginTop: 6 }}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder={t('admin.templateDescPlaceholder')}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      />
      <div className="template-panel__inline-form-actions">
        <button
          type="button"
          className="template-panel__save-toggle-btn"
          style={{ color: theme.accent }}
          onClick={handleConfirm}
          disabled={!label.trim()}
        >
          <CheckOutlined style={{ marginRight: 4 }} />
          {t('admin.confirmOk')}
        </button>
        <button
          type="button"
          className="template-panel__save-toggle-btn"
          style={{ color: theme.textMuted }}
          onClick={onCancel}
        >
          <CloseOutlined style={{ marginRight: 4 }} />
          {t('admin.confirmCancel')}
        </button>
      </div>
    </div>
  );
};

/**
 * 模板面板
 */
const TemplatePanel = ({
  theme,
  isDark,
  activeFrame,
  customTemplates,
  saveTemplateName,
  setSaveTemplateName,
  showSaveInput,
  setShowSaveInput,
  saveCurrentAsTemplate,
  deleteCustomTemplate,
  updateCustomTemplate,
  applyTemplate,
  isAdmin,
  systemTemplates,
  onAddSystemTemplate,
  onUpdateSystemTemplate,
  onDeleteSystemTemplate,
  onResetSystemTemplates,
  elements,
  canvasRef,
  canvasRatio,
  currentFrame,
}) => {
  const { t } = useLocale();
  const [systemSearchKeyword, setSystemSearchKeyword] = useState('');

  // 正在内联编辑的模板 id（自定义 or 系统）
  const [editingId, setEditingId] = useState(null);
  // 管理员新增模式
  const [isAdding, setIsAdding] = useState(false);

  const filteredSystemTemplates = systemSearchKeyword.trim()
    ? systemTemplates.filter((frame) => {
        const keyword = systemSearchKeyword.trim().toLowerCase();
        return (
          frame.label?.toLowerCase().includes(keyword) ||
          frame.desc?.toLowerCase().includes(keyword)
        );
      })
    : systemTemplates;

  // ── 自定义模板编辑 ───────────────────────────────────────────────────────
  const handleCustomEdit = (frame) => {
    setEditingId(frame.id);
    setIsAdding(false);
  };

  const handleCustomEditConfirm = (id, data) => {
    updateCustomTemplate(id, { label: data.label, desc: data.desc });
    setEditingId(null);
  };

  // ── 系统模板编辑（只修改名称/描述，不动画布内容） ─────────────────────
  const handleSystemEdit = (frame) => {
    setEditingId(frame.id);
    setIsAdding(false);
  };

  const handleSystemEditConfirm = (id, data) => {
    // 只更新名称和描述，保留原有 elements
    const originalTemplate = systemTemplates.find((f) => f.id === id);
    onUpdateSystemTemplate(id, {
      label: data.label,
      desc: data.desc,
      elements: originalTemplate?.elements || [],
    });
    setEditingId(null);
  };

  // ── 用当前画布内容同步覆盖系统模板（🔄 按钮触发） ───────────────────────
  const handleSyncCanvas = (id) => {
    const canvasDom = canvasRef.current;
    const canvasW = canvasDom ? canvasDom.getBoundingClientRect().width : 600;
    const canvasH = canvasDom ? canvasDom.getBoundingClientRect().height : 450;
    const templateElements = (elements || [])
      .filter((el) => el.type === 'text')
      .map((el) => ({
        type: 'text',
        rx: el.x / canvasW,
        ry: el.y / canvasH,
        rw: el.width / canvasW,
        rh: el.height / canvasH,
        textProps: { ...el.textProps },
      }));
    const originalTemplate = systemTemplates.find((f) => f.id === id);
    onUpdateSystemTemplate(id, {
      label: originalTemplate?.label || '',
      desc: originalTemplate?.desc || '',
      elements: templateElements,
    });
  };

  // ── 系统模板新增（用当前画布内容） ─────────────────────────────────────
  const handleAddConfirm = (data) => {
    const canvasDom = canvasRef.current;
    const canvasW = canvasDom ? canvasDom.getBoundingClientRect().width : 600;
    const canvasH = canvasDom ? canvasDom.getBoundingClientRect().height : 450;
    const templateElements = (elements || [])
      .filter((el) => el.type === 'text')
      .map((el) => ({
        type: 'text',
        rx: el.x / canvasW,
        ry: el.y / canvasH,
        rw: el.width / canvasW,
        rh: el.height / canvasH,
        textProps: { ...el.textProps },
      }));
    onAddSystemTemplate({
      label: data.label,
      desc: data.desc,
      elements: templateElements,
    });
    setIsAdding(false);
  };

  return (
    <div className="template-panel">
      {/* ── 自定义模板管理 ── */}
      <div className="template-panel__manager">
        <div className="template-panel__manager-header">
          <span className="template-panel__manager-title" style={{ color: theme.textPrimary }}>{t('template.title')}</span>
          <button
            type="button"
            onClick={() => { setShowSaveInput((v) => !v); setEditingId(null); }}
            disabled={customTemplates.length >= 10}
            className={`template-panel__save-toggle-btn ${showSaveInput ? 'template-panel__save-toggle-btn--active' : ''}`}
            style={{ color: showSaveInput ? theme.textMuted : theme.accent }}
          >
            {customTemplates.length >= 10
              ? t('template.full')
              : (showSaveInput ? t('template.cancel') : t('template.saveCurrent'))}
          </button>
        </div>
        {showSaveInput && (
          <div className="template-panel__save-row">
            <input
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCurrentAsTemplate()}
              placeholder={t('template.inputPlaceholder')}
              className="template-panel__save-input"
              style={{ color: theme.textPrimary }}
              autoFocus
            />
            <button
              type="button"
              className="template-panel__save-toggle-btn"
              style={{ color: theme.accent }}
              onClick={saveCurrentAsTemplate}
            >
              {t('template.save')}
            </button>
          </div>
        )}
        <div className="template-panel__hint" style={{ color: theme.textSecondary }}>
          {t('template.savedCount', { count: customTemplates.length })}
        </div>
      </div>

      {/* ── 自定义模板列表 ── */}
      {customTemplates.length > 0 && (
        <>
          <div className="template-panel__section-title" style={{ color: theme.textMuted }}>{t('template.myTemplates')}</div>
          <div className="template-panel__grid">
            {customTemplates.map((frame) => (
              editingId === frame.id ? (
                <div key={frame.id} className="template-panel__card-edit-wrap">
                  <InlineEditForm
                    initialLabel={frame.label}
                    initialDesc={frame.desc}
                    theme={theme}
                    onConfirm={(data) => handleCustomEditConfirm(frame.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <TemplateCard
                  key={frame.id}
                  frame={frame}
                  isCustom={true}
                  isAdmin={false}
                  isSystemEditable={false}
                  isActive={activeFrame === frame.id}
                  theme={theme}
                  isDark={isDark}
                  onApply={applyTemplate}
                  onDelete={deleteCustomTemplate}
                  onEdit={handleCustomEdit}
                />
              )
            ))}
          </div>
        </>
      )}

      {/* ── 系统模板区 ── */}
      <div className="template-panel__system-header">
        <div className="template-panel__section-title" style={{ color: theme.textMuted }}>{t('template.systemTemplates')}</div>
        <div
          className="template-panel__search-wrap"
          style={{ borderColor: theme.borderLight, background: theme.bgTertiary }}
        >
          <SearchOutlined style={{ color: theme.textMuted, fontSize: 12 }} />
          <input
            className="template-panel__search-input"
            style={{ color: theme.textPrimary, background: 'transparent' }}
            placeholder={t('template.searchPlaceholder')}
            value={systemSearchKeyword}
            onChange={(e) => setSystemSearchKeyword(e.target.value)}
          />
          {systemSearchKeyword && (
            <span
              className="template-panel__search-clear"
              style={{ color: theme.textMuted }}
              onClick={() => setSystemSearchKeyword('')}
            >
              ✕
            </span>
          )}
        </div>
      </div>

      {/* ── 管理员操作栏（新拟物风格按钮） ── */}
      {isAdmin && (
        <div className="template-panel__admin-bar">
          <button
            type="button"
            className="template-panel__save-toggle-btn template-panel__admin-add-btn"
            style={{ color: theme.accent }}
            onClick={() => { setIsAdding(true); setEditingId(null); }}
          >
            ＋ {t('admin.addTemplate')}
          </button>
          <Popconfirm
            title={t('admin.resetConfirm')}
            onConfirm={onResetSystemTemplates}
            okText={t('admin.confirmOk')}
            cancelText={t('admin.confirmCancel')}
            placement="bottom"
          >
            <button
              type="button"
              className="template-panel__save-toggle-btn"
              style={{ color: theme.textMuted }}
            >
              <ReloadOutlined style={{ marginRight: 4 }} />
              {t('admin.resetTemplates')}
            </button>
          </Popconfirm>
        </div>
      )}

      {/* 新增模板内联表单 */}
      {isAdmin && isAdding && (
        <div className="template-panel__card-edit-wrap" style={{ marginBottom: 12 }}>
          <div className="template-panel__add-hint" style={{ color: theme.textMuted }}>
            {t('admin.addHint')}
          </div>
          <InlineEditForm
            initialLabel=""
            initialDesc=""
            theme={theme}
            onConfirm={handleAddConfirm}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      <div className="template-panel__grid" style={{ marginBottom: 0 }}>
        {filteredSystemTemplates.length > 0 ? filteredSystemTemplates.map((frame) => (
          editingId === frame.id ? (
            <div key={frame.id} className="template-panel__card-edit-wrap">
              <InlineEditForm
                initialLabel={frame.label}
                initialDesc={frame.desc}
                theme={theme}
                onConfirm={(data) => handleSystemEditConfirm(frame.id, data)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <TemplateCard
              key={frame.id}
              frame={frame}
              isCustom={false}
              isAdmin={isAdmin}
              isSystemEditable={true}
              isActive={activeFrame === frame.id}
              theme={theme}
              isDark={isDark}
              onApply={applyTemplate}
              onDelete={onDeleteSystemTemplate}
              onEdit={handleSystemEdit}
              onSyncCanvas={isAdmin ? handleSyncCanvas : null}
            />
          )
        )) : (
          <div className="template-panel__search-empty" style={{ color: theme.textMuted }}>
            {t('template.searchEmpty')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePanel;
