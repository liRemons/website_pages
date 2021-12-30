import React from 'react';
import { Form } from 'antd';
import { Com } from './const';
export default class FormItem extends React.Component {
  render() {
    const { label, name, component, ...rest } = this.props;
    const ReCompont = Com[component];
    return (
      <Form.Item {...this.props}>
        <ReCompont {...rest}></ReCompont>
      </Form.Item>
    );
  }
}
