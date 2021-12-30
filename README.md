<<<<<<< HEAD
### 静态打包介绍

#### 说明

- 基于 `webpack` 搭建的静态化打包方案，使用技术栈主要有 `react`、`antd`、`mobx`
- 旨在解决多人协同开发、页面复用、单页状态等方面的问题，无需进行路由配置，打包后每个页面会生成独立的HTML、CSS、JS等文件。
- webpack 配置没有进行封装

#### 使用

##### 目录介绍

一个完整页面包含以下部分

```dockerfile
├── demo
│   ├── app.jsx
│   ├── main.jsx
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
  import { Button, Form, Card } from 'antd';
  import FormItem from '@components/Form';
  import store from './model/store'
  import { observer } from 'mobx-react'
  
  @observer
  export default class App extends React.Component {
    render() {
      const { total } = store;
      return <Card>
        <Form
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
        >
          <FormItem label='数字输入' component='inputNumber' value={total}></FormItem>
          <FormItem label='输入' component='input'></FormItem>
          <FormItem label='选择器' component='select'></FormItem>
          <FormItem label='多选' component='checkbox'></FormItem>
          <Form.Item>
            <Button onClick={()=>store.changePrice()}> + </Button>
          </Form.Item>
        </Form>
      </Card>
    }
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

##### 基础组件封装

目前仅对 `form` 组件进行简单的封装，也可以自己封装其它组件，参见 `component/Form`

##### 运行

使用`npm run start`, 执行此命令会默认查找`src/pages`下的所有页面一起运行，也可以单独运行一个页面，例如，一份常见的目录结构如下：

```dockerfile
├── src
│   ├── assets
│   ├── components
│   └── pages
│       ├── demo
│       │   ├── app.jsx
│       │   ├── main.jsx
│       │   └── model
│       │       └── store.js
│       └── demo2
│           ├── app.jsx
│           ├── main.jsx
│           └── model
│               └── store.js
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

=======
# website_pages

#### 介绍
{**以下是 Gitee 平台说明，您可以替换此简介**
Gitee 是 OSCHINA 推出的基于 Git 的代码托管平台（同时支持 SVN）。专为开发者提供稳定、高效、安全的云端软件开发协作平台
无论是个人、团队、或是企业，都能够用 Gitee 实现代码托管、项目管理、协作开发。企业项目请看 [https://gitee.com/enterprises](https://gitee.com/enterprises)}

#### 软件架构
软件架构说明


#### 安装教程

1.  xxxx
2.  xxxx
3.  xxxx

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
>>>>>>> 6ac500c354f71841a206a46e30271a2b07eadd19
