import React, { useState } from 'react';
import Container from '@components/Container';
import Fixed from '@components/Fixed';
import Header from '@components/Header';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { ToolBar, ActionList } from 'remons-components';
import { Table, Input } from 'antd';
import 'antd/dist/antd.css';

export default function App() {
  const [list, setList] = useState([]);
  const [url, setUrl] = useState('');
  const [location, setLocation] = useState('');

  const actions = [
    { key: 'del', icon: <DeleteOutlined /> }
  ]

  const onChangeInput = (val, key, index) => {
    list[index][key] = val;
    setList([...list])
  }

  const inputUrl = (e) => {
    setUrl(e.target.value)
  }

  const columns = [
    {
      dataIndex: 'urlKey', title: 'key', render: (val, record, index) => <Input value={val} onChange={(e) => onChangeInput(e.target.value, 'urlKey', index)} />
    },
    { dataIndex: 'value', title: 'value', render: (val, record, index) => <Input value={val} onChange={(e) => onChangeInput(e.target.value, 'value', index)} /> },
    { dataIndex: '', title: '操作', render: (val, _, index) => <ActionList actions={actions} onActionClick={(key, data) => onActionClick(key, data, index)} /> }
  ]

  const leftActionList = [
    {
      key: 'add',
      type: 'primary',
      icon: <PlusOutlined />
    },
    {
      label: '转 Table',
      key: 'toTable',
      type: 'primary',
    },
    {
      label: '生成',
      key: 'create',
      type: 'primary',
    }
  ]

  const getSearchParams = (name, url) => {
    if (!url) {
      return
    }
    setLocation(url.split('?')[0])
    const params = new URLSearchParams(decodeURI(url.split('?')[1]));
    const obj = {};
    const keys = [...params.keys()];
    keys.forEach((key) => {
      obj[key] = params.get(key);
    });
    return !name ? obj : params.get(name);
  };

  const onActionClick = (key, data, index) => {
    if (key === 'add') {
      list.push({});
      setList([...list])
    }

    if (key === 'del') {
      list.splice(index, 1);
      setList([...list])
    }

    if (key === 'create') {
      const obj = {};
      list.forEach(item => {
        item.value ? obj[item.urlKey] = item.value : ''
      })
      const { origin, pathname } = window.location
      const newParams = new URLSearchParams(obj);
      setUrl(`${location || (origin + pathname)}?${newParams.toString()}`)
    }

    if (key === 'toTable') {
      const search = getSearchParams('', url)
      let arr = [];
      for (const key in search) {
        arr.push({
          urlKey: key,
          value: search[key]
        })
      }
      setList(arr);
    }

  }

  const renderMain = () => {
    return <>
      <Input.TextArea value={url} onChange={inputUrl} placeholder='请输入' />
      <ToolBar leftActionList={leftActionList} onActionClick={onActionClick} />
      <Table pagination={false} bordered columns={columns} dataSource={list} />
    </>
  }

  return <> <Container
    header={<Header name='URL转编码' />}
    main={renderMain()}
  />
    <Fixed />
  </>;
}
