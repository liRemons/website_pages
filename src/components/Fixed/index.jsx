import style from "./index.module.less";
import classnames from "classnames";
import React, { useState } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { message, FloatButton } from "antd";
import { copy, getSearchParams } from "methods-r";
import { openApp } from "@utils/nav";
import { img } from "@utils";
import homeSvg from "@assets/svg/home.svg";
import shareSvg from "@assets/svg/share.svg";
import HelpDrawer from "../HelpDrawer";
import ThemeToggle from "../ThemeToggle";

/**
 * 「回到顶部」滚动目标：本页真正的滚动容器是 Container 的 .main（已标 data-scroll-container），
 * 而非 window。用模块级稳定函数每次重新查询，引用不变，避免 antd BackTop 的监听 effect 反复重绑。
 */
const getScrollTarget = () =>
  (typeof document !== "undefined" && document.querySelector("[data-scroll-container]")) || window;

export default function Fixed({
  homeUrl = "/homeList",
  handleContent = '',
  position = "right",
  actions = null,
  propsVisible = true,
  backTop = false,
  backTopVisibilityHeight = 200,
}) {
  const [visible, setVisible] = useState(propsVisible || true);

  const share = () => {
    const params = {
      ...getSearchParams(),
      handleType: "share",
    };
    const newParams = new URLSearchParams(params);
    let origin = location.origin;
    let pathname = location.pathname;
    if (origin.startsWith("file://")) {
      origin = "https://remons.cn";
      const segments = pathname.split("/").filter(Boolean);
      const pageName = segments[segments.length - 2];
      if (pageName) {
        pathname = `/${pageName}`;
      }
    }
    copy(`${origin}${pathname}?${newParams.toString()}`);
    message.success("复制当前页面链接成功");
  };

  const go = (url) => {
    openApp({ url });
  };

  const defaultBtns = [
    { icon: img(homeSvg, 20), path: homeUrl, title: "首页", isShow: getSearchParams("handleType") !== "share" },
    { icon: img(shareSvg, 20), title: "分享", handle: share },
  ];

  const btns = (actions || defaultBtns).filter((item) => item.isShow !== false);

  return (
    <>
      {/* 常驻「回到顶部」：用 antd FloatButton.BackTop（自带滚到顶部 + 按阈值自显隐）。
          它不在下面会滑出的 container 里，而是独立 fixed 元素固定在最底部右下角，
          因此 Fixed 收起（container 滑出屏幕）时它仍可见；开启时把 container 底部抬高，两者上下错开不遮挡 */}
      {backTop && (
        <FloatButton.BackTop
          target={getScrollTarget}
          tooltip="回到顶部"
          visibilityHeight={backTopVisibilityHeight}
          // 内联覆盖 antd 默认 inset，与 Fixed 工具列同一右侧基准（right:10）并占住最底部槽位（bottom:10）
          style={{ right: 10, bottom: 10, zIndex: 201 }}
        />
      )}

      <div
        className={classnames(style.container, visible ? style.containerToRight : "")}
        // 有常驻回到顶部时，整列上移给它让出底部槽位（无 backTop 的其他页面保持默认 bottom 不受影响）
        style={backTop ? { bottom: 60 } : undefined}
      >
        {btns.map((item) => (
          <div
            key={item.title}
            onClick={item.handle || (() => go(item.path))}
            className={classnames("circle", style.circle)}
          >
            {item.icon}
          </div>
        ))}

        <div className={classnames(style.circle)}>
          <ThemeToggle dropdown={true} />
        </div>

        {handleContent && (
          <div className={classnames(style.circle)}>
            <HelpDrawer handleContent={handleContent} />
          </div>
        )}

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
