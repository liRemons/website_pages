import React, { Fragment } from 'react';
import { typeToIcon } from '@/utils/type-to-icon';
import { createContainerComponent } from '../../utils/parse-container-config';
import LinkButton from '../../components/link-button';
import LinkPreviewCardLayout from '../../components/link-preview-card-layout';

const AmapContainer: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  return (
    <LinkPreviewCardLayout
      url={url}
      description={label}
      actions={
        <Fragment>
          <LinkButton componentType="div" copyContent={label}>
            {typeToIcon('address')}复制地址
          </LinkButton>
          <LinkButton href={url} componentType="a">
            {typeToIcon('amap')} 打开导航
          </LinkButton>
        </Fragment>
      }
    />
  )
};

export default createContainerComponent('amap')(AmapContainer);
