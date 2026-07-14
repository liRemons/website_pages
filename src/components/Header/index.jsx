import React from "react";
import style from "./index.module.less";
import { openApp } from "methods-r";
import { img } from "@utils";
import backSvg from "@assets/svg/back.svg";
import HelpDrawer from "../HelpDrawer";

export default function Header(props) {
  const { name, showLeft = true, showRight = true, leftPath, handleContent } = props;

  const leftComponent = props.leftComponent || (
    <div className="circle" onClick={() => openApp({ url: leftPath || `/${APP_NAME}/homeList` })}>
      {img(backSvg, 20)}
    </div>
  );

  const rightComponent = props.rightComponent || (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {handleContent && <HelpDrawer handleContent={handleContent} />}
    </div>
  );

  return (
    <div className={style.header}>
      <div className={style.left}>
        {showLeft && leftComponent}
      </div>
      {name}
      <div>
        {showRight && rightComponent}
      </div>
    </div>
  );
}
