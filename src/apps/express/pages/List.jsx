import React, { useState, useEffect, useRef } from "react";
import Container from '@components/Container';
import '@assets/css/index.global.less';
import Header from '@components/Header';
import classnames from 'classnames';
import Fixed from '@components/Fixed';
import style from './index.module.less';
import { Tabs, Form, Modal, ConfigProvider, Button, message, Checkbox, Empty } from 'antd';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, RedoOutlined } from '@ant-design/icons';
import zhCN from 'antd/lib/locale/zh_CN';
import { FormItem, ButtonBar } from 'remons-components';

const { Group: CheckboxGroup } = Checkbox;
const { confirm } = Modal;

export default () => {
  const [visible, setVisible] = useState(false);
  const [handleType, setHandleType] = useState('')
  const [noList, setNoList] = useState([]);
  const [yesList, setYesList] = useState([]);
  const [form] = Form.useForm()
  const isMount = useRef(true)


  useEffect(() => {
    const noList = localStorage.express_no_list ? JSON.parse(localStorage.express_no_list) : []
    const yesList = localStorage.express_yes_list ? JSON.parse(localStorage.express_yes_list) : []
    setNoList(noList.filter(item => (+new Date() - item.time) <= 48 * 60 * 60 * 1000))
    setYesList(yesList.filter(item => (+new Date() - item.time) <= 48 * 60 * 60 * 1000))
    isMount.current = false
  }, []);

  useEffect(() => {
    if (!isMount.current) {
      localStorage.setItem('express_no_list', JSON.stringify(noList))
    }
  }, [noList])

  useEffect(() => {
    if (!isMount.current) {
      localStorage.setItem('express_yes_list', JSON.stringify(yesList))
    }
  }, [yesList])

  useEffect(() => {
    form.resetFields()
  }, [visible]);

  const openModal = () => {
    setHandleType('create')
    setVisible(true)
  }

  const onSubmit = async () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue()
      let list = []
      if (handleType === 'edit') {
        const findIndex = noList.findIndex(item => item.code === values.code);
        noList.splice(findIndex, 1, { ...values, time: +new Date() });
        list = [...noList]
      } else {
        if (noList.find(item => item.code === values.code)) {
          message.warning('取件码相同')
          return
        }
        list = [...noList, { ...values, time: +new Date() }];
      }
      setNoList(list);
      setVisible(false);
    }).catch(() => { })

  }

  const formItems = [
    { label: '短信', name: 'desc', component: 'textarea' },
    { label: '取件码', name: 'code', component: 'input' },
    { label: '地址', name: 'add', component: 'textarea' },
  ]

  const replaceText = (matchs, str) => {
    let text = '';
    let flag = false
    matchs.forEach(el => {
      if (str.match(el)?.[1] && !flag) {
        text = str.match(el)?.[1]
        flag = true
      }
    })
    return text;
  }
  const addMatchs = [
    /到达(\S*)快递/,
    /已到(\S*)栋/,
    /已到(\S*)中邮驿站/,
    /到(\S*)领取/
  ];

  const codeMatchs = [
    /请凭(\S*)来取/,
    /栋(\S*)联系电话/,
    /取件码(\S*)前来领取/,
    /请凭(\S*)到/,
  ];

  const onParse = () => {
    const { desc } = form.getFieldsValue()
    if (!desc) {
      message.warning('请填写短信');
      return;
    }
    const value = {
      add: replaceText(addMatchs, desc),
      code: replaceText(codeMatchs, desc),
      desc
    };
    form.setFieldsValue(value)
  }

  const edit = (item) => {
    setVisible(true);
    setHandleType('edit')
    form.setFieldsValue(item)
  }

  const del = (data) => {
    confirm({
      title: '确定删除吗',
      icon: <ExclamationCircleOutlined />,
      onOk() {
        const findIndex = noList.findIndex(item => item.code === data.code);
        noList.splice(findIndex, 1);
        setNoList([...noList])
      },
      onCancel() { },
    });
  }

  const changeChecked = (data, e) => {
    if (e.target.checked) {
      const findIndex = noList.findIndex(item => item.code === data.code);
      noList.splice(findIndex, 1);
      setNoList([...noList]);
      setYesList([...yesList, data])
    }
  }

  const restore = (data) => {
    const findIndex = yesList.findIndex(item => item.code === data.code);
    yesList.splice(findIndex, 1);
    setYesList([...yesList]);
    setNoList([...noList, data])
  }

  const renderNoList = () => {
    return <div>
      {noList.length ? <CheckboxGroup>
        {
          noList.map(item => {
            return <div className={style.card}>
              <span className={style.check}>
                <Checkbox value={item.code} onChange={(e) => changeChecked(item, e)} />
              </span>
              <div>
                <div className={style.code}>{item.code}</div>
                <div className={style.add}>{item.add}</div>
                <div className={style.desc}>{item.desc}</div>
              </div>
              <div className={style.handle}>
                <div className={classnames('circle')} onClick={() => edit(item)}><EditOutlined /></div>
                <div className={classnames('circle')} onClick={() => del(item)}><DeleteOutlined /></div>
              </div>
            </div>
          })
        }
      </CheckboxGroup> : <Empty />}
    </div>
  }

  const renderYesList = () => {
    return <div>
      {
        yesList.length ? yesList.map(item => {
          return <div className={style.card}>
            <div>
              <div className={style.code}>{item.code}</div>
              <div className={style.add}>{item.add}</div>
              <div className={style.desc}>{item.desc}</div>
            </div>
            <div className={style.handle}>
              <div className={classnames('circle')} onClick={() => restore(item)}><RedoOutlined /></div>
            </div>
          </div>
        }) : <Empty />
      }
    </div>
  }

  const tabsItems = [
    { label: '未领取', key: 'no', children: renderNoList() },
    { label: '已领取', key: 'yes', children: renderYesList() },
  ]
  return <>
    <ConfigProvider locale={zhCN}>
      <Container
        header={<Header name='快递' />}
        main={
          <div>
            <button className="circle" onClick={openModal}>+</button>
            <Tabs items={tabsItems} />
          </div>
        }
      />
      <Modal open={visible} footer={false} onCancel={() => setVisible(false)}>
        <Form form={form}>
          {
            formItems.map(item => <FormItem rules={[{ required: true }]} {...item} />)
          }
          <ButtonBar>
            <Button type="primary" onClick={onParse}>
              解析
            </Button>
            <Button type="primary" onClick={onSubmit}>
              确定
            </Button>
          </ButtonBar>
        </Form>
      </Modal>
      <Fixed />
    </ConfigProvider>
  </>
}
