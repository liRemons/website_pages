import React, { createRef } from "react";
import { Button, message } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons'
import { Form, FormItem, ButtonBar } from 'remons-components';

export default class StatusSetting extends React.Component {

  formRef = createRef();

  onFinish = () => {
    console.log(this.formRef);
  }



  render() {
    const items = [
      { label: '状态名称', name: 'statusName', component: 'input' },
      { label: '状态颜色', name: 'color', component: 'input' },
    ]
    return <Form forwardedRef={(el) => this.formRef = el}>
      <Form.List name={'name'}>
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

      <ButtonBar isAffix>
        <Button type="primary" onClick={this.onFinish}>提交</Button>
        <Button>取消</Button>
      </ButtonBar>
    </Form>
  }
}