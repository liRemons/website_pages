import React, { useState } from 'react';
import { Form, Button, message, Popover, Modal } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { encrypt, DES_KEY, DES_IV } from './model/const';
import { useLocalObservable } from 'mobx-react-lite';
import store from './model/store';
import styled from './index.module.less'
import FormItem from '../../components/Form';
import { USER_TOKEN } from '@/utils';
import { openApp, isApp } from '@utils/nav';
import { IsPC } from 'methods-r';
// 通用主题变量与全局背景（body/html 的动图背景定义在 index.global.less 中）
import '@assets/css/index.global.less';

// 联系开发者图片：远程链接
const CONTACT_IMG = 'https://remons.cn:3008/upload/info/d0b992086bc33f850a9e3e03c7e32216.jpg';
// 移动端没有 hover，弹层改为点击触发
const IS_PC = IsPC();

// hover 气泡与移动端弹窗共用的内容
const ContactTip = () => (
  <div className={styled.contactCard}>
    <img className={styled.contactThumb} src={CONTACT_IMG} alt="联系开发者" />
    <p className={styled.contactTip}>
      扫码添加开发者微信，备注来意：
      <br />
      新增用户 / 问题反馈 / 新功能建议
    </p>
  </div>
);

const NormalLoginForm = () => {
  const [contactVisible, setContactVisible] = useState(false);
  const localStore = useLocalObservable(() => store);
  const onFinish = async (values) => {
    const { pwd, account } = values
    const res = await localStore.login({
      account,
      password: encrypt({ DES_IV, DES_KEY, MSG: pwd })
    })

    if (res?.success) {
      message.success('成功')
      localStorage.setItem(USER_TOKEN, res.data.token);
      const params = new URLSearchParams(window.location.search);
      if (params.get('from')) {
        // from 可能是站内路径或完整 URL，openApp 会按环境正确解析
        openApp({ url: params.get('from') });
      } else {
        // App 下 window.location.origin 为 "null"，跳回 note
        openApp({ url: isApp() ? '/note' : window.location.origin });
      }
    }
  };

  const items = [
    {
      label: '',
      name: 'account',
      component: 'input',
      rules: [
        {
          required: true,
          message: '请输入账号!',
        },
      ],
      componentProps: {
        prefix: <UserOutlined />,
        placeholder: '账号'
      }
    },
    {
      label: '',
      name: 'pwd',
      component: 'inputPassword',
      rules: [
        {
          required: true,
          message: '请输入密码!',
        },
      ],
      required: true,
      componentProps: {
        prefix: <LockOutlined />,
        placeholder: '密码'
      }
    }
  ]

  return (
    <div className={styled.login}>
      <div className={styled.contactWrap}>
        {/* PC：hover 出 Popover；移动端：点击出 Modal（hover 在触屏不存在） */}
        <Popover
          placement="bottomRight"
          trigger={IS_PC ? 'hover' : []}
          content={<ContactTip />}
        >
          <Button
            icon={<PhoneOutlined />}
            onClick={() => !IS_PC && setContactVisible(true)}
          >
            联系开发者
          </Button>
        </Popover>
        <Modal
          open={contactVisible}
          footer={null}
          width="auto"
          title="联系开发者"
          onCancel={() => setContactVisible(false)}
        >
          <ContactTip />
        </Modal>
      </div>
      <img className={styled.loginImg} src={require('./assets/login.svg')} alt="login" />
      <Form
        name="normal_login"
        className="login-form"
        initialValues={{
          remember: true,
        }}
        onFinish={onFinish}
      >
        {
          items.map(item => <FormItem {...item} />)
        }
        <Form.Item>
          <Button type="primary" htmlType="submit" className="login-form-button">
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>

  );
};


export default NormalLoginForm