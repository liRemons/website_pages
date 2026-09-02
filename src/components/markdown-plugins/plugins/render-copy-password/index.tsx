import React, { Fragment } from 'react';
import {} from '@ant-design/icons';
import { createContainerComponent } from '../../utils/parse-container-config';
import LinkPreviewCardLayout from '../../components/link-preview-card-layout';
import { typeToIcon } from '@/utils/type-to-icon';
import LinkButton from '../../components/link-button';

const CopyPasswordContainer: React.FC<{ content: string; type: string }> = ({ content, type }) => {
  const url = content.match(/https?:\/\/[^\s<>"']+/)?.[0] || '';
  const icon = typeToIcon(type, 'copy-password-icon') || typeToIcon('password', 'copy-password-icon')

  if (url) {
    return <LinkPreviewCardLayout
      url={url}
      description={content}
      favicon={icon}
      actions={
        <Fragment>
          <LinkButton componentType="div" copyContent={content}>
            {typeToIcon('password')}复制口令
          </LinkButton>
          <LinkButton href={url} componentType="a" copyContent={content} />
        </Fragment>
      }
    />;
  }

  return null;
};

export default createContainerComponent('copyPassword')(CopyPasswordContainer);
