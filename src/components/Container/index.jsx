import React from "react";
import styles from "./index.module.less";
import classnames from "classnames";

function Container({ header, main, style, className, isAnimationBackground = true }) {
  console.log(styles.animation_background, styles.container)
  return (
    <div>
      <div className={classnames(
        styles.container,
        className,
        { [styles.animation_background]: isAnimationBackground }
      )}>
        {header}
        <div style={style} className={styles.main}>
          {main}
        </div>
      </div>
    </div>
  );
}

export default Container;
