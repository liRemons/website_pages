import React, { useState } from 'react';
import { Layout, Tabs, Card } from 'antd';
import ConfigBuilder from './components/ConfigBuilder';
import PageRenderer from './components/PageRenderer';
import { generateExampleConfig } from './utils/configParser';
import './styles/index.less';

const { Header, Content } = Layout;

/**
 * 可配置化页面系统主入口
 * 包含配置构建器和页面渲染器两个主要功能
 */
export default class TableConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'builder',
      previewConfig: null,
    };
  }

  // 处理预览
  handlePreview = (config) => {
    this.setState({
      previewConfig: config,
      activeTab: 'preview',
    });
  };

  // 返回配置器
  handleBackToBuilder = () => {
    this.setState({
      activeTab: 'builder',
    });
  };

  render() {
    const { activeTab, previewConfig } = this.state;

    const items = [
      {
        key: 'builder',
        label: '配置器',
        children: (
          <ConfigBuilder 
            onPreview={this.handlePreview}
            initialConfig={previewConfig}
          />
        ),
      },
      {
        key: 'preview',
        label: '预览',
        children: (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <a onClick={this.handleBackToBuilder}>← 返回配置器</a>
            </Card>
            <PageRenderer config={previewConfig} />
          </div>
        ),
      },
    ];

    return (
      <Layout className="table-config-app">
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, lineHeight: '64px' }}>可配置化页面系统</h2>
        </Header>
        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => this.setState({ activeTab: key })}
            items={items}
          />
        </Content>
      </Layout>
    );
  }
}