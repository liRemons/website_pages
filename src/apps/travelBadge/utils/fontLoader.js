/**
 * 远程字体加载工具
 * 支持从 Google Fonts 等服务加载 Web 字体
 */

// 远程字体配置
export const REMOTE_FONTS = [
  {
    value: 'ZCOOL KuaiLe',
    label: '站酷快乐体',
    url: 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap',
    group: '远程字体',
  },
  {
    value: 'ZCOOL QingKe HuangYou',
    label: '站酷庆科黄油体',
    url: 'https://fonts.googleapis.com/css2?family=ZCOOL+QingKe+HuangYou&display=swap',
    group: '远程字体',
  },
  {
    value: 'ZCOOL XiaoWei',
    label: '站酷小薇体',
    url: 'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap',
    group: '远程字体',
  },
  {
    value: 'Ma Shan Zheng',
    label: '马善政毛笔楷书',
    url: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap',
    group: '远程字体',
  },
  {
    value: 'Long Cang',
    label: '龙藏体',
    url: 'https://fonts.googleapis.com/css2?family=Long+Cang&display=swap',
    group: '远程字体',
  },
  {
    value: 'Liu Jian Mao Cao',
    label: '刘建毛草书',
    url: 'https://fonts.googleapis.com/css2?family=Liu+Jian+Mao+Cao&display=swap',
    group: '远程字体',
  },
  {
    value: 'Zhi Mang Xing',
    label: '志莽行书',
    url: 'https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap',
    group: '远程字体',
  },
  {
    value: 'Noto Serif SC',
    label: 'Noto Serif SC（思源宋体）',
    url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap',
    group: '远程字体',
  },
  {
    value: 'Noto Sans SC',
    label: 'Noto Sans SC（思源黑体）',
    url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap',
    group: '远程字体',
  },
];

// 已加载的字体集合
const loadedFonts = new Set();

/**
 * 加载远程字体
 * @param {string} fontUrl - 字体 CSS 文件 URL
 * @returns {Promise<void>}
 */
export const loadFont = (fontUrl) => {
  if (loadedFonts.has(fontUrl)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.onload = () => {
      loadedFonts.add(fontUrl);
      resolve();
    };
    link.onerror = () => {
      console.warn(`字体加载失败: ${fontUrl}`);
      reject(new Error(`字体加载失败: ${fontUrl}`));
    };
    document.head.appendChild(link);
  });
};

/**
 * 批量加载远程字体
 * @param {Array} fonts - 字体配置数组
 * @returns {Promise<void>}
 */
export const loadRemoteFonts = async (fonts) => {
  const loadPromises = fonts.map(font => loadFont(font.url));
  await Promise.allSettled(loadPromises);
};

/**
 * 检查字体是否已加载
 * @param {string} fontUrl - 字体 URL
 * @returns {boolean}
 */
export const isFontLoaded = (fontUrl) => {
  return loadedFonts.has(fontUrl);
};
