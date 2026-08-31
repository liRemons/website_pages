import React from 'react';
import { message } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { copy } from 'methods-r';
import classnames from 'classnames';
import { typeToIcon } from '../type-to-icon';
import { createContainerComponent } from '../parse-container-config';
import './index.less'

const BadgeContainer: React.FC<{ type: string; content: string; block: string; }> = ({ type, content, block }) => {

  return (
    <div className={classnames('badge-container', block === 'true' ? 'block' : '')}>
      {typeToIcon(type)} 
      <span>{content}</span>
    </div>
  );
};

export default createContainerComponent('badge')(BadgeContainer);
