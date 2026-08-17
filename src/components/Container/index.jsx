import React from "react";
import styles from "./index.module.less";
import classnames from "classnames";

function Container({ header, main, style, className, isAnimationBackground = true }) {
  return (
    <div>
      <div className={classnames(styles.container, className, isAnimationBackground ? styles.animation_background : "")}>
        {header}
        <div style={style} className={styles.main}>
          {main}
        </div>
      </div>
    </div>
  );
}

export default Container;
