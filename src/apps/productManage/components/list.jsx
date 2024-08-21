import React from 'react';
import { message, Modal, Alert } from 'antd';
import Marquee from 'react-fast-marquee';
import copy from 'copy-to-clipboard';
import AddForm from './addForm';
import AddPlatForm from './addPlatForm';
import AddStatus from './addStatus';
import orderby from 'lodash.orderby'
import { ToolBar, Descriptions, Layout, SearchForm, FormItem } from 'remons-components';
import dayjs from 'dayjs';
import { IsPC } from 'methods-r';
import zhCN from 'antd/lib/locale/zh_CN';
import { ConfigProvider } from 'antd';
import Container from '@components/Container';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import { CopyOutlined, SettingOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { listKey, plantFormKey, statusKey, bannerVisibleKey } from '../model/const';
import './index.less';
import style from './index.module.less';
import doudian from '../assets/doudian.svg';
import pinduoduo from '../assets/pinduoduo.svg';
import douyin from '../assets/douyin.svg';
import xiaohongshu from '../assets/xiaohongshu.svg';
import taobao from '../assets/taobao.svg';

const { Section } = Layout;

const shopMapIcon = {
  '抖音': douyin,
  '拼多多': pinduoduo,
  '抖店': doudian,
  '小红书': xiaohongshu,
  '淘宝': taobao,
}

export default class ProductManage extends React.Component {
  state = {
    visible: false,
    handleType: 'add',
    platformVisible: false,
    statusVisible: false,
    plantFormOptions: [],
    statusOptions: [],
    statusObj: {},
    list: [],
    listItem: {},
    isFold: false,
    bannerVisible: false,
  }

  get list() {
    const list = JSON.parse(localStorage.getItem(listKey) || '[]')
    const newList = list.filter(item => !dayjs(item.createTime).isBefore(dayjs().subtract(30, 'day')))
    localStorage.setItem(listKey, JSON.stringify(newList));
    return newList;
  }

  componentDidMount() {
    this.updateState()
  }

  onActionClick = (key, data) => {
    const handleMap = {
      addForm: this.addForm,
      addPlatform: this.addPlatform,
      addStatus: this.addStatus,
      fold: this.handleFold
    }
    handleMap[key]?.();
  }

  handleFold = () => {
    const { isFold } = this.state;
    this.setState({
      isFold: !isFold
    })
  }

  onHandleActionClick = (key, data, val) => {
    const handleMap = {
      edit: this.edit,
      del: this.del
    }
    if (handleMap[key]) {
      handleMap[key](val)
    }
  }

  edit = (data) => {
    this.setState({ visible: true, handleType: 'edit', listItem: data });
  }

  del = (data) => {
    Modal.confirm({
      title: '确定删除吗?',
      onOk: () => {
        const list = this.list;
        const findIndex = list.findIndex(item => item.shopNo === data.shopNo)
        list.splice(findIndex, 1)
        localStorage.setItem(listKey, JSON.stringify(list));
        this.updateState();
      }
    })
  }

  addForm = () => {
    this.setState({ visible: true, handleType: 'add' });
  }

  addPlatform = () => {
    this.setState({ platformVisible: true })
  }

  addStatus = () => {
    this.setState({ statusVisible: true })
  }

  onClose = () => {
    this.setState({ statusVisible: false, platformVisible: false, visible: false })
  }

  bannerAfterClose = () => {
    this.setState({
      bannerVisible: false,
    })
    localStorage[bannerVisibleKey] = +new Date();
    message.success('7 天内不再提醒')
  }

  updateState = () => {
    const localPlantForm = JSON.parse(localStorage.getItem(plantFormKey) || '[]');
    const localStatus = JSON.parse(localStorage.getItem(statusKey) || '[]');
    const bannerVisibleTime = localStorage[bannerVisibleKey];
    let bannerVisible = false;

    if (bannerVisibleTime) {
      if (dayjs(+bannerVisibleTime).isBefore(dayjs().subtract(7, 'day'))) {
        bannerVisible = true
      } else {
        bannerVisible = false
      }
    } else {
      bannerVisible = true;
    }

    this.setState({
      bannerVisible,
    })

    if (!localPlantForm.length || !localStatus.length) {
      const arr = [];
      if (!localPlantForm.length) {
        arr.push('平台/店铺');
      }
      if (!localStatus.length) {
        arr.push('状态');
      }
      Modal.warning({
        autoFocusButton: false,
        title: `您还未设置 ${arr.join('、')} ;请点击顶部设置按钮设置完成后再新增订单`,
      })
      return;
    }

    this.setState({
      plantFormOptions: localPlantForm?.map(item => ({
        label: item.name,
        value: item.name
      })),
      statusOptions: localStatus?.map(item => ({
        label: item.name,
        value: item.name,
        color: item.color,
      })),
      statusObj: localStatus?.reduce((prev, item) => {
        return {
          ...prev,
          [item.name]: item.color || '#fff'
        }
      }, {}),
      list: this.list
    });
  }

  onSearch = (val) => {
    const list = this.list;
    const newList = list.filter(item => {
      let flag = true;
      for (const key in val) {
        if (val[key]) {
          if (!(item[key] === val[key] || (item[key] || '').includes(val[key]))) {
            flag = false
          }
        }
      }
      return flag;
    });

    this.setState({
      list: newList
    })
  }

  onReset = () => {
    this.updateState();
  }

  onCopy = (text) => {
    copy(text);
    message.success('复制成功')
  }

  render() {
    const { visible, platformVisible, statusVisible, list, isFold, bannerVisible, ...others } = this.state;
    const leftActionList = [
      {
        label: <PlusOutlined />,
        key: 'addForm',
        icon: <SettingOutlined />,
        children: [
          {
            label: '设置平台/店铺',
            type: 'primary',
            key: 'addPlatform'
          },
          {
            label: '设置状态',
            type: 'primary',
            key: 'addStatus'
          },
          {
            label: !isFold ? '详细模式' : '简洁模式',
            type: 'primary',
            key: 'fold'
          }
        ]
      }
    ]

    const handleActionList = [
      {
        label: <EditOutlined />,
        key: 'edit',
        type: 'link'
      },
      {
        label: <DeleteOutlined />,
        key: 'del',
        type: 'link',
        danger: true
      },
    ];


    const renderCopy = (name, val = '', isCopy = true) => {
      if (!val) {
        return
      }
      return <>
        {
          (val.split(val.includes(',') ? ',' : '，').map(item => <div>
            {item} {isCopy && <>&nbsp;<CopyOutlined onClick={() => this.onCopy(item)} /></>}
          </div>))
        }
      </>
    }

    const renderStatus = (name, value) => {
      const { statusObj } = this.state;
      return <span className={style.colorTag} style={{ background: statusObj[value] }}>{value}</span>
    }

    const columns = [
      { name: 'platform', label: '平台/店铺', visible: isFold },
      { name: 'purchaseNo', label: '采购单号', render: renderCopy },
      { name: 'expressNo', label: '快递单号', render: renderCopy },
      { name: 'status', label: '状态', render: renderStatus },
      { name: 'count', label: '订单数量' },
      { name: 'totalPrice', label: '总价', visible: isFold },
      { name: 'createTime', label: '时间', render: (name, val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'), visible: isFold },
      { name: 'remark', label: '备注', visible: isFold },
    ].filter(item => item.visible !== false);

    const items = [
      { name: 'shopNo', label: '订单号', component: 'input' },
      { name: 'purchaseNo', label: '采购单号', component: 'input' },
      { name: 'expressNo', label: '快递单号', component: 'input' },
      { name: 'status', label: '状态', component: 'select', componentProps: { options: others.statusOptions } },
      { name: 'platform', label: '平台/店铺', component: 'select', componentProps: { options: others.plantFormOptions } },
    ]

    const formLayout = {
      labelCol: {
        span: 4,
      },
      wrapperCol: {
        span: 20,
      },
    };

    return <ConfigProvider locale={zhCN}>
      {
        bannerVisible && <Alert
          closable
          banner
          onClose={this.bannerAfterClose}
          message={
            <Marquee pauseOnHover gradient={false}>
              温馨提示：1. 为了保证您能正常的使用该功能，请新增订单前先设置平台和状态。2. 订单仅保存在本地不会上传服务器，请勿清理浏览器缓存以防数据丢失。3. 为节约空间，默认清理30天前的订单列表。
            </Marquee>
          }
        />
      }
      <Container
        header={<Header name='订单关联' leftPath={`/${APP_NAME}/tool`} />}
        main={
          <>
            <SearchForm cols={2} {...formLayout} rows={IsPC() ? 2 : 1} onSearch={this.onSearch} onReset={this.onReset}>
              {items.map((item) => (
                <FormItem {...item} key={item.name} />
              ))}
            </SearchForm>
            <ToolBar
              className={style.setting}
              bordered={false}
              onActionClick={this.onActionClick}
              leftActionList={leftActionList}
            />
            {
              orderby(list, 'shopNo', 'desc').map(item => {
                return <Section className={style.list} title={<div className={style.platformRender}>
                  <span>
                    {shopMapIcon[item.platform] && <img src={shopMapIcon[item.platform]} alt="" />}
                    {`订单号: `}
                    <div className={style.shopNo}>{renderCopy('', item.shopNo)}</div>
                  </span>
                  <span>
                    {
                      handleActionList.map(el => <span className={style.handle} onClick={() => this.onHandleActionClick(el.key, el, item)}>{el.label}</span>)
                    }
                  </span>
                </div>}>
                  <Descriptions
                    className="productManage-list"
                    bordered
                    dataSource={item}
                    columns={columns}
                  />
                </Section>
              })
            }</>}
      ></Container>
      <Fixed />
      <Modal destroyOnClose footer={false} open={visible} title={others.handleType === 'edit' ? <span className={style.addFormTitle}>订单: <div>{renderCopy('', others.listItem.shopNo, false)}</div></span> : '新增订单'} onCancel={this.onClose}>
        <AddForm {...others} onClose={this.onClose} updateState={this.updateState} />
      </Modal>
      <Modal destroyOnClose footer={false} open={platformVisible} title="管理平台/店铺" onCancel={this.onClose}>
        <AddPlatForm onClose={this.onClose} updateState={this.updateState} />
      </Modal>
      <Modal destroyOnClose footer={false} open={statusVisible} title="管理状态" onCancel={this.onClose}>
        <AddStatus onClose={this.onClose} updateState={this.updateState} />
      </Modal>
    </ConfigProvider>
  }
}
