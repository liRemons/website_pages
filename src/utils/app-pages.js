/**
 * App 页面管理脚本
 * 子页面直接引入使用，无需跨 webview 通信
 */
(() => {
    const LAST_PAGE_KEY = 'remons_last_page';
    const isApp = () => typeof plus !== 'undefined';
    window.isApp = isApp;

    // 记录当前页面到 localStorage（支持参数）
    window.saveCurrentPage = (pageName, params) => {
        if (!pageName) return;
        try {
            const data = JSON.stringify({ pageName, params: params || null });
            localStorage.setItem(LAST_PAGE_KEY, data);
        }
        catch (e) {
            console.warn('saveCurrentPage error', e);
        }
    };

    // 读取上次记录的页面，返回 {pageName, params}
    window.getLastPage = () => {
        try {
            const raw = localStorage.getItem(LAST_PAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    };

    // 获取所有 webview
    const getAllWebviews = () => {
        if (!isApp()) return [];
        return plus.webview.all();
    };

    // 获取父级 webview
    const getParentWebview = () => {
        if (!isApp()) return null;
        const current = plus.webview.currentWebview();
        return current ? current.parent() : null;
    };

    // 创建或获取页面 webview并显示
    window.openPage = (pageName, params, slidePosition) => {
        if (!isApp()) {
            window.location.href = `../${pageName}/index.html`;
            return;
        }

        // 查找是否已存在该 webview
        let newUrl = `/${pageName}/index.html`;
        if (params) {
            const search = new URLSearchParams(params);
            const suffix = search.toString();
            if (suffix) newUrl += `?${suffix}`;
        }

        // 检查是否是当前页面
        const current = plus.webview.currentWebview();
        if (current && current.getURL() && current.getURL().indexOf(`${pageName}/`) !== -1) {
            // 只更新 URL 和保存当前页面，不重新创建 webview
            if (current.getURL() !== newUrl) {
                current.loadURL(newUrl);
            }
            window.saveCurrentPage(pageName, params);
            return;
        }

        // const allWebviews = getAllWebviews();
        // for (const wv of allWebviews) {
        //     if (wv.getURL() && wv.getURL().indexOf(`${pageName}/`) !== -1) {
        //         // URL 变化时重新加载
        //         if (wv.getURL() !== newUrl) {
        //             wv.loadURL(newUrl);
        //         }
        //         wv.show('slide-in-right', 300);
        //         window.saveCurrentPage(pageName, params);
        //         return;
        //     }
        // }
        const w = plus.webview.create(
            newUrl,
            pageName,
            { top: '0px', bottom: '0px', width: '100%', height: '100%' },
            { render: 'async' }
        );
        const slidePosition = `slide-in-${slidePosition || 'right'}`;
        w.show(slidePosition, 300);
        window.saveCurrentPage(pageName, params);
    };

    // 返回上一页（关闭当前 webview）
    window.goBack = () => {
        if (!isApp()) return false;
        const current = plus.webview.currentWebview();
        if (!current) return false;
        // 如果 webview 数量只有 1 个，说明是主页面，不关闭
        if (plus.webview.all().length <= 1) return false;
        current.close('auto');
        return true;
    };

    // 关闭指定页面（通过 URL 匹配）
    window.closePage = (pageName) => {
        if (!isApp()) return;
        const allWebviews = getAllWebviews();
        for (const w of allWebviews) {
            if (w.getURL() && w.getURL().indexOf(`${pageName}/`) !== -1) {
                w.close('auto');
                break;
            }
        }
    };

    // 处理物理返回键
    let lastBackTime = 0;
    const handleBackButton = () => {
        if (!isApp()) return;
        const currentWebview = plus.webview.currentWebview();
        currentWebview.canBack(() => {
            // if (e.canBack) {
            //     currentWebview.back();
            //     return;
            // }
            // // 先尝试关闭当前页面
            // if (window.goBack()) {
            //     return;
            // }
            // 无法关闭，说明是主页面，双击退出
            const now = Date.now();
            if (now - lastBackTime < 2000) {
                plus.runtime.quit();
            }
            else {
                lastBackTime = now;
                plus.nativeUI.toast('再按一次退出应用');
            }
        });
    };
    // 每个页面暴露 handleBackButton 到 window
    window.handleBackButton = handleBackButton;

    // 拦截 <a target="_blank"> 打开外链
    // HBuilder 中 target="_blank" 会创建新 webview，外部链接返回时 plus.runtime.quit() 直接退出
    // 改为用 plus.runtime.openURL() 打开，返回时自然回到 HBuilder
    const handleNewWebview = () => {
        const WHITE_LIST = ['remons.cn', 'luckey.word'];
        if (typeof plus === 'undefined') return;
        document.addEventListener('click', (e) => {
            let target = e.target;
            while (target && target !== document) {
                if (target.tagName === 'A' && target.href && !target.hash.startsWith('#') && !target.className.includes('tocLink')) {
                    const url = target.href;
                    const urlObj = new URL(url);
                    const params = Object.fromEntries(urlObj.searchParams.entries());
                    const pathname = urlObj.pathname.endsWith('/') ? urlObj.pathname.slice(0, -1) : urlObj.pathname;

                    if (urlObj.protocol === 'file:') {
                        window.openPage(pathname, params);
                    }
                    else if (urlObj.protocol.includes('http')) {
                        if (WHITE_LIST.includes(urlObj.hostname)) {
                            window.openPage(pathname, params);
                        }
                        else {
                            plus.runtime.openURL(url);
                        }
                    }
                    e.preventDefault();
                    break;
                }
                target = target.parentNode;
            }
        }, true);
    };

    // 自动注册返回键监听
    const registerBackListener = () => {
        if (typeof plus !== 'undefined' && plus.webview) {
            plus.key.addEventListener('backbutton', handleBackButton);
            handleNewWebview();
        }
        else {
            document.addEventListener('plusready', () => {
                window.plus = plus;
                plus.key.addEventListener('backbutton', handleBackButton);
                handleNewWebview();
            });
        }
    };
    registerBackListener();
})();