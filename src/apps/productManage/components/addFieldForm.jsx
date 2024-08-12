import React, { createRef } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, ColorPicker } from 'antd';
const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 20,
      offset: 4,
    },
  },
};


class AddFieldForm extends React.Component {
  ref = createRef()

  state = {
    value: []
  }

  get field() {
    return this.ref.current || {};
  }

  componentDidMount() {
    const { localStorageKey } = this.props;
    if (localStorage.getItem(localStorageKey)) {
      this.field.setFieldsValue({ names: JSON.parse(localStorage.getItem(localStorageKey)) })
    } else {
      this.field.setFieldsValue({ names: [] })
    }
  }

  onFinish = (values) => {
    const { localStorageKey, type } = this.props;
    const { names } = values || {};


    const formatValues = names.map(item => {
      let color = null
      if (type === 'status') {
        if (typeof item.color === 'object') {
          const { r, g, b } = item.color.toRgb();
          color = `rgba(${r},${g}, ${b}, ${0.3})`
        } else {
          color = item.color
        }
      }

      return {
        ...item,
        ...(type === 'status' ? { color } : {})
      }
    })

    localStorage.setItem(localStorageKey, JSON.stringify(formatValues));
    this.props.onClose?.();
    this.props.updateState?.();
  };

  render() {
    const { label, type } = this.props;
    return (
      <Form ref={this.ref} {...formItemLayoutWithOutLabel} onFinish={this.onFinish}>
        <Form.List name="names">
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field, index) => (
                <div className="product-manage-list-field">
                  <Form.Item
                    {...field}
                    name={[field.name, 'name']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: `请输入${label}`,
                      },
                    ]}
                    noStyle
                  >
                    <Input
                      placeholder={`请输入${label}`}
                      style={{
                        width: '80%',
                      }}
                    />
                  </Form.Item>
                  {type === 'status' && <Form.Item
                    {...field}
                    name={[field.name, 'color']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                    noStyle
                  >
                    <ColorPicker disabledAlpha format="hex" />
                  </Form.Item>}
                  {
                    fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    )
                  }
                </div>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  shape="circle"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
export default AddFieldForm;