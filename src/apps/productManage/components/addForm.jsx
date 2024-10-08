import React, { createRef } from 'react';
import { FormItem } from 'remons-components';
import { Button, Form, message } from 'antd';
import dayjs from 'dayjs';
import { listKey } from '../model/const';

export default class AddForm extends React.Component {
  ref = createRef();

  get field() {
    return this.ref.current || {};
  }

  componentDidMount() {
    const { handleType, listItem, plantFormOptions = [], statusOptions = [] } = this.props;
    if (handleType === 'edit') {
      const { createTime, ...others } = listItem
      this.field.setFieldsValue({ ...others, createTime: dayjs(createTime) })
    }

    if (handleType === 'add') {
      const firstPlatform = plantFormOptions[0]?.value;
      const firstStatus = statusOptions[0]?.value;
      this.field.setFieldsValue({ platform: firstPlatform, status: firstStatus, count: 1, createTime: dayjs() })
    }
  }

  onFinish = (values) => {
    const { listItem, handleType } = this.props;
    const list = JSON.parse(localStorage.getItem(listKey) || '[]')
    if (handleType === 'edit') {
      const findIndex = list.findIndex(item => item.shopNo === listItem.shopNo)
      list.splice(findIndex, 1, values)
      localStorage.setItem(listKey, JSON.stringify(list));
    } else {
      if (values.shopNo && list.map(item => item.shopNo).includes(values.shopNo)) {
        message.error('订单号不能相同');
        return;
      }
      if (values.purchaseNo && list.map(item => item.purchaseNo).includes(values.purchaseNo)) {
        message.error('采购单号不能相同');
        return;
      }
      if (values.expressNo && list.map(item => item.expressNo).includes(values.expressNo)) {
        message.error('快递单号不能相同');
        return;
      }

      localStorage.setItem(listKey, JSON.stringify([...list, values]));
    }

    this.props.onClose();
    this.props.updateState();
  }

  render() {
    const { plantFormOptions, statusOptions } = this.props;
    const items = [
      {
        name: 'platform',
        label: '平台/店铺',
        component: 'select',
        componentProps: {
          options: plantFormOptions
        }
      },
      { name: 'shopNo', label: '订单号', component: 'textarea', placeholder: '多个以逗号分割' },
      { name: 'purchaseNo', label: '采购单号', component: 'textarea', placeholder: '多个以逗号分割' },
      { name: 'expressNo', label: '快递单号', component: 'textarea', placeholder: '多个以逗号分割' },
      { name: 'status', label: '状态', component: 'select', componentProps: { options: statusOptions } },
      { name: 'count', label: '订单数量', component: 'inputNumber'},
      { name: 'totalPrice', label: '总价', component: 'inputNumber', componentProps: { min: 0,  prefix: '￥', precision: 2 } },
      { name: 'createTime', label: '时间', component: 'datePicker', componentProps: { showTime: true, placement: 'topLeft' } },
      { name: 'remark', label: '备注', component: 'textarea' },
    ];

    const formLayout = {
      labelCol: {
        span: 4,
      },
      wrapperCol: {
        span: 20,
      },
    };

    return <Form ref={this.ref} {...formLayout} onFinish={this.onFinish}>
      {
        items.map(item => <FormItem key={item.name} {...item} />)
      }

      <Form.Item>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  }
}
