import React, { useState } from 'react';
import { DeleteOutlined, SearchOutlined, EditOutlined, CheckOutlined, CloseOutlined, SyncOutlined } from '@ant-design/icons';
import { Popconfirm, Modal } from 'antd';
import { useLocale } from '../../i18n';
import { captureCanvasCover } from '../../utils/exportCanvas';
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
      {/* 顶部预览区域 */}
      <div
        className="template-card__color-bar"
        style={{
          background: frame.coverUrl
            ? `${theme.bgTertiary} url(${frame.coverUrl}) center/contain no-repeat`
            : frameColor
              ? `linear-gradient(135deg, ${frameColor}cc, ${frameColor}44)`
              : `linear-gradient(135deg, ${theme.border}99, ${theme.border}33)`,
        }}
      >
        {!frame.coverUrl && (
          <div
            className={`template-card__canvas-mock ${isActive ? 'template-card__canvas-mock--active' : ''}`}
            style={{ background: theme.bgPrimary, borderColor: frameColor || theme.border }}
          />
        )}
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
  deleteCustomTemplate,
  updateCustomTemplate,
  applyTemplate,
  isAdmin,
  systemTemplates,
  onAddSystemTemplate,
  onUpdateSystemTemplate,
  onDeleteSystemTemplate,
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

  // ── 应用模板前确认（画布有内容时提示） ──────────────────────────────────
  const safeApplyTemplate = (frame) => {
    if (elements && elements.length > 0) {
      Modal.confirm({
        title: '应用模板',
        content: '当前画布已有内容，应用模板将覆盖现有内容，确定继续？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => applyTemplate(frame),
      });
    } else {
      applyTemplate(frame);
    }
  };

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
  const handleSyncCanvas = async (id) => {
    const canvasDom = canvasRef.current;
    const canvasW = canvasDom ? canvasDom.getBoundingClientRect().width : 600;
    const canvasH = canvasDom ? canvasDom.getBoundingClientRect().height : 450;

    const templateElements = (elements || []).map((el) => {
      const { id: _id, ...rest } = el;
      if (rest.type === 'image') {
        const { url, ...others } = rest;
        return { ...others, src: url };
      }
      return rest;
    });

    // 重新截取画布生成封面缩略图
    let coverBlob = null;
    try {
      coverBlob = await captureCanvasCover({
        elements: elements || [],
        backgroundColor: '#ffffff',
        canvasWidth: canvasW,
        canvasHeight: canvasH,
      });
    } catch { /* 封面截图失败不阻塞更新 */ }

    const originalTemplate = systemTemplates.find((f) => f.id === id);
    onUpdateSystemTemplate(id, {
      label: originalTemplate?.label || '',
      desc: originalTemplate?.desc || '',
      canvasRatio,
      elements: templateElements,
      coverBlob,
    });
  };

  // ── 系统模板新增（用当前画布内容） ─────────────────────────────────────
  const handleAddConfirm = async (data) => {
    const canvasDom = canvasRef.current;
    const canvasW = canvasDom ? canvasDom.getBoundingClientRect().width : 600;
    const canvasH = canvasDom ? canvasDom.getBoundingClientRect().height : 450;

    // 保存元素的所有属性（只排除运行时 id），image 的 url → src
    const templateElements = (elements || []).map((el) => {
      const { id: _id, ...rest } = el;
      if (rest.type === 'image') {
        const { url, ...others } = rest;
        return { ...others, src: url };
      }
      return rest;
    });

    // 截取画布生成封面缩略图
    let coverBlob = null;
    try {
      coverBlob = await captureCanvasCover({
        elements: elements || [],
        backgroundColor: '#ffffff',
        canvasWidth: canvasW,
        canvasHeight: canvasH,
      });
    } catch { /* 封面截图失败不阻塞保存 */ }

    onAddSystemTemplate({
      label: data.label,
      desc: data.desc,
      canvasRatio,
      elements: templateElements,
      coverBlob,
    });
    setIsAdding(false);
  };

  return (
    <div className="template-panel">
      {/* ── 管理员：新增模板按钮 + 内联表单 ── */}
      {isAdmin && (
        <div className="template-panel__manager">
          <div className="template-panel__manager-header">
            <span className="template-panel__manager-title" style={{ color: theme.textPrimary }}>{t('template.title')}</span>
            <button
              type="button"
              className={`template-panel__save-toggle-btn ${isAdding ? 'template-panel__save-toggle-btn--active' : ''}`}
              style={{ color: isAdding ? theme.textMuted : theme.accent }}
              onClick={() => { setIsAdding((v) => !v); setEditingId(null); }}
            >
              {isAdding ? t('template.cancel') : `＋ ${t('admin.addTemplate')}`}
            </button>
          </div>
          {isAdding && (
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
        </div>
      )}

      {/* ── 自定义模板列表（管理员可编辑/删除，普通用户只读可应用） ── */}
      {customTemplates.length > 0 && (
        <>
          <div className="template-panel__section-title" style={{ color: theme.textMuted }}>{t('template.myTemplates')}</div>
          <div className="template-panel__grid">
            {customTemplates.map((frame) => (
              isAdmin && editingId === frame.id ? (
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
                  isCustom={isAdmin}
                  isAdmin={isAdmin}
                  isSystemEditable={false}
                  isActive={activeFrame === frame.id}
                  theme={theme}
                  isDark={isDark}
                  onApply={safeApplyTemplate}
                  onDelete={isAdmin ? deleteCustomTemplate : null}
                  onEdit={isAdmin ? handleCustomEdit : null}
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
              onApply={safeApplyTemplate}
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
