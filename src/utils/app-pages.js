/**
 * App 页面管理脚本
 * 子页面直接引入使用，无需跨 webview 通信
 */
(function () {
    var LAST_PAGE_KEY = 'remons_last_page';
    function isApp() {
        return typeof plus !== 'undefined';
    }
    window.isApp = isApp;

    // 记录当前页面到 localStorage（支持参数）
    window.saveCurrentPage = function (pageName, params) {
        if (!pageName) return;
        try {
            var data = JSON.stringify({ pageName: pageName, params: params || null });
            localStorage.setItem(LAST_PAGE_KEY, data);
        } catch (e) {
            console.warn('saveCurrentPage error', e);
        }
    };

    // 读取上次记录的页面，返回 {pageName, params}
    window.getLastPage = function () {
        try {
            var raw = localStorage.getItem(LAST_PAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    };

    // 获取所有 webview
    function getAllWebviews() {
        if (!isApp()) return [];
        return plus.webview.all();
    }

    // 获取父级 webview
    function getParentWebview() {
        if (!isApp()) return null;
        var current = plus.webview.currentWebview();
        return current ? current.parent() : null;
    }

    // 创建或获取页面 webview并显示
    window.openPage = function (pageName, params) {
        if (!isApp()) {
            window.location.href = '../' + pageName + '/index.html';
            return;
        }

        // 查找是否已存在该 webview
        var newUrl = '/' + pageName + '/index.html';
        if (params) {
            var search = new URLSearchParams(params);
            var suffix = search.toString();
            if (suffix) newUrl += '?' + suffix;
        }

        // 检查是否是当前页面
        var current = plus.webview.currentWebview();
        if (current && current.getURL() && current.getURL().indexOf(pageName + '/') !== -1) {
            // 只更新 URL 和保存当前页面，不重新创建 webview
            if (current.getURL() !== newUrl) {
                current.loadURL(newUrl);
            }
            window.saveCurrentPage(pageName, params);
            return;
        }

        // var allWebviews = getAllWebviews();
        // for (var i = 0; i < allWebviews.length; i++) {
        //     if (allWebviews[i].getURL() && allWebviews[i].getURL().indexOf(pageName + '/') !== -1) {
        //         // URL 变化时重新加载
        //         if (allWebviews[i].getURL() !== newUrl) {
        //             allWebviews[i].loadURL(newUrl);
        //         }
        //         allWebviews[i].show('slide-in-right', 300);
        //         window.saveCurrentPage(pageName, params);
        //         return;
        //     }
        // }
        var w = plus.webview.create(
            newUrl,
            pageName,
            { top: '0px', bottom: '0px', width: '100%', height: '100%' },
            { render: 'async' }
        );
        w.show('slide-in-right', 300);
        window.saveCurrentPage(pageName, params);
    };

    // 返回上一页（关闭当前 webview）
    window.goBack = function () {
        if (!isApp()) return false;
        var current = plus.webview.currentWebview();
        if (!current) return false;
        // 如果 webview 数量只有 1 个，说明是主页面，不关闭
        if (plus.webview.all().length <= 1) return false;
        current.close('auto');
        return true;
    };

    // 关闭指定页面（通过 URL 匹配）
    window.closePage = function (pageName) {
        if (!isApp()) return;
        var allWebviews = getAllWebviews();
        for (var i = 0; i < allWebviews.length; i++) {
            var w = allWebviews[i];
            if (w.getURL() && w.getURL().indexOf(pageName + '/') !== -1) {
                w.close('auto');
                break;
            }
        }
    };

    // 处理物理返回键
    var lastBackTime = 0;
    function handleBackButton() {
        if (!isApp()) return;
        var currentWebview = plus.webview.currentWebview();
        currentWebview.canBack(function (e) {
            // if (e.canBack) {
            //     currentWebview.back();
            //     return;
            // }
            // // 先尝试关闭当前页面
            // if (window.goBack()) {
            //     return;
            // }
            // 无法关闭，说明是主页面，双击退出
            var now = Date.now();
            if (now - lastBackTime < 2000) {
                plus.runtime.quit();
            } else {
                lastBackTime = now;
                plus.nativeUI.toast('再按一次退出应用');
            }
        });
    }
    // 每个页面暴露 handleBackButton 到 window
    window.handleBackButton = handleBackButton;

    // 拦截 <a target="_blank"> 打开外链
    // HBuilder 中 target="_blank" 会创建新 webview，外部链接返回时 plus.runtime.quit() 直接退出
    // 改为用 plus.runtime.openURL() 打开，返回时自然回到 HBuilder
    function handleNewWebview() {
        if (typeof plus === 'undefined') return;
        document.addEventListener('click', function (e) {
            var target = e.target;
            while (target && target !== document) {
                if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
                    var url = target.href;
                    if (url && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0)) {
                        e.preventDefault();
                        plus.runtime.openURL(url);
                    }
                    break;
                }
                target = target.parentNode;
            }
        }, true);
    }

    // 自动注册返回键监听
    function registerBackListener() {
        if (typeof plus !== 'undefined' && plus.webview) {
            plus.key.addEventListener('backbutton', handleBackButton);
            handleNewWebview();
        } else {
            document.addEventListener('plusready', function () {
                window.plus = plus;
                plus.key.addEventListener('backbutton', handleBackButton);
                handleNewWebview();
            });
        }
    }
    registerBackListener();
})();