/**
 * 初始化 Tab 逻辑
 * 使用递归思想：只处理当前容器下的直接子元素，互不干扰
 */

import React from "react";

export const tabsName = 'markdown-tabs';

function listenScroll() {
  const parentElement = document.querySelector('.markdown');

  parentElement?.addEventListener('wheel', (e) => {
    // 获取触发事件的子元素
    const target = e.target as HTMLElement;

    // 检查目标元素是否是需要横向滚动的子元素
    // 使用 .closest() 可以兼容事件冒泡到子元素内部的情况
    const scrollableChild = target?.closest(`.${tabsName}-tabs-header`);

    // 1. 如果没有找到目标子元素，或者没有垂直滚动量，直接放行
    if (!scrollableChild || Math.abs(e.deltaY) === 0) {
      return;
    }

    // 2. 关键修复：检查子元素是否真的可以横向滚动
    // scrollWidth > clientWidth 表示内容溢出，存在横向滚动空间
    const canScrollHorizontally = scrollableChild.scrollWidth > scrollableChild.clientWidth;

    if (!canScrollHorizontally) {
      // 如果无法横向滚动，则不阻止默认行为，让浏览器正常处理垂直滚动
      return;
    }

    // 3. 只有当子元素确实可以横向滚动时，才阻止默认行为并执行横向滚动
    e.preventDefault();
    scrollableChild.scrollLeft += e.deltaY;
  }, { passive: false });
}

function renderTab() {
  // 获取页面上所有的 Tab 组容器
  const wrappers = document.querySelectorAll(`.${tabsName}-tabs-wrapper`);

  wrappers.forEach(wrapper => {
    const header = wrapper.querySelector(`.${tabsName}-tabs-header`);
    const contents = wrapper.querySelector(`.${tabsName}-tabs-container`);

    if (!header || !contents) return;

    // 获取该组内的所有按钮和内容块
    const items = header.querySelectorAll(`.${tabsName}-tab-button`);
    const panels = contents.querySelectorAll(`.${tabsName}-tab-content`);

    // 为每个按钮绑定点击事件
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        // 1. 移除该组内所有按钮的 active 类
        items.forEach(i => i.classList.remove('active'));
        // 2. 移除该组内所有内容块的 active 类
        panels.forEach(p => p.classList.remove('active'));

        // 3. 激活当前点击的按钮
        item.classList.add('active');
        // 4. 激活对应的内容块 (通过 index 匹配)
        if (panels[index]) {
          panels[index].classList.add('active');
        }
      });
    });
  });

  listenScroll()
}

export default renderTab;