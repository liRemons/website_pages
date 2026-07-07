// Mermaid 图表实时渲染器 —— 常量定义

// 首屏默认示例（flowchart）
export const DEFAULT_SOURCE = `flowchart TD
    A[开始] --> B{是否登录?}
    B -- 是 --> C[进入主页]
    B -- 否 --> D[跳转登录]
    D --> E[输入账号密码]
    E --> C
    C --> F[结束]`;

// 模板片段：点击后整体替换编辑器内容
export const TEMPLATES = [
  {
    label: '流程图',
    value: 'flowchart',
    code: `flowchart TD
    A[开始] --> B{是否登录?}
    B -- 是 --> C[进入主页]
    B -- 否 --> D[跳转登录]
    D --> E[输入账号密码]
    E --> C
    C --> F[结束]`,
  },
  {
    label: '时序图',
    value: 'sequence',
    code: `sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant D as 数据库
    U->>F: 点击登录
    F->>B: 发送登录请求
    B->>D: 查询用户
    D-->>B: 返回用户信息
    B-->>F: 返回 Token
    F-->>U: 登录成功`,
  },
  {
    label: '类图',
    value: 'class',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +eat()
        +sleep()
    }
    class Dog {
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    label: '状态图',
    value: 'state',
    code: `stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已支付: 用户付款
    已支付 --> 已发货: 商家发货
    已发货 --> 已签收: 用户签收
    已签收 --> [*]
    待支付 --> 已取消: 超时取消
    已取消 --> [*]`,
  },
  {
    label: '甘特图',
    value: 'gantt',
    code: `gantt
    title 项目开发进度
    dateFormat  YYYY-MM-DD
    section 需求阶段
    需求调研      :a1, 2024-01-01, 7d
    需求评审      :after a1, 2d
    section 开发阶段
    前端开发      :a2, after a1, 10d
    后端开发      :a3, after a1, 12d
    联调测试      :after a2, 5d
    section 上线
    部署上线      :after a3, 2d`,
  },
  {
    label: '饼图',
    value: 'pie',
    code: `pie title 浏览器市场占比
    "Chrome" : 65
    "Safari" : 18
    "Edge" : 8
    "Firefox" : 5
    "其他" : 4`,
  },
  {
    label: 'ER 图',
    value: 'er',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        string order_number
        date created_at
    }
    LINE-ITEM {
        int id PK
        string product
        int quantity
    }`,
  },
  {
    label: '用户旅程',
    value: 'journey',
    code: `journey
    title 用户购物之旅
    section 浏览
      打开首页: 5: 用户
      搜索商品: 4: 用户
    section 下单
      加入购物车: 5: 用户
      提交订单: 3: 用户, 系统
    section 收货
      等待发货: 2: 用户
      收到商品: 5: 用户`,
  },
];

// 主题选项（mermaid 内置主题）
export const THEME_OPTIONS = [
  { label: '默认', value: 'default' },
  { label: '暗色', value: 'dark' },
  { label: '森林', value: 'forest' },
  { label: '中性', value: 'neutral' },
];
