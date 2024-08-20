import React, { useState, useEffect, useRef } from "react";
import Container from '@components/Container';
import '@assets/css/index.global.less';
import Header from '@components/Header';
import classnames from 'classnames';
import Fixed from '@components/Fixed';
import style from './index.module.less';
import { Tabs, Modal, ConfigProvider, Button, message, Checkbox, Empty } from 'antd';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, RedoOutlined, FunctionOutlined, MinusCircleOutlined } from '@ant-design/icons';
import zhCN from 'antd/lib/locale/zh_CN';
import { FormItem, ButtonBar, Form } from 'remons-components';

const { Group: CheckboxGroup } = Checkbox;
const { confirm } = Modal;

const mockRuleCodes = [
  ['请凭', '来取'],
  ['栋', '联系电话'],
  ['取件码', '前来领取'],
  ['请凭', '到'],
];

const mockRuleAdds = [
  ['到达', '快递'],
  ['已到', '栋'],
  ['已到', '中邮驿站'],
  ['到', '领取'],
]

export default () => {
  const [visible, setVisible] = useState(false);
  const [ruleVisible, setRuleVisible] = useState(false);
  const [handleType, setHandleType] = useState('')
  const [noList, setNoList] = useState([]);
  const [yesList, setYesList] = useState([]);
  const [ruleCodes, setRuleCodes] = useState([]);
  const [ruleAdds, setRuleAdds] = useState([]);
  const [ruleTabKey, setRuleTabKey] = useState('ruleCodes')
  const [codeMatchs, setCodeMatchs] = useState([]);
  const [addMatchs, setAddMatchs] = useState([]);
  const [form] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const isMount = useRef(true)

  useEffect(() => {
    const noList = localStorage.express_no_list ? JSON.parse(localStorage.express_no_list) : []
    const yesList = localStorage.express_yes_list ? JSON.parse(localStorage.express_yes_list) : []
    setNoList(noList)
    setYesList(yesList.filter(item => (+new Date() - item.time) <= 48 * 60 * 60 * 1000))
    const ruleCodes = localStorage.rule_codes ? JSON.parse(localStorage.rule_codes) : []
    const ruleAdds = localStorage.rule_adds ? JSON.parse(localStorage.rule_adds) : []
    isMount.current = false;
    ruleForm.setFieldsValue({
      ruleCodes: ruleCodes.length ? ruleCodes : mockRuleCodes,
      ruleAdds: ruleAdds.length ? ruleAdds : mockRuleAdds
    })
    setRuleCodes(ruleCodes.length ? ruleCodes : mockRuleCodes);
    setRuleAdds(ruleAdds.length ? ruleAdds : mockRuleAdds)
  }, []);

  useEffect(() => {
    if (!isMount.current) {
      localStorage.setItem('express_no_list', JSON.stringify(noList))
    }
  }, [noList])

  useEffect(() => {
    const String2Regex = str => {
      // Main regex
      const main = str.match(/\/(.+)\/.*/)[1]
      // Regex options
      const options = str.match(/\/.+\/(.*)/)[1]
      // Return compiled regex
      return new RegExp(main, options)
    }
    localStorage.setItem('rule_codes', JSON.stringify(ruleCodes || []))
    localStorage.setItem('rule_adds', JSON.stringify(ruleAdds || []))
    setCodeMatchs(ruleCodes?.map(([start, end]) => String2Regex(`/${start}(\\S*)${end}/`)));
    setAddMatchs(ruleAdds?.map(([start, end]) => String2Regex(`/${start}(\\S*)${end}/`)));
  }, [ruleCodes, ruleAdds])

  useEffect(() => {
    if (!isMount.current) {
      localStorage.setItem('express_yes_list', JSON.stringify(yesList))
    }
  }, [yesList])

  useEffect(() => {
    if (!visible) {
      form.resetFields()
    }
  }, [visible]);

  useEffect(() => {
    if (!ruleVisible) {
      ruleForm.resetFields()
    }
  }, [ruleVisible]);

  const openModal = () => {
    setHandleType('create')
    setVisible(true)
  }

  const changeRule = () => {
    setRuleVisible(true);
    ruleForm.setFieldsValue({
      ruleCodes,
      ruleAdds
    })
  }

  const onSubmit = async () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue()
      let list = []
      if (handleType === 'edit') {
        const findIndex = noList.findIndex(item => item.code === values.code);
        noList.splice(findIndex, 1, values);
        list = [...noList]
      } else {
        if (noList.find(item => item.code === values.code)) {
          message.warning('取件码相同')
          return
        }
        list = [...noList, values];
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
      setYesList([...yesList, {...data, time: +new Date()}])
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

  const onSubmitRule = () => {
    ruleForm.validateFields().then(() => {
      setRuleCodes(ruleForm.getFieldValue('ruleCodes'))
      setRuleAdds(ruleForm.getFieldValue('ruleAdds'));
      setRuleVisible(false)
    }).catch(() => { })
  }

  const tabsItems = [
    { label: '未签收', key: 'no', children: renderNoList() },
    { label: '已签收', key: 'yes', children: renderYesList() },
  ];

  const tabsRuleItems = [
    { label: '取件码', key: 'ruleCodes' },
    { label: '地址', key: 'ruleAdds' },
  ]

  return <>
    <ConfigProvider locale={zhCN}>
      <Container
        header={<Header name='快递' />}
        main={
          <div>
            <button className="circle" onClick={openModal}>+</button>
            <div className="circle" onClick={changeRule}><FunctionOutlined /></div>
            <Tabs items={tabsItems} />
          </div>
        }
      />
      <Modal title="快递信息" open={visible} footer={false} onCancel={() => setVisible(false)}>
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
      <Modal title="解析规则设置" onCancel={() => setRuleVisible(false)} footer={false} open={ruleVisible}>
        <Tabs activeKey={ruleTabKey} items={tabsRuleItems} onChange={(key) => {
          setRuleTabKey(key)
        }} />
        <Form form={ruleForm}>
          <Form.List name={ruleTabKey}>
            {
              (fields, { add, remove }) => {
                return <>
                  {fields.map(({ key, name }) => <FormItem
                    label={`规则${name + 1}`}
                    required
                    key={key}
                  >
                    <div style={{ display: 'flex' }}>
                      <FormItem rules={[{ required: true }]} name={name} component='rangeInput' />
                      <Button type="dashed" onClick={() => remove(name)}><MinusCircleOutlined /></Button>
                    </div>
                  </FormItem>
                  )}
                  <FormItem>
                    <Button type="dashed" onClick={() => {
                      if (fields?.length > (10 - 1)) {
                        message.warning('最多可配置 10 条规则，请删除后重试')
                      } else {
                        add()
                      }
                    }}>新增</Button>
                  </FormItem>
                </>
              }
            }
          </Form.List>
          <ButtonBar>
            <Button onClick={() => setRuleVisible(false)}>取消</Button>
            <Button type="primary" onClick={onSubmitRule}>确定</Button>
          </ButtonBar>
        </Form>
      </Modal>
      <Fixed />
    </ConfigProvider>
  </>
}
