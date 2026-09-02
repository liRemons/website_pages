import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import { ExportOutlined, LinkOutlined } from '@ant-design/icons';
import { copy } from 'methods-r';
import { HOST } from '@/utils';
import websiteSvg from '@/assets/svg/website.svg';
import { createContainerComponent } from '../parse-container-config';
import './index.less';

interface OgpData {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
  locale: string;
  favicon: string;
}

const LinkPreviewCard: React.FC<{ content: string }> = ({ content }) => {
  const [ogpData, setOgpData] = useState<OgpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const url = content?.trim();

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError(true);
      return;
    }
    setImageError(false);

    fetch(`${HOST}/ogp/fetch?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setOgpData(res.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [url]);

  const handleCopy = () => {
    message.success('链接已复制到剪贴板');
    copy(url);
  };

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

  if (error || !ogpData) {
    return (
      <div className="link-preview-card-container">
        <a href={url} target="_blank" rel="noopener" className="link-preview-fallback">
          <LinkOutlined /> {url}
        </a>
      </div>
    );
  }

  const displayTitle = ogpData.title || url;
  const displayDesc = ogpData.description || '';
  const displayImage = ogpData.image || '';
  const displayFavicon = ogpData.favicon || '';
  let displaySiteName = ogpData.siteName || '';
  try {
    if (!displaySiteName) {
      displaySiteName = new URL(url).hostname;
    }
  } catch (e) {
    // ignore
  }

  return (
    <div className="link-preview-card-container">
      <a href={url} target="_blank" rel="noopener" className="link-preview-card">
        {displayImage && !imageError && (
          <div className="link-preview-image">
            <img src={displayImage} alt={displayTitle} onError={() => setImageError(true)} />
          </div>
        )}
        <div className="link-preview-info">
          <div className="link-preview-title">
            <img className="link-preview-favicon" src={displayFavicon || websiteSvg} alt="" onError={(e) => { (e.target as HTMLImageElement).src = websiteSvg; }} />
            <span>{displayTitle}</span>
          </div>
          {displayDesc && <div className="link-preview-desc">{displayDesc}</div>}
          <div className="link-preview-site">{displaySiteName}</div>
        </div>
      </a>
      <div className="link-preview-actions">
        <div className="link-preview-btn" onClick={handleCopy}>
          复制链接
        </div>
        <a href={url} target="_blank" rel="noopener" className="link-preview-btn link-preview-btn-primary">
          <ExportOutlined style={{ fontSize: '14px' }} /> 跳转打开
        </a>
      </div>
    </div>
  );
};

export default createContainerComponent('linkCard')(LinkPreviewCard);