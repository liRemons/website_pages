import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { encrypt, DES_KEY, DES_IV } from './model/const';
import { useObserver, useLocalObservable } from 'mobx-react';
import store from './model/store';
import styled from './index.less'
import FormItem from '../../components/Form';
import 'antd/dist/antd.css';

const NormalLoginForm = () => {
  const localStore = useLocalObservable(() => store);
  const onFinish = async (values) => {
    const { pwd, account } = values
    const res = await localStore.login({
      account,
      password: encrypt({ DES_IV, DES_KEY, MSG: pwd })
    })
    if (res?.success) {
      message.success('成功')
      localStorage.setItem('REMONS_TOKEN', res.data.token);
      const params = new URLSearchParams(window.location.search);
      if (params.get('form')) {
        window.location.href = params.get('form')
      } else {
        window.location.href = window.location.origin
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