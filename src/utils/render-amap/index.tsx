import React from 'react';
import { message } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { copy } from 'methods-r';
import { typeToIcon } from '../type-to-icon';
import { createContainerComponent } from '../parse-container-config';
import './index.less';

const AmapContainer: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  const handleCopy = () => {
    message.success('地址已复制到剪贴板');
    copy(label);
  };

  return (
    <div className="amap-container">
      <span className="amap-label">
        <img src={typeToIcon('amap')} />
        <span className="amap-label-text">{label}</span>
      </span>
      <div className="amap-actions">
        <div className="amap-copy-btn" onClick={handleCopy}>
          <span className="amap-icon" /> 复制地址
        </div>
        <a href={url} target="_blank" rel="noopener" className="amap-link-btn">
          <span className="amap-icon amap-link-icon"><ExportOutlined style={{ fontSize: '16px' }} /></span> 打开导航
        </a>
      </div>
    </div>
  );
};

export default createContainerComponent('amap')(AmapContainer);
