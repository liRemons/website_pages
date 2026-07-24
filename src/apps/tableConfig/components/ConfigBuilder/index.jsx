import React, { useState, useRef } from 'react';
import { 
  Tabs, 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Modal,
  Upload,
  Row,
  Col,
  Switch,
  InputNumber,
} from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined, 
  EyeOutlined,
  CopyOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import SearchConfig from './SearchConfig';
import TableConfig from './TableConfig';
import { 
  defaultConfig, 
  validateConfig, 
  exportConfig, 
  importConfig,
  generateExampleConfig,
} from '../../utils/configParser';
import RenderMarkdown, { initHighlighter, languagesCommon } from 'remons-render-markdown';
import 'remons-render-markdown/dist/index.css'

const { TextArea } = Input;

initHighlighter(languagesCommon);
/**
 * 配置构建器主组件
 * 用于可视化配置搜索条件和表格
 */
const ConfigBuilder = ({ onPreview, initialConfig }) => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState(initialConfig || defaultConfig);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const fileInputRef = useRef(null);

  // 更新配置
  const updateConfig = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
  };

  // 处理导出
  const handleExport = () => {
    try {
      const json = exportConfig(config);
      setJsonContent(json);
      setExportModalVisible(true);
    } catch (error) {
      message.error(error.message);
    }
  };

  // 处理导入
  const handleImport = () => {
    setJsonContent('');
    setImportModalVisible(true);
  };

  // 确认导入
  const confirmImport = () => {
    try {
      const importedConfig = importConfig(jsonContent);
      setConfig(importedConfig);
      setImportModalVisible(false);
      message.success('配置导入成功');
    } catch (error) {
      message.error(error.message);
    }
  };

  // 从文件导入
  const handleFileImport = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const importedConfig = importConfig(content);
        setConfig(importedConfig);
        message.success('配置文件导入成功');
      } catch (error) {
        message.error(`配置文件解析失败: ${error.message}`);
      }
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  // 加载示例配置
  const loadExample = () => {
    Modal.confirm({
      title: '加载示例配置',
      content: '这将覆盖当前所有配置，确定继续吗？',
      onOk: () => {
        const exampleConfig = generateExampleConfig();
        setConfig(exampleConfig);
        message.success('示例配置已加载');
      },
    });
  };

  // 清空配置
  const clearConfig = () => {
    Modal.confirm({
      title: '清空配置',
      content: '这将清空所有配置，确定继续吗？',
      onOk: () => {
        setConfig(defaultConfig);
        message.success('配置已清空');
      },
    });
  };

  // 复制到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonContent).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 下载配置文件
  const downloadConfig = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `page-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('配置文件已下载');
  };

  // 处理预览
  const handlePreview = () => {
    const validation = validateConfig(config);
    if (!validation.valid) {
      message.error(`配置验证失败: ${validation.errors.join(', ')}`);
      return;
    }
    if (onPreview) {
      onPreview(config);
    }
  };

  const items = [
    {
      key: 'search',
      label: '搜索条件配置',
      children: (
        <SearchConfig 
          value={config.searchConfig?.fields} 
          onChange={(fields) => updateConfig('searchConfig', { ...config.searchConfig, fields })}
        />
      ),
    },
    {
      key: 'table',
      label: '表格配置',
      children: (
        <TableConfig 
          value={config.tableConfig?.columns} 
          onChange={(columns) => updateConfig('tableConfig', { ...config.tableConfig, columns })}
        />
      ),
    },
    {
      key: 'page',
      label: '页面配置',
      children: (
        <Card>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="页面标题">
                  <Input 
                    value={config.pageConfig?.title} 
                    onChange={(e) => updateConfig('pageConfig', { ...config.pageConfig, title: e.target.value })}
                    placeholder="请输入页面标题"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="API 基础路径">
                  <Input 
                    value={config.pageConfig?.apiBaseUrl} 
                    onChange={(e) => updateConfig('pageConfig', { ...config.pageConfig, apiBaseUrl: e.target.value })}
                    placeholder="例如: /api"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      ),
    },
    {
      key: 'api',
      label: '接口配置',
      children: (
        <Card>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="列表接口">
                  <Input 
                    value={config.apiConfig?.list} 
                    onChange={(e) => updateConfig('apiConfig', { ...config.apiConfig, list: e.target.value })}
                    placeholder="例如: /list"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="创建接口">
                  <Input 
                    value={config.apiConfig?.create} 
                    onChange={(e) => updateConfig('apiConfig', { ...config.apiConfig, create: e.target.value })}
                    placeholder="例如: /create"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="更新接口">
                  <Input 
                    value={config.apiConfig?.update} 
                    onChange={(e) => updateConfig('apiConfig', { ...config.apiConfig, update: e.target.value })}
                    placeholder="例如: /update"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="删除接口">
                  <Input 
                    value={config.apiConfig?.delete} 
                    onChange={(e) => updateConfig('apiConfig', { ...config.apiConfig, delete: e.target.value })}
                    placeholder="例如: /delete"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="详情接口">
                  <Input 
                    value={config.apiConfig?.detail} 
                    onChange={(e) => updateConfig('apiConfig', { ...config.apiConfig, detail: e.target.value })}
                    placeholder="例如: /detail"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      ),
    },
    {
      key: 'advanced',
      label: '高级配置',
      children: (
        <Card>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="表格边框">
                  <Switch 
                    checked={config.tableConfig?.bordered} 
                    onChange={(checked) => updateConfig('tableConfig', { ...config.tableConfig, bordered: checked })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="表格尺寸">
                  <select 
                    value={config.tableConfig?.size || 'middle'} 
                    onChange={(e) => updateConfig('tableConfig', { ...config.tableConfig, size: e.target.value })}
                    style={{ width: '100%', padding: '4px 11px', borderRadius: 6, border: '1px solid #d9d9d9' }}
                  >
                    <option value="small">小</option>
                    <option value="middle">中</option>
                    <option value="large">大</option>
                  </select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="默认页大小">
                  <InputNumber 
                    min={5} 
                    max={100} 
                    value={config.tableConfig?.pagination?.defaultPageSize || 10} 
                    onChange={(value) => updateConfig('tableConfig', { 
                      ...config.tableConfig, 
                      pagination: { ...config.tableConfig?.pagination, defaultPageSize: value }
                    })}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="显示编辑按钮">
                  <Switch 
                    checked={config.tableConfig?.actions?.showEdit} 
                    onChange={(checked) => updateConfig('tableConfig', { 
                      ...config.tableConfig, 
                      actions: { ...config.tableConfig?.actions, showEdit: checked }
                    })}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="显示删除按钮">
                  <Switch 
                    checked={config.tableConfig?.actions?.showDelete} 
                    onChange={(checked) => updateConfig('tableConfig', { 
                      ...config.tableConfig, 
                      actions: { ...config.tableConfig?.actions, showDelete: checked }
                    })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="显示查看按钮">
                  <Switch 
                    checked={config.tableConfig?.actions?.showView} 
                    onChange={(checked) => updateConfig('tableConfig', { 
                      ...config.tableConfig, 
                      actions: { ...config.tableConfig?.actions, showView: checked }
                    })}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="config-builder">
      <Card 
        title="页面配置器" 
        extra={
          <Space>
            <Button icon={<FileAddOutlined />} onClick={loadExample}>
              加载示例
            </Button>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleFileImport}
            >
              <Button icon={<UploadOutlined />}>导入配置</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出配置
            </Button>
            <Button type="primary" icon={<EyeOutlined />} onClick={handlePreview}>
              预览页面
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={items}
        />
      </Card>

      {/* 导出配置弹窗 */}
      <Modal
        title="导出配置"
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copyToClipboard}>
            复制
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadConfig}>
            下载文件
          </Button>,
        ]}
        width={800}
      >
        <RenderMarkdown content={jsonContent} codeType='json' />
      </Modal>

      {/* 导入配置弹窗 */}
      <Modal
        title="导入配置"
        visible={importModalVisible}
        onOk={confirmImport}
        onCancel={() => setImportModalVisible(false)}
        width={800}
      >
        <Upload.Dragger
          accept=".json"
          showUploadList={false}
          beforeUpload={(file) => {
            handleFileImport(file);
            return false;
          }}
          style={{ marginBottom: 16 }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽配置文件到此处</p>
        </Upload.Dragger>
        <p style={{ textAlign: 'center', color: '#999', margin: '8px 0' }}>或者</p>
        <TextArea
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          placeholder="在此粘贴 JSON 配置..."
          rows={10}
          style={{ fontFamily: 'Monaco, Menlo, monospace' }}
        />
      </Modal>
    </div>
  );
};

export default ConfigBuilder;
