import { useEffect, useState } from 'react';
import { hasProtocolFun, HOST } from '@/utils';

export interface OgpData {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
  locale: string;
  favicon: string;
}

interface UseOgpResult {
  ogpData: OgpData | null;
  loading: boolean;
  error: boolean;
  imageError: boolean;
  setImageError: (v: boolean) => void;
  finalUrl: string;
  hasProtocol: boolean;
}

export function useOgp(url: string): UseOgpResult {
  const [ogpData, setOgpData] = useState<OgpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const trimmed = url?.trim();
  const hasProtocol = hasProtocolFun(trimmed);
  const finalUrl = hasProtocol
    ? trimmed
    : `${window.location.origin}${trimmed?.startsWith('/') ? '' : '/'}${trimmed}`;

  useEffect(() => {
    if (!trimmed) {
      setLoading(false);
      setError(true);
      return;
    }
    setImageError(false);

    fetch(`${HOST}/ogp/fetch?url=${encodeURIComponent(finalUrl)}`)
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
  }, [trimmed]);

  return { ogpData, loading, error, imageError, setImageError, finalUrl, hasProtocol };
}