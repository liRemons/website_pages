// ─── 字体列表 ─────────────────────────────────────────────────────────────────

export const FONT_FAMILIES = [
  // ── 中文字体（系统内置，跨平台覆盖）──────────────────────────────────────
  { value: 'PingFang SC',          label: '苹方（PingFang SC）',        group: '中文' },
  { value: 'Hiragino Sans GB',     label: '冬青黑体（Hiragino Sans GB）', group: '中文' },
  { value: 'Microsoft YaHei',      label: '微软雅黑',                    group: '中文' },
  { value: 'Microsoft JhengHei',   label: '微软正黑体',                  group: '中文' },
  { value: 'SimSun',               label: '宋体（SimSun）',              group: '中文' },
  { value: 'SimHei',               label: '黑体（SimHei）',              group: '中文' },
  { value: 'KaiTi',                label: '楷体（KaiTi）',               group: '中文' },
  { value: 'FangSong',             label: '仿宋（FangSong）',            group: '中文' },
  { value: 'STSong',               label: '华文宋体（STSong）',          group: '中文' },
  { value: 'STKaiti',              label: '华文楷体（STKaiti）',         group: '中文' },
  { value: 'STHeiti',              label: '华文黑体（STHeiti）',         group: '中文' },
  { value: 'STFangsong',           label: '华文仿宋（STFangsong）',      group: '中文' },
  { value: 'Noto Sans SC',         label: 'Noto Sans SC（思源黑体）',    group: '中文' },
  { value: 'Noto Serif SC',        label: 'Noto Serif SC（思源宋体）',   group: '中文' },
  // ── 远程字体（Google Fonts）──────────────────────────────────────────────
  { value: 'ZCOOL KuaiLe',         label: '站酷快乐体',                  group: '远程字体' },
  { value: 'ZCOOL QingKe HuangYou', label: '站酷庆科黄油体',            group: '远程字体' },
  { value: 'ZCOOL XiaoWei',        label: '站酷小薇体',                  group: '远程字体' },
  { value: 'Long Cang',            label: '龙藏体',                      group: '远程字体' },
  { value: 'Liu Jian Mao Cao',     label: '刘建毛草书',                  group: '远程字体' },
  { value: 'Zhi Mang Xing',        label: '志莽行书',                    group: '远程字体' },
  { value: 'Ma Shan Zheng',        label: '马善政毛笔楷书',              group: '远程字体' },
  // ── 英文字体 ──────────────────────────────────────────────────────────────
  { value: 'Arial',                label: 'Arial',                       group: '英文' },
  { value: 'Georgia',              label: 'Georgia',                     group: '英文' },
  { value: 'Times New Roman',      label: 'Times New Roman',             group: '英文' },
  { value: 'Courier New',          label: 'Courier New',                 group: '英文' },
  { value: 'Verdana',              label: 'Verdana',                     group: '英文' },
  { value: 'Trebuchet MS',         label: 'Trebuchet MS',                group: '英文' },
  { value: 'Impact',               label: 'Impact',                      group: '英文' },
  { value: 'Comic Sans MS',        label: 'Comic Sans MS',               group: '英文' },
];

// ─── 相框模板 ─────────────────────────────────────────────────────────────────
// elements 中坐标/尺寸使用 0~1 的比例值，应用时乘以画布实际宽高
// type: 'image-placeholder' 表示图片占位区，type: 'text' 表示预设文字

export const FRAME_TEMPLATES = [
  {
    id: 'none',
    label: '无相框',
    desc: '空白画布，自由发挥',
    style: {},
    elements: [],
  },
  {
    id: 'minimal-white',
    label: '极简白框',
    desc: '细白边框 + 底部优雅署名',
    style: {
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    },
    elements: [
      {
        type: 'text',
        rx: 0.05, ry: 0.87, rw: 0.5, rh: 0.09,
        textProps: {
          content: 'My Story',
          fontFamily: 'Georgia', fontSize: 18, fontWeight: 'normal', fontStyle: 'italic',
          letterSpacing: 2, color: '#888888', useGradient: false,
          gradientFrom: '#888', gradientTo: '#bbb', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
      {
        type: 'text',
        rx: 0.6, ry: 0.87, rw: 0.35, rh: 0.09,
        textProps: {
          content: '2025',
          fontFamily: 'Georgia', fontSize: 18, fontWeight: 'normal', fontStyle: 'normal',
          letterSpacing: 3, color: '#bbbbbb', useGradient: false,
          gradientFrom: '#bbb', gradientTo: '#ddd', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
    ],
  },
  {
    id: 'dark-cinema',
    label: '暗调电影',
    desc: '深色宽框 + 顶部片名 + 底部字幕',
    style: {
      boxShadow: 'inset 0 0 0 1px #333, 0 8px 32px rgba(0,0,0,0.6)',
    },
    elements: [
      {
        type: 'text',
        rx: 0.04, ry: 0.03, rw: 0.55, rh: 0.11,
        textProps: {
          content: 'FILM',
          fontFamily: 'Impact', fontSize: 30, fontWeight: 'bold', fontStyle: 'normal',
          letterSpacing: 10, color: '#ffffff', useGradient: false,
          gradientFrom: '#fff', gradientTo: '#aaa', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
      {
        type: 'text',
        rx: 0.04, ry: 0.86, rw: 0.92, rh: 0.1,
        textProps: {
          content: '— A moment worth remembering —',
          fontFamily: 'Georgia', fontSize: 14, fontWeight: 'normal', fontStyle: 'italic',
          letterSpacing: 1, color: '#888888', useGradient: false,
          gradientFrom: '#888', gradientTo: '#aaa', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
    ],
  },
  {
    id: 'vintage-paper',
    label: '复古纸张',
    desc: '米色纸感边框 + 手写风格文字',
    style: {
      boxShadow: 'inset 0 0 0 2px #c8b89a, 0 4px 20px rgba(100,80,40,0.25)',
    },
    elements: [
      {
        type: 'text',
        rx: 0.08, ry: 0.03, rw: 0.84, rh: 0.1,
        textProps: {
          content: '珍贵时光',
          fontFamily: 'Ma Shan Zheng', fontSize: 26, fontWeight: 'normal', fontStyle: 'normal',
          letterSpacing: 8, color: '#7a5c3a', useGradient: false,
          gradientFrom: '#7a5c3a', gradientTo: '#a07850', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#7a5c3a', shadowBlur: 0, shadowOffsetX: 1, shadowOffsetY: 1,
        },
      },
      {
        type: 'text',
        rx: 0.08, ry: 0.87, rw: 0.84, rh: 0.09,
        textProps: {
          content: '留住这一刻',
          fontFamily: 'Ma Shan Zheng', fontSize: 18, fontWeight: 'normal', fontStyle: 'normal',
          letterSpacing: 5, color: '#a07850', useGradient: false,
          gradientFrom: '#a07850', gradientTo: '#c8a870', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
    ],
  },
  {
    id: 'pink-soft',
    label: '少女粉调',
    desc: '柔粉渐变边框 + 甜美文字',
    style: {
      boxShadow: 'inset 0 0 0 3px #fce4ec, 0 4px 20px rgba(249,168,201,0.4)',
    },
    elements: [
      {
        type: 'text',
        rx: 0.08, ry: 0.03, rw: 0.84, rh: 0.1,
        textProps: {
          content: '✿ Sweet Moment ✿',
          fontFamily: 'PingFang SC', fontSize: 18, fontWeight: '600', fontStyle: 'normal',
          letterSpacing: 2, color: '#e879a0', useGradient: true,
          gradientFrom: '#f472b6', gradientTo: '#c084fc', gradientAngle: 90,
          strokeColor: '#fff', strokeWidth: 0,
          shadowColor: '#f9a8c9', shadowBlur: 8, shadowOffsetX: 0, shadowOffsetY: 2,
        },
      },
      {
        type: 'text',
        rx: 0.08, ry: 0.87, rw: 0.84, rh: 0.09,
        textProps: {
          content: '美好时光 · 2025',
          fontFamily: 'PingFang SC', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal',
          letterSpacing: 3, color: '#f472b6', useGradient: false,
          gradientFrom: '#f472b6', gradientTo: '#c084fc', gradientAngle: 90,
          strokeColor: '#fff', strokeWidth: 0,
          shadowColor: '#f9a8c9', shadowBlur: 4, shadowOffsetX: 0, shadowOffsetY: 1,
        },
      },
    ],
  },
  {
    id: 'neon-purple',
    label: '赛博霓虹',
    desc: '深色背景 + 紫蓝渐变发光框',
    style: {
      boxShadow: '0 0 0 1px #a855f7, 0 0 20px rgba(124,58,237,0.6), 0 0 40px rgba(124,58,237,0.3), inset 0 0 20px rgba(124,58,237,0.1)',
      background: '#0d0d1a',
    },
    elements: [
      {
        type: 'text',
        rx: 0.04, ry: 0.03, rw: 0.92, rh: 0.13,
        textProps: {
          content: 'CYBER VISION',
          fontFamily: 'Impact', fontSize: 32, fontWeight: 'bold', fontStyle: 'normal',
          letterSpacing: 8, color: '#a855f7', useGradient: true,
          gradientFrom: '#60a5fa', gradientTo: '#a855f7', gradientAngle: 90,
          strokeColor: '#7c3aed', strokeWidth: 0,
          shadowColor: '#a855f7', shadowBlur: 16, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
      {
        type: 'text',
        rx: 0.04, ry: 0.85, rw: 0.92, rh: 0.1,
        textProps: {
          content: '— FUTURE IS NOW —',
          fontFamily: 'Courier New', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal',
          letterSpacing: 4, color: '#60a5fa', useGradient: false,
          gradientFrom: '#60a5fa', gradientTo: '#a855f7', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#60a5fa', shadowBlur: 8, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
    ],
  },
  {
    id: 'postcard',
    label: '旅行明信片',
    desc: '白框 + 地点标签 + 手写日期',
    style: {
      boxShadow: '0 6px 30px rgba(0,0,0,0.2), inset 0 0 0 1px #d0d0d0',
    },
    elements: [
      {
        type: 'text',
        rx: 0.04, ry: 0.03, rw: 0.5, rh: 0.1,
        textProps: {
          content: '📍 目的地',
          fontFamily: 'PingFang SC', fontSize: 20, fontWeight: '600', fontStyle: 'normal',
          letterSpacing: 1, color: '#374151', useGradient: false,
          gradientFrom: '#374151', gradientTo: '#6b7280', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
      {
        type: 'text',
        rx: 0.04, ry: 0.82, rw: 0.5, rh: 0.09,
        textProps: {
          content: '2025 · 旅途中',
          fontFamily: 'Georgia', fontSize: 15, fontWeight: 'normal', fontStyle: 'italic',
          letterSpacing: 2, color: '#6b7280', useGradient: false,
          gradientFrom: '#6b7280', gradientTo: '#9ca3af', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
      {
        type: 'text',
        rx: 0.58, ry: 0.82, rw: 0.38, rh: 0.09,
        textProps: {
          content: '✈ Postcard',
          fontFamily: 'Georgia', fontSize: 14, fontWeight: 'normal', fontStyle: 'italic',
          letterSpacing: 1, color: '#9ca3af', useGradient: false,
          gradientFrom: '#9ca3af', gradientTo: '#d1d5db', gradientAngle: 90,
          strokeColor: '#000', strokeWidth: 0,
          shadowColor: '#000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
        },
      },
    ],
  },
];

// ─── 字体模板（已迁移至数据库，通过 useSystemFontTemplates hook 加载） ──────

// ─── Mock 图片 ────────────────────────────────────────────────────────────────

export const MOCK_IMAGES = [
  { id: 'mock1', label: '风景1', url: 'https://picsum.photos/seed/landscape1/400/300' },
  { id: 'mock2', label: '风景2', url: 'https://picsum.photos/seed/landscape2/400/300' },
  { id: 'mock3', label: '人物1', url: 'https://picsum.photos/seed/portrait1/300/400' },
  { id: 'mock4', label: '城市1', url: 'https://picsum.photos/seed/city1/400/300' },
  { id: 'mock5', label: '自然1', url: 'https://picsum.photos/seed/nature1/400/300' },
  { id: 'mock6', label: '建筑1', url: 'https://picsum.photos/seed/arch1/400/300' },
];

// ─── 文字默认属性 ─────────────────────────────────────────────────────────────

export const DEFAULT_TEXT_PROPS = {
  fontFamily: 'PingFang SC',
  fontSize: 24,
  fontWeight: 'normal',
  fontStyle: 'normal',
  letterSpacing: 0,
  color: '#000000',
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  content: '点击编辑文字',
};

