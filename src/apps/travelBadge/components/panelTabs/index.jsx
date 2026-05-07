import React from 'react';
import { AppstoreOutlined, PictureOutlined, EditOutlined } from '@ant-design/icons';
import { useLocale } from '../../i18n';
import './index.less';

const TAB_CONFIGS = [
  { key: 'template', labelKey: 'panel.template', icon: <AppstoreOutlined /> },
  { key: 'image',    labelKey: 'panel.image',    icon: <PictureOutlined /> },
  { key: 'text',     labelKey: 'panel.text',     icon: <EditOutlined /> },
];

const PanelTabs = ({ activeTab, onChange, isMobile, theme = {} }) => {
  const { t } = useLocale();
  return (
    <div
      className="panel-tabs"
      style={{
        borderBottom: `0.5px solid ${theme.border}`,
        borderTop: isMobile ? `1px solid ${theme.border}` : 'none',
        background: theme.bgSecondary,
      }}
    >
      {TAB_CONFIGS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              'panel-tabs__btn',
              isMobile ? 'panel-tabs__btn--mobile' : 'panel-tabs__btn--desktop',
              isActive ? 'panel-tabs__btn--active' : 'panel-tabs__btn--inactive',
            ].join(' ')}
            style={{ color: isActive ? theme.accent : theme.textMuted }}
          >
            <span className="panel-tabs__btn-icon">{tab.icon}</span>
            <span className="panel-tabs__btn-label">{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PanelTabs;
