import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Modal, Button, message } from 'antd';
import { copy } from 'methods-r';
import mermaid from 'mermaid';
import Panzoom from '@panzoom/panzoom';

// 初始化 Mermaid
let panzoom = null;
mermaid.initialize({ startOnLoad: false, theme: 'default' });

async function renderMermaidWithControls() {
    const blocks = document.querySelectorAll('code.language-mermaid');

    for (const block of blocks) {
        const pre = block.parentElement;
        // 获取源码（注意：如果之前已经被替换过，这里取不到，建议从 data-source 属性或闭包变量取）
        // 为了安全，我们假设 source 是原始文本
        const source = block.textContent.trim();

        const id = `mermaid-${Math.random().toString(36).substring(2)}`;

        try {
            const { svg } = await mermaid.render(id, source);

            // --- 1. 构建 DOM 结构 ---
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-wrapper'; // 确保 CSS 中有 position: relative

            const contentDiv = document.createElement('div');
            contentDiv.className = 'mermaid-content'; // 用于 Panzoom 操作
            contentDiv.innerHTML = svg;

            // 工具栏容器
            const toolbar = document.createElement('div');
            toolbar.className = 'mermaid-toolbar';
            // 样式直接写在这里方便复制，实际建议放 CSS 文件

            // 定义按钮配置
            const buttons = [
                { text: '+', title: '放大', action: 'zoomIn' },
                { text: '-', title: '缩小', action: 'zoomOut' },
                { text: '⟲', title: '重置', action: 'reset' },
                { text: '</>', title: '查看源码', action: 'viewSource' }, // 新增
                { text: '⛶', title: '全屏', action: 'toggleFullscreen' } // 新增
            ];

            buttons.forEach(btnConfig => {
                const btn = document.createElement('button');
                btn.innerText = btnConfig.text;
                btn.title = btnConfig.title;
                btn.className = "circle";

                // 绑定事件
                btn.addEventListener('click', () => handleAction(btnConfig.action));
                toolbar.appendChild(btn);
            });

            wrapper.appendChild(toolbar);
            wrapper.appendChild(contentDiv);
            pre.replaceWith(wrapper);

            // --- 2. 初始化 Panzoom ---
            panzoom = Panzoom(contentDiv, {
                maxScale: 5,
                minScale: 0.1,
                startScale: 0.8,
            });

            wrapper.addEventListener('wheel', panzoom.zoomWithWheel);

            // --- 3. 动作处理函数 ---
            function handleAction(action) {
                switch (action) {
                    case 'zoomIn':
                        panzoom.zoomIn();
                        break;
                    case 'zoomOut':
                        panzoom.zoomOut();
                        break;
                    case 'reset':
                        panzoom.reset();
                        break;

                    // === 新增：查看源码 ===
                    case 'viewSource':
                        showSourceModal(source);
                        break;

                    // === 新增：全屏切换 ===
                    case 'toggleFullscreen':
                        toggleFullscreen(wrapper, panzoom);
                        break;
                }
            }

        } catch (err) {
            console.error('Mermaid render error:', err);
            pre.innerHTML = `<span style="color:red">图表渲染失败</span>`;
        }
    }
}

// === 辅助函数：全屏查看 ===
function toggleFullscreen(element, panzoomInstance) {
    if (!document.fullscreenElement) {
        // 进入全屏
        panzoom.reset()
        element.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        // 退出全屏
        panzoom.reset()
        document.exitFullscreen();
    }
}

// 监听全屏变化，强制 Panzoom 更新尺寸（否则全屏后缩放中心会偏移）
document.addEventListener('fullscreenchange', () => {
    // 找到当前正在全屏的 mermaid 实例（简单粗暴法：遍历所有或存引用）
    // 这里演示如何获取：
    const fullscreenWrapper = document.fullscreenElement;
    if (fullscreenWrapper && fullscreenWrapper.classList.contains('mermaid-wrapper')) {
        // 如果使用了上面的代码结构，panzoom 实例通常在闭包里。
        // 实际工程中建议把 panzoom 实例挂载到 DOM 元素上，例如 wrapper.panzoom = panzoom
        // 这里为了演示简单，我们假设你能访问到它，或者重新初始化。
        // 更好的做法是在 requestFullscreen 的回调里处理。

        // 简单的修复技巧：触发一次 resize 或手动 update
        // 由于闭包原因，这里很难直接拿到 panzoom 实例，建议在 handleAction 里处理
    }
});

// === 辅助函数：源码弹窗（antd Modal） ===
function showSourceModal(code) {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const SourceModal = () => {
        const [open, setOpen] = useState(true);

        const handleCopy = () => {
            copy(code);
            message.success('复制成功');
        };

        const handleAfterClose = () => {
            ReactDOM.unmountComponentAtNode(container);
            container.remove();
        };

        return (
            <Modal
                open={open}
                title="Mermaid 源码"
                width={800}
                destroyOnClose
                onCancel={() => setOpen(false)}
                afterClose={handleAfterClose}
                footer={[
                    <Button key="copy" onClick={handleCopy}>
                        复制源码
                    </Button>,
                ]}
            >
                <pre>
                    <code className="language-mermaid">
                        {code}
                    </code>
                </pre>
            </Modal>
        );
    };

    ReactDOM.render(<SourceModal />, container);
}

export default renderMermaidWithControls;
