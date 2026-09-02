import React, { Fragment } from 'react';
import { LinkOutlined, ExportOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { hasProtocolFun } from '@/utils';
import { copy } from 'methods-r';
import './index.less';

interface LinkButtonProps {
    href?: string;
    children?: React.ReactNode;
    componentType?: 'a' | 'div';
    copyContent?: string;
}

const LinkButton: React.FC<LinkButtonProps> = ({ href, children, componentType, copyContent }) => {
    const hasProtocol = hasProtocolFun(href);

    const handleCopy = () => {
        message.success('链接已复制到剪贴板');
        copy(copyContent);
    };

    if (componentType === 'div') {
        return (
            <div className="link-preview-btn" onClick={handleCopy} title={copyContent}>
                {children || <Fragment><LinkOutlined /> 复制链接</Fragment>}
            </div>
        );
    }
    return (
        <a href={href} target={hasProtocol ? '_blank' : '_self'} rel={hasProtocol ? 'noopener' : undefined} className="link-preview-btn link-preview-btn-primary">
            {children || <Fragment><ExportOutlined /> 打开页面</Fragment>}
        </a>
    );
}

export default LinkButton;