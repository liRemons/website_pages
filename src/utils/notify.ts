/**
 * 统一本地通知（浏览器 + App 一套入口，运行在被打包进 React bundle 的代码里）
 *
 * 为什么放这里而不是 app-pages.js：
 * - app-pages.js 只在 index-app.html / HBuilder 打包页里通过 <script> 引入，浏览器构建（走 index.ejs）根本不加载它，
 *   所以浏览器通知逻辑写在 app-pages.js 里对浏览器是死代码；本模块随 React bundle 在两种环境都会执行。
 * - App 内 window.plus 存在 → 走 plus.push.createMessage；浏览器无 plus → 走 Web Notifications API。
 *
 * 平台差异：
 * - Android App 前台也会直接进通知栏；iOS App 本地通知仅在 App 处于后台时进通知栏。
 * - 浏览器需 HTTPS；iOS Safari 普通标签不支持（需装成 PWA），此时静默丢弃。
 * - 浏览器权限必须由用户手势触发，故 primeNotifyPermission 在首个点击/按键时申请一次。
 */

export interface INotifyOptions {
  /** 通知标题，缺省取 document.title 或 'remons' */
  title?: string
  /** 点击通知回传的附加数据（App 内 JSON 序列化后经 plus.push onclick 广播；浏览器挂到 Notification.onclick） */
  payload?: unknown
  /** 定时通知（仅 App 有效）：Date 或毫秒时间戳，不传立即发 */
  when?: Date | number
  /** App：相同 id 的通知是否覆盖，默认 true */
  cover?: boolean
  /** 浏览器：通知 tag，相同 tag 的新通知会替换旧的 */
  tag?: string
}

/** 取运行期 plus 对象（App 内由 app-pages.js / plusready 挂到 window） */
const getPlus = (): any => (typeof window !== 'undefined' ? (window as any).plus : undefined);

let primed = false;

/** 浏览器环境下在首个用户手势（点击/按键）时申请通知权限；App 内无需 */
export function primeNotifyPermission(): void {
  if (getPlus()) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'default' || primed) return;
  primed = true;
  const doRequest = (): void => {
    try {
      (Notification as any).requestPermission();
    } catch (e) {
      /* ignore */
    }
  };
  window.addEventListener('click', doRequest, { once: true });
  window.addEventListener('keydown', doRequest, { once: true });
}

/**
 * 发送一条通知
 * @param content 通知正文
 * @param opts    见 INotifyOptions
 * @param onDone  创建成功回调
 */
export function notify(content: string, opts: INotifyOptions = {}, onDone?: () => void): void {
  if (!content) return;
  const plus = getPlus();
  const docTitle: string = (typeof document !== 'undefined' && document.title) || 'remons';
  const title: string = opts.title || docTitle;

  // ===== App：plus.push =====
  if (plus && plus.push) {
    const create = (): void => {
      const options: any = { title, payload: opts.payload === undefined ? '' : opts.payload, cover: opts.cover !== false };
      if (opts.when) options.when = opts.when instanceof Date ? opts.when : new Date(opts.when);
      try {
        plus.push.createMessage(content, JSON.stringify(options.payload), options);
      } catch (e) {
        /* ignore */
      }
      if (onDone) onDone();
    };
    // Android 13+ 通知需运行时授权，未授予时先申请（非 Android 或申请失败也照常发送）
    if (plus.os && plus.os.name === 'Android' && plus.android) {
      try {
        plus.android.requestPermissions(['android.permission.POST_NOTIFICATIONS'], () => create(), () => create());
      } catch (e) {
        create();
      }
      return;
    }
    create();
    return;
  }

  // ===== 浏览器：Web Notifications API =====
  primeNotifyPermission();
  if (typeof Notification !== 'undefined') {
    const fire = (): void => {
      const n = new Notification(title, { body: content, tag: opts.tag });
      if (opts.payload !== undefined) {
        n.onclick = (): void => {
          window.focus();
          if (typeof (window as any).onNotifyClick === 'function') (window as any).onNotifyClick(opts.payload, n);
        };
      }
      if (onDone) onDone();
    };
    if (Notification.permission === 'granted') {
      fire();
    } else if (Notification.permission !== 'denied') {
      const req: any = (Notification as any).requestPermission();
      if (req && typeof req.then === 'function') req.then((p: string): void => { if (p === 'granted') fire(); });
    }
    return;
  }
  // eslint-disable-next-line no-console
  console.log('[notify] 当前环境不支持通知:', content);
}

// 模块加载即尝试挂上浏览器权限申请手势（App 内 primeNotifyPermission 内部会直接 return）
primeNotifyPermission();

export default notify;
