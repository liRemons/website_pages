import React from "react";
import styles from './index.module.less';

function Container({ header, main, style }) {
  return <>
   <div className={styles.container}>
      {header}
      <div style={style} className={styles.main}>
        {main}
      </div>
    </div>
  </>
}

export default Container;
