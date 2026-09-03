import React, { Fragment } from 'react';
import { Spin } from 'antd';
import websiteSvg from '@/assets/svg/website.svg';
import { useOgp } from './useOgp';
import LinkButton from '../link-button';
import './index.less';

export { useOgp };

interface LinkPreviewCardLayoutProps {
  url: string;
  description?: string;
  favicon?: string | React.ReactNode;
  actions?: React.ReactNode;
}

const LinkPreviewCardLayout: React.FC<LinkPreviewCardLayoutProps> = ({ url, description, favicon, actions }) => {
  const { ogpData, loading, finalUrl } = useOgp(url);

  if (loading) {
    return (
      <div className="link-preview-card-container">
        <div className="link-preview-loading">
          <Spin size="small" />
          <span>加载预览中...</span>
        </div>
      </div>
    );
  }

  const displayTitle = ogpData?.title || `链接 ${new URL(finalUrl).hostname}`;
  const displayDesc = ogpData?.description || description || finalUrl;
  const displayImage = ogpData?.image || '';
  const displayFavicon = ogpData?.favicon || '';
  let displaySiteName = ogpData?.siteName || '';
  try {
    if (!displaySiteName) {
      displaySiteName = new URL(finalUrl).hostname;
    }
  } catch (e) {
    // ignore
  }

  return (
    <div className="link-preview-card-container">
      <div className="link-preview-card">
        {/* {displayImage && !imageError && (
          <div className="link-preview-image">
            <img src={displayImage} alt={displayTitle} onError={() => setImageError(true)} />
          </div>
        )} */}
        <div className="link-preview-info">
          <div className="link-preview-title">
            {favicon || <img className="link-preview-favicon" src={displayFavicon || websiteSvg} alt="" onError={(e) => { (e.target as HTMLImageElement).src = websiteSvg; }} />}
            <span>{displayTitle}</span>
          </div>
          {displayDesc && <div className="link-preview-desc">{displayDesc}</div>}
          <div className="link-preview-site">{displaySiteName}</div>
        </div>
      </div>
      <div className="link-preview-actions">
        {
          actions || <Fragment>
            <LinkButton copyContent={finalUrl} componentType="div" />
            <LinkButton href={finalUrl} componentType="a" />
          </Fragment>
        }
      </div>
    </div>
  );
};

export default LinkPreviewCardLayout;