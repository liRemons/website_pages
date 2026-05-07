import React from 'react';
import { SelectOutlined } from '@ant-design/icons';
import { useLocale } from '../../i18n';
import TextPropsEditor from '../textPropsEditor';
import ImagePropsEditor from '../imagePropsEditor';
import './index.less';

/**
 * 属性面板（路由层）
 * 根据选中元素类型分发到 TextPropsEditor 或 ImagePropsEditor
 */
const PropsPanel = ({ selectedElement, onUpdate, onDelete, onZIndexChange, theme = {}, fontTemplateProps }) => {
  const { t } = useLocale();

  if (!selectedElement) {
    return (
      <div className="props-panel__empty" style={{ color: theme.textDisabled }}>
        <div className="props-panel__empty-icon">
          <SelectOutlined />
        </div>
        <div className="props-panel__empty-text">{t('props.emptyText')}</div>
        <div className="props-panel__empty-sub" style={{ color: theme.textMuted }}>{t('props.emptySub')}</div>
      </div>
    );
  }

  return (
    <div className="props-panel">
      {selectedElement.type === 'text' ? (
        <TextPropsEditor
          element={selectedElement}
          onUpdate={onUpdate}
          theme={theme}
          fontTemplateProps={fontTemplateProps}
        />
      ) : (
        <ImagePropsEditor
          element={selectedElement}
          onUpdate={onUpdate}
          theme={theme}
        />
      )}
    </div>
  );
};

export default PropsPanel;