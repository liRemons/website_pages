import React from 'react';
import { message } from 'antd';
import { copy } from 'methods-r';
import { typeToIcon } from '../type-to-icon';
import { createContainerComponent } from '../parse-container-config';
import './index.less';

const CopyPasswordContainer: React.FC<{ content: string; type: string; icon: string }> = ({ content, type, icon }) => {
  const handleCopy = () => {
    message.success('口令已复制到剪贴板');
    copy(content);
  };


  const url = icon || typeToIcon(type);

  return (
    <div className="copy-password-container">
      <div className="copy-password-info">
        {typeToIcon(type, 'copy-password-icon') || typeToIcon('password', 'copy-password-icon')}
        <span className="copy-password-content">{content}</span>
      </div>
      <div className="copy-password-actions">
        <div className="copy-password-btn" onClick={handleCopy}>
          <span className="copy-password-btn-icon" /> 复制口令
        </div>
      </div>
    </div>
  );
};

export default createContainerComponent('copyPassword')(CopyPasswordContainer);
