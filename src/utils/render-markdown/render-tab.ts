/**
 * 初始化 Tab 逻辑
 * 使用递归思想：只处理当前容器下的直接子元素，互不干扰
 */
function renderTab() {
  // 获取页面上所有的 Tab 组容器
  const wrappers = document.querySelectorAll('.tabs-tabs-wrapper');

  wrappers.forEach(wrapper => {
    const header = wrapper.querySelector('.tabs-tabs-header');
    const contents = wrapper.querySelector('.tabs-tabs-container');

    if (!header || !contents) return;

    // 获取该组内的所有按钮和内容块
    const items = header.querySelectorAll('.tabs-tab-button');
    const panels = contents.querySelectorAll('.tabs-tab-content');

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
}

export default renderTab;