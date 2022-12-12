import React, { useEffect } from "react";
import dayjs from 'dayjs';
import { ConfigProvider } from 'antd';
import Container from '@components/Container';
import Header from '@components/Header';
import Fixed from '@components/Fixed';
import { Form, FormItem, Layout } from 'remons-components';
import zhCN from 'antd/lib/locale/zh_CN';
import './index.module.less'

const { Section } = Layout;


export default () => {
  const [form] = Form.useForm();

  useEffect(() => {
     const timer = setInterval(() => {
        form.setFieldValue('nowDate', dayjs())
      }, 1000)
      return () => {
        clearInterval(timer)
      }
  }, []);

  const layout = {
    labelCol: {
      span: 8
    },
    wrapperCol: {
      span: 8
    }
  }

  const changeTime = (val) => {
    if (val?.length) {
      const [startTime, endTime] = val;
      const diff = Math.abs(startTime.diff(endTime, 'minute'));
      const diffhour = Math.floor(diff / 60);
      const minute = diff % 60;
      form.setFieldValue('diffTime', `${diffhour}小时${minute}分`)
    }
  }

  const changeHourCount = (val) => {
    if(val > 0) {
      form.setFieldValue('timeCount', dayjs().add(val, 'hour'));
      return;
    }
    if(val < 0) {
      form.setFieldValue('timeCount', dayjs().subtract(val, 'hour'));
      return;
    }
    form.setFieldValue('timeCount', dayjs());
  }

  return <ConfigProvider locale={zhCN}>
     <Container
      style={{ padding: '0 0 10px 0' }}
      header={<Header name='时间处理' leftPath={`/${APP_NAME}/tool`} />}
      main={
        <Form {...layout} form={form}>
        <Layout style={{ background: 'transparent' }}>
          <Section title="当前时间" subTitle="当前时间">
            <FormItem
              label='当前时间'
              componentProps={{ disabled: true, showTime: true }}
              name='nowDate'
              component='datePicker'
            />
          </Section>
          <Section title="时间差值" subTitle="两个时间的差值">
            <FormItem
              label='日期'
              name='date'
              component='rangePicker'
              componentProps={{
                ranges: {
                  '默认计算': [dayjs(), dayjs().add(1, 'day').hour(7).minute(20).second(0)],
                },
                showTime: { format: 'HH:mm' },
                onChange: changeTime
              }}
            />
            <FormItem name='diffTime' label='日期计算结果' component='input' />
          </Section>
          <Section title='时间推算' subTitle='指定小时推算时间'>
            <FormItem name='hourCount' label='加减小时数' component='inputNumber' componentProps={{ onChange: changeHourCount }} />
            <FormItem name='timeCount' label='计算时间' component='datePicker' componentProps={{ showTime: true }} />
          </Section>
        </Layout>
      </Form>
      }
    />
    <Fixed />
   

  </ConfigProvider>
}
