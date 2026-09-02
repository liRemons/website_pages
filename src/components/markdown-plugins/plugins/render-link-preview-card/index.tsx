import React from 'react';
import { createContainerComponent } from '../../utils/parse-container-config';
import LinkPreviewCardLayout from '../../components/link-preview-card-layout';

const LinkPreviewCard: React.FC<{ content: string }> = ({ content }) => {
  return <LinkPreviewCardLayout url={content} />;
};

export default createContainerComponent('linkCard')(LinkPreviewCard);