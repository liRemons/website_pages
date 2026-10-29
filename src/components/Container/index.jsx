import React from "react";
import styles from "./index.module.less";
import classnames from "classnames";

/**
 * 页面骨架容器：背景层（渐变或动图）+ 顶部 Header + 自带内边距与滚动的 .main 内容区
 * @param {object} props
 * @param {React.ReactNode} props.header 顶部栏
 * @param {React.ReactNode} props.main 主内容区
 * @param {React.CSSProperties} [props.style] 透传给 .main 的行内样式，供个别页面微调默认内边距等
 * @param {string} [props.className] 追加到最外层的类名
 * @param {boolean} [props.isAnimationBackground] 是否使用动图背景
 */
function Container({ header, main, style = undefined, className = undefined, isAnimationBackground = true }) {
  return (
    <div>
      <div className={classnames(
        styles.container,
        className,
        { [styles.animation_background]: isAnimationBackground }
      )}>
        {header}
        {/* data-scroll-container：标记本页真正的滚动容器（.main），供 Fixed 的「回到顶部」定位滚动目标 */}
        <div style={style} className={styles.main} data-scroll-container>
          {main}
        </div>
      </div>
    </div>
  );
}

export default Container;
