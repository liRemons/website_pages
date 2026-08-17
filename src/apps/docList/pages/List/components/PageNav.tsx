/**
 * PageNav 导航面板组件
 * 渲染右侧锚点导航栏，包含搜索按钮（点击展开搜索框）和目录树，无锚点时不显示
 */
import React, { useState, useRef, useEffect } from 'react';
import classnames from 'classnames';
import Anchor from '../../Anchor';
import { Input } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { debounce } from 'methods-r';
import { PageNavProps } from '../types';

export default function PageNav({ anchor, htmlInfo, onSearch, styles }: PageNavProps) {
  const [searchVisible, setSearchVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // 关闭搜索框：先 blur 输入框避免闪烁边框
  const closeSearch = () => {
    inputRef.current?.blur?.();
    setSearchVisible(false);
    onSearch('');
  };

  // 点击外部区域关闭搜索框
  useEffect(() => {
    if (!searchVisible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchVisible, onSearch]);

  if (!anchor?.length) return null;

  return (
    <div className={classnames(styles.page_nav, 'shadow_not_active')}>
      {/* 搜索按钮：固定在顶部，脱离文档流 */}
      <div className={styles.searchToggle} ref={searchRef}>
        {!searchVisible ? (
          <div className={classnames(styles.searchBtn, 'circle')} onClick={() => setSearchVisible(true)}>
            <SearchOutlined />
          </div>
        ) : (
          <div className={styles.searchBox}>
            <Input
              ref={inputRef}
              placeholder="请输入以搜索"
              autoFocus
              onChange={(e) => debounce(onSearch(e.target.value))}
              suffix={
                <CloseOutlined
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={closeSearch}
                  style={{ cursor: 'pointer' }}
                />
              }
            />
          </div>
        )}
      </div>
      {htmlInfo && <Anchor anchor={anchor} />}
    </div>
  );
}