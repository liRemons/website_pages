import React from 'react';
import { ConfigProvider, Modal } from 'antd';
import Container from '@components/Container';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import zhCN from 'antd/lib/locale/zh_CN';
import { IsPC } from 'methods-r';
import { ActionList, Layout, SearchForm, FormItem, Descriptions } from 'remons-components';
import StatusSetting from './components/statusSetting'
const { Section } = Layout;

export default class List extends React.Component {

  state = {
    shopSettingVisible: false,
    statusSettingVisible: false,
  }

  shopSetting = () => {
    this.setState({
      shopSettingVisible: true
    })
  }

  closeStatusSetting = () => {
    this.setState({
      statusSettingVisible: false
    })
  }

  statusSetting = () => {
    this.setState({
      statusSettingVisible: true
    })
  }

  onActionClick = (key) => {
    const clickByType = {
      shopType: this.shopSetting,
      status: this.statusSetting
    }

    clickByType[key] && clickByType[key]()
  }

  render() {
    const { shopSettingVisible, statusSettingVisible } = this.state;

    const actions = [
      {
        key: 'config',
        label: '设置',
        type: 'primary',
        children: [
          {
            key: 'shopType',
            label: '店铺类型',
            type: 'primary',
          },
          {
            key: 'status',
            label: '状态管理',
            type: 'primary',
          },
        ]
      },
    ];


    const items = [
      {
        name: 'orderNo', component: 'input', label: '订单编号',
      },
      {
        name: 'procurementOrderNo', component: 'input', label: '采购单号',
      },
      {
        name: 'orderStatus', component: 'select', label: '订单状态'
      },
      {
        name: 'expressOrderNo', component: 'input', label: '快递单号'
      }
    ];

    const columns = [
      {
        label: '订单编号',
        name: 'orderNo'
      },
      {
        label: '采购单号',
        name: 'procurementOrderNo'
      },
      {
        label: '订单状态',
        name: 'orderStatus'
      },
      {
        label: '快递单号',
        name: 'expressOrderNo'
      },
    ]
    return <ConfigProvider locale={zhCN}>
      <Container
        style={{ padding: '0 0 10px 0' }}
        header={<Header name='订单关联' leftPath={`/${APP_NAME}/tool`} />}
        main={<>
          <Layout style={{ background: 'transparent' }}>
            <ActionList onActionClick={this.onActionClick} actions={actions} />
            <SearchForm cols={IsPC() ? 3 : 2} rows={IsPC() ? 2 : 1}>
              {
                items.map(item => <FormItem key={item.name} {...item} />)
              }
            </SearchForm>
            <Section>
              <Descriptions columns={columns} dataSource={{
                orderNo: '1133'
              }} />
            </Section>
            <Section>
              <Descriptions columns={columns} dataSource={{
                orderNo: '1133'
              }} />
            </Section>
          </Layout>
          <Modal
            title="订单状态"
            open={statusSettingVisible}
            onClose={this.closeStatusSetting}
            onCancel={this.closeStatusSetting}
            footer={false}
          >
            <StatusSetting />
          </Modal>
        </>}
      />
      <Fixed />


    </ConfigProvider>
  }
}