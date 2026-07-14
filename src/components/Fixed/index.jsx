import style from "./index.module.less";
import classnames from "classnames";
import React, { useState } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { message } from "antd";
import { copy, openApp, getSearchParams } from "methods-r";
import { img } from "@utils";
import homeSvg from "@assets/svg/home.svg";
import shareSvg from "@assets/svg/share.svg";
import HelpDrawer from "../HelpDrawer";
import ThemeToggle from "../ThemeToggle";

export default function Fixed({
  homeUrl = "/homeList",
  handleContent,
  position = "right",
  actions,
  propsVisible,
}) {
  const [visible, setVisible] = useState(propsVisible || false);

  const share = () => {
    const params = {
      ...getSearchParams(),
      handleType: "share",
    };
    const newParams = new URLSearchParams(params);
    copy(`${location.origin}${location.pathname}?${newParams.toString()}`);
    message.success("复制当前页面链接成功");
  };

  const go = (url) => {
    openApp({ url: `/${APP_NAME}${url}` });
  };

  const defaultBtns = [
    { icon: img(homeSvg, 20), path: homeUrl, title: "首页", isShow: getSearchParams("handleType") !== "share" },
    { icon: img(shareSvg, 20), title: "分享", handle: share },
  ];

  const btns = (actions || defaultBtns).filter((item) => item.isShow !== false);

  return (
    <>
      <div className={classnames(style.container, visible ? style.containerToRight : "")}>
        <div className={classnames(style.circle)}>
          <ThemeToggle />
        </div>

        {handleContent && (
          <div className={classnames(style.circle)}>
            <HelpDrawer handleContent={handleContent} />
          </div>
        )}

        {btns.map((item) => (
          <div
            key={item.title}
            onClick={item.handle || (() => go(item.path))}
            className={classnames("circle", style.circle)}
          >
            {item.icon}
          </div>
        ))}

        <div
          onClick={() => setVisible(!visible)}
          className={classnames(
            "circle",
            style.circle,
            visible ? style.toRightIcon : ""
          )}
        >
          {visible ? <LeftOutlined /> : <RightOutlined />}
        </div>
      </div>
    </>
  );
}
