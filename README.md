### 静态打包介绍

#### 说明

- 基于 `webpack` 搭建的静态化打包方案，使用技术栈主要有 `react`、`antd`、`mobx`
- 旨在解决多人协同开发、页面复用、单页状态等方面的问题，无需进行路由配置，打包后每个页面会生成独立的HTML、CSS、JS等文件。
- webpack 配置没有进行封装

#### 使用

##### 目录介绍

一个完整页面包含以下部分

```dockerfile
├── app
│   ├── app.jsx
│   ├── main.jsx
│   ├── pages
│       └── List.jsx
│   └── model
│       └── store.js
```

下面对每个文件夹的作用进行介绍

- main.jsx

  每个页面的入口文件，必须，一个常见的文件内容参考如下：

  ```jsx
  import App from './app';
  ReactDOM.render(<App />, document.getElementById('container'));
  ```

- app.jsx

  页面的 UI 渲染入口，当然也可以写业务代码，示例如下：

  ```jsx
  import React from 'react';
  import List from './pages/List';
  
  
  export default function App () {
    return <List />
  }
  ```
  
- model/store.jsx

  每个页面的状态管理，由于每个页面互不关联，所以每个页面都有独立的状态管理，示例：

  ```jsx
  import { makeAutoObservable } from 'mobx'
  
  class Store {
    price = 1;
    amount = 10;
    constructor(){
      makeAutoObservable(this); 
    }
  
    get total() {
      return this.price * this.amount;
    }
  
    changePrice() {
      this.price ++
    }
  }
  
  const store  = new Store();
  
  export default store;
  ```

- pages/List.jsx

  ```jsx
  import React, { useEffect } from 'react';
  import { useObserver, useLocalObservable } from 'mobx-react';
  import store from '../model/store';
  
  
  export default function List() {
    const localStore = useLocalObservable(() => store);
    return useObserver(() => <>{localStore.price}</>)
  }
  ```

  

##### 基础组件封装

目前仅对 `form` 组件进行简单的封装，也可以自己封装其它组件，参见 `component/Form`

##### 运行

使用`npm run start`, 执行此命令会默认查找`src/pages`下的所有页面一起运行，也可以单独运行一个页面，例如，一份常见的目录结构如下：

```dockerfile
├── src
│   ├── assets
│   ├── components
│   └── app
│       ├── demo
│       │   ├── app.jsx
│       │   ├── main.jsx
│       │   └── pages
│       │       └── List.jsx
│       │   └── model
│       │       └── store.js
│       └── demo2
│       │   ├── app.jsx
│       │   ├── main.jsx
│       │   └── pages
│       │       └── List.jsx
│       │   └── model
│       │       └── store.js
```

- 直接运行 `npm run start`, 会同时运行 `demo`、`demo2`

- 单个运行：`npm run start demo`

- 批量运行：`npm run start demo,demo2`
- 运行后，在浏览器打开页面： `localhost:3033/demo` or `lcoalhost:3033/demo2`

##### 打包

- 统一打包：`npm run build`
- 单个打包：`npm run build demo`
- 批量打包：`npm run build demo,demo2`
- 打包产物会默认放入 `dist`下

