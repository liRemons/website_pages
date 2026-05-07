/**
 * 样式工具函数
 * 用于文字元素的 CSS 样式计算，供 DraggableElement、PropsPanel 等组件共用
 */

/**
 * 生成唯一元素 ID
 */
let elementIdCounter = 1;
export const generateId = () => `el_${elementIdCounter++}`;

/**
 * 根据文字属性生成 text-shadow CSS 值
 */
export const buildTextShadow = (textProps) => {
  const { shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor } = textProps;
  if (!shadowBlur && !shadowOffsetX && !shadowOffsetY) return 'none';
  return `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`;
};

/**
 * 根据文字属性生成 -webkit-text-stroke 样式对象
 */
export const buildWebkitStroke = (textProps) => {
  if (!textProps.strokeWidth) return {};
  return { WebkitTextStroke: `${textProps.strokeWidth}px ${textProps.strokeColor}` };
};

/**
 * 根据文字属性生成 color 样式对象
 */
export const buildTextColor = (textProps) => ({ color: textProps.color });

/**
 * 根据 theme 生成 antd Select 组件的主题 token
 */
export const makeSelectToken = (theme) => ({
  colorBgContainer: theme.bgTertiary,
  colorBgElevated: theme.bgTertiary,
  colorBorder: theme.borderLight,
  colorText: theme.textPrimary,
  colorTextPlaceholder: theme.textMuted,
  colorPrimaryHover: theme.accent,
  colorPrimary: theme.accent,
  colorTextQuaternary: theme.textSecondary,
  optionSelectedBg: theme.bgPrimary,
  optionActiveBg: theme.bgSecondary,
  colorTextBase: theme.textPrimary,
});

/**
 * 根据 theme 生成 antd InputNumber 组件的主题 token
 */
export const makeInputNumberToken = (theme) => ({
  colorBgContainer: theme.bgTertiary,
  colorBorder: theme.borderLight,
  colorText: theme.textPrimary,
  colorTextPlaceholder: theme.textMuted,
  activeBorderColor: theme.accent,
  hoverBorderColor: theme.borderLight,
});

/**
 * 根据 theme 生成 antd Input 组件的主题 token
 */
export const makeInputToken = (theme) => ({
  colorBgContainer: theme.bgTertiary,
  colorBorder: theme.borderLight,
  colorText: theme.textPrimary,
  colorTextPlaceholder: theme.textMuted,
  activeBorderColor: theme.accent,
  hoverBorderColor: theme.borderLight,
});
