import React from 'react';
import { Form } from 'antd';
import { Com } from './const';
export default class FormItem extends React.Component {
  render() {
    const { component, componentProps, ...others } = this.props;
    const ReCompont = Com[component];
    return (
      <Form.Item {...others}>
        <ReCompont {...componentProps}></ReCompont>
      </Form.Item>
    );
  }
}
