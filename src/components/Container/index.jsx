import React from "react";
import style from './index.less';

function Container({ header, main }) {
  return <>
   <div className={style.container}>
      {header}
      <div className={style.main}>
        {main}
      </div>
    </div>
  </>
}

export default Container;