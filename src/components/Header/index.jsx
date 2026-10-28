import React from "react";
import style from "./index.module.less";
import { openApp } from "@utils/nav";
import { img } from "@utils";
import backSvg from "@assets/svg/back.svg";
import HelpDrawer from "../HelpDrawer";

export default function Header(props) {
  // headerStyle：透传给根节点的行内样式，只供个别页面微调盒子尺寸（如铺满宽度的内部滚动型页面）；
  // 不传时行为与之前完全一致，其余页面不受影响
  const { name, showLeft = true, showRight = true, leftPath, handleContent, headerStyle } = props;

  const leftComponent = props.leftComponent || (
    <div className="circle" onClick={() => openApp({ url: leftPath || '/homeList', slidePosition: 'left' })}>
      {img(backSvg, 20)}
    </div>
  );

  const rightComponent = props.rightComponent || (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <HelpDrawer handleContent={handleContent} />
    </div>
  );

  return (
    <div className={style.header} style={headerStyle}>
      <div className={style.left}>
        {showLeft && leftComponent}
      </div>
      <div className={style.name}>{name}</div>
      <div className={style.right}>
        {showRight && rightComponent}
      </div>
    </div>
  );
}
