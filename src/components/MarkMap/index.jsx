import React, { useEffect, useState } from 'react';
import { Transformer } from 'markmap-lib';
import * as markmap from 'markmap-view';
import './index.css';

const transformer = new Transformer();
const { Markmap, loadCSS, loadJS } = markmap;


export default ({ markdownInfo }) => {
  useEffect(() => {
    const { root, features } = transformer.transform(markdownInfo);
    const { styles, scripts } = transformer.getUsedAssets(features);
    loadCSS(styles);
    loadJS(scripts, { getMarkmap: () => markmap });
    Markmap.create('#markmap', null, root)
  }, [markdownInfo]);

  return <div style={{ width: '100%', height: '100%' }}>
    <svg id="markmap" style={{ width: '100%', height: '100%' }}></svg>
  </div>
}
