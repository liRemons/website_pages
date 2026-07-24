import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, message, Button, Space, Modal, Tabs, Tree } from 'antd';
import {
  CodeOutlined,
  DownloadOutlined,
  FolderOutlined,
  FileOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import SearchForm from './SearchForm';
import DataTable from './DataTable';
import { validateConfig } from '../../utils/configParser';
import { generateReactCode, generateProjectFiles } from '../../utils/codeGenerator';
import './ResizablePanels.less';
import RenderMarkdown, { initHighlighter, languagesCommon } from 'remons-render-markdown';
import 'remons-render-markdown/dist/index.css'

initHighlighter(languagesCommon);
/**
 * 可拖拽调整大小的面板组件
 */
const ResizablePanels = ({ leftPanel, rightPanel, initialLeftWidth = 250, minLeftWidth = 200, maxLeftWidth = 500 }) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    // 计算相对于容器的位置
    let newLeftWidth = e.clientX - containerRect.left;

    // 限制在最小和最大宽度之间
    newLeftWidth = Math.max(minLeftWidth, Math.min(newLeftWidth, maxLeftWidth));

    setLeftWidth(newLeftWidth);
  }, [isResizing, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="resizable-panels"
      style={{ display: 'flex', height: 600, position: 'relative' }}
    >
      {/* 左侧面板 */}
      <div
        className="left-panel"
        style={{
          width: leftWidth,
          minWidth: leftWidth,
          maxWidth: leftWidth,
          borderRight: '1px solid #f0f0f0',
          padding: '0 16px 16px 0',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {leftPanel}
      </div>

      {/* 拖拽条 - 放在左侧面板右侧边缘 */}
      <div
        className="resize-handle"
        onMouseDown={handleMouseDown}
        style={{
          width: 8,
          cursor: 'col-resize',
          background: isResizing ? '#1890ff' : 'transparent',
          position: 'absolute',
          left: leftWidth - 4,
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'background 0.2s',
        }}
        title="拖拽调整大小"
      />

      {/* 右侧面板 */}
      <div
        className="right-panel"
        style={{
          flex: 1,
          paddingLeft: 16,
          overflow: 'auto',
          marginLeft: 0,
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

/**
 * 页面渲染器主组件
 * 根据 JSON 配置渲染完整的增删改查页面
 */
const PageRenderer = ({ config, mode = 'preview' }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportType, setExportType] = useState('files');
  const [selectedFile, setSelectedFile] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState({});

  // 验证配置
  useEffect(() => {
    if (config) {
      const validation = validateConfig(config);
      if (!validation.valid) {
        message.error(`配置错误: ${validation.errors.join(', ')}`);
      }
    }
  }, [config]);

  // 生成代码
  useEffect(() => {
    if (config) {
      const code = generateReactCode(config);
      const files = generateProjectFiles(config);
      setGeneratedCode(code);
      setGeneratedFiles(files);
      // 默认选中第一个文件
      const firstFile = Object.keys(files)[0];
      setSelectedFile(firstFile);
    }
  }, [config]);

  // 模拟加载数据
  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const mockData = generateMockData(config, params);
      setData(mockData.data);
      setPagination(prev => ({
        ...prev,
        total: mockData.total,
      }));
    } catch (error) {
      message.error('加载数据失败');
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  }, [config, searchParams, pagination.current, pagination.pageSize]);

  // 生成模拟数据
  const generateMockData = (config, params) => {
    const { tableConfig } = config || {};
    const columns = tableConfig?.columns || [];
    const pageSize = pagination.pageSize;
    const total = 56;

    const data = [];
    const start = (pagination.current - 1) * pageSize;

    for (let i = 0; i < pageSize; i++) {
      const index = start + i;
      if (index >= total) break;

      const record = { id: index + 1 };
      columns.forEach(col => {
        if (col.dataIndex) {
          record[col.dataIndex] = generateMockValue(col.dataIndex, index);
        }
      });
      data.push(record);
    }

    return { data, total };
  };

  // 生成模拟值
  const generateMockValue = (dataIndex, index) => {
    const mockValues = {
      username: `用户${index + 1}`,
      email: `user${index + 1}@example.com`,
      phone: `1380013${String(index + 1000).slice(-4)}`,
      status: index % 3 === 0 ? 'active' : 'inactive',
      createTime: new Date(Date.now() - index * 86400000).toISOString(),
      amount: Math.floor(Math.random() * 10000),
      address: `北京市朝阳区${index + 1}号`,
      description: `这是第${index + 1}条数据的描述信息`,
    };

    return mockValues[dataIndex] || `值${index + 1}`;
  };

  // 初始加载
  useEffect(() => {
    if (config) {
      fetchData();
    }
  }, [config, fetchData]);

  const handleSearch = (values) => {
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData(values);
  };

  const handleReset = () => {
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData({});
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchData();
  };

  const handleEdit = (record) => {
    message.success(`编辑记录: ${record.id}`);
    fetchData();
  };

  const handleDelete = (record) => {
    message.success(`删除记录: ${record.id}`);
    fetchData();
  };

  const handleCreate = () => {
    message.success('打开新增弹窗');
  };

  const handleOpenExport = () => {
    setExportModalVisible(true);
  };

  // 下载单个文件
  const downloadFile = (filename, content) => {
    const extension = filename.split('.').pop();
    const mimeTypes = {
      jsx: 'text/javascript',
      js: 'text/javascript',
      json: 'application/json',
      md: 'text/markdown',
      less: 'text/css',
    };

    const blob = new Blob([content], { type: mimeTypes[extension] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(`${filename} 已下载`);
  };

  // 下载所有文件
  const downloadAllFiles = () => {
    Object.entries(generatedFiles).forEach(([filename, content]) => {
      downloadFile(filename, content);
    });
  };

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 构建文件树
  const buildFileTree = () => {
    const treeData = [];
    const paths = Object.keys(generatedFiles);

    paths.forEach(path => {
      const parts = path.split('/');
      let currentLevel = treeData;
      let currentPath = '';

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        const existingNode = currentLevel.find(node => node.title === part);

        if (existingNode && !isFile) {
          currentLevel = existingNode.children;
        } else if (!existingNode) {
          const newNode = {
            title: part,
            key: currentPath,
            icon: isFile ? <FileOutlined /> : <FolderOutlined />,
            isLeaf: isFile,
          };

          if (!isFile) {
            newNode.children = [];
          }

          currentLevel.push(newNode);

          if (!isFile) {
            currentLevel = newNode.children;
          }
        }
      });
    });

    return treeData;
  };

  if (!config) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无配置，请先配置页面
        </div>
      </Card>
    );
  }

  const { pageConfig, searchConfig, tableConfig } = config;

  // 左侧文件树面板
  const leftPanel = (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={downloadAllFiles}
          size="small"
          block
        >
          下载全部
        </Button>
      </div>
      <Tree
        treeData={buildFileTree()}
        defaultExpandAll
        onSelect={(selectedKeys) => {
          if (selectedKeys.length > 0) {
            setSelectedFile(selectedKeys[0]);
          }
        }}
        selectedKeys={[selectedFile]}
      />
    </>
  );

  console.log({
    generatedFiles,
    data: generatedFiles[selectedFile],
    selectedFile
  });

  const codeType = selectedFile?.split('.')?.[1];


  // 右侧代码预览面板
  const rightPanel = (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {selectedFile}
        </span>
        <Space>
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(generatedFiles[selectedFile] || '')}
            size="small"
          >
            复制
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => downloadFile(selectedFile, generatedFiles[selectedFile] || '')}
            size="small"
          >
            下载
          </Button>
        </Space>
      </div>
      <RenderMarkdown codeType={codeType} content={generatedFiles[selectedFile]} />
    </>
  );

  return (
    <div className="page-renderer">
      <Card
        title={pageConfig?.title || '数据列表'}
        extra={
          <Button type="primary" icon={<CodeOutlined />} onClick={handleOpenExport}>
            导出源码
          </Button>
        }
      >
        {searchConfig?.fields?.length > 0 && (
          <SearchForm
            config={searchConfig}
            onSearch={handleSearch}
            onReset={handleReset}
            loading={loading}
          />
        )}

        <DataTable
          config={tableConfig}
          data={data}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      </Card>

      {/* 导出源码弹窗 */}
      <Modal
        title="导出 React 源码"
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        width={1000}
        footer={null}
      >
        <Tabs
          activeKey={exportType}
          onChange={setExportType}
          items={[
            {
              key: 'files',
              label: '文件列表',
              children: (
                <ResizablePanels
                  leftPanel={leftPanel}
                  rightPanel={rightPanel}
                  initialLeftWidth={250}
                  minLeftWidth={200}
                  maxLeftWidth={500}
                />
              ),
            },
            {
              key: 'config',
              label: '配置文件',
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => downloadFile('config.json', generatedFiles['config.json'] || '{}')}
                      >
                        下载 config.json
                      </Button>
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(generatedFiles['config.json'] || '{}')}
                      >
                        复制配置
                      </Button>
                    </Space>
                  </div>
                  <RenderMarkdown codeType='json' content={generatedFiles['config.json']} />
                </>
              ),
            },
            {
              key: 'readme',
              label: '使用说明',
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => downloadFile('README.md', generatedFiles['README.md'] || '')}
                    >
                      下载 README.md
                    </Button>
                  </div>
                  <div style={{
                    background: '#fff',
                    padding: 24,
                    borderRadius: 8,
                    maxHeight: 500,
                    overflow: 'auto',
                    border: '1px solid #e8e8e8',
                  }}>
                    <RenderMarkdown content={generatedFiles['README.md']} />
                  </div>
                </>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default PageRenderer;