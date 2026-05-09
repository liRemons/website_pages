import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Input,
  Slider,
  Button,
  Select,
  DatePicker,
  ColorPicker,
  Switch,
  Row,
  Col,
  Card,
  Space,
  message,
} from 'antd';
import {
  DownloadOutlined,
  FontSizeOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BUILTIN_FONTS, STAMP_STYLES } from './constants';
import { degToRad, drawStampToCanvas } from './canvas/drawers';
import Fixed from '@components/Fixed';
import './app.css';

/** 样式预览缩略图组件：独立渲染一个小 canvas 作为预览 */
function StampStyleCard({ style, selected, color, location, date, subtitle, locationFont, locationFontSize, dateFontFamily, dateFontSize, onClick }) {
  const previewCanvasRef = useRef(null);
  const previewSize = 80;

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    drawStampToCanvas(canvas, {
      location,
      date,
      subtitle,
      color,
      stampSize: previewSize,
      locationFont,
      locationFontSize: Math.max(6, Math.round(locationFontSize * 0.5)),
      dateFontFamily,
      dateFontSize: Math.max(5, Math.round(dateFontSize * 0.5)),
      rotation: 0,
      stampStyle: style.value,
    });
  }, [style.value, color, location, date, subtitle, locationFont, locationFontSize, dateFontFamily, dateFontSize]);

  return (
    <div
      className={`stamp-style-card ${selected ? 'stamp-style-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="stamp-style-card-preview">
        <canvas ref={previewCanvasRef} width={previewSize} height={previewSize} />
      </div>
      <div className="stamp-style-card-info">
        <span className="stamp-style-card-label">{style.label}</span>
        <span className="stamp-style-card-desc">{style.desc}</span>
      </div>
      {selected && <CheckCircleFilled className="stamp-style-card-check" />}
    </div>
  );
}

export default function PostmarkGenerator() {
  const canvasRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  // 邮戳内容
  const [location, setLocation] = useState('黄山');
  const [subtitle, setSubtitle] = useState('');
  const [dateObj, setDateObj] = useState(dayjs());
  const [color, setColor] = useState('#C0392B');

  // 字体
  const [localFonts, setLocalFonts] = useState(BUILTIN_FONTS);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [locationFont, setLocationFont] = useState('"STFangsong"');
  const [dateFontFamily, setDateFontFamily] = useState('"Courier New"');

  // 尺寸
  const [locationFontSize, setLocationFontSize] = useState(16);
  const [dateFontSize, setDateFontSize] = useState(14);
  const [stampSize, setStampSize] = useState(150);

  // 旋转角度（度），-90 ~ 90
  const [rotationDeg, setRotationDeg] = useState(0);

  // 做旧效果
  const [wornEffect, setWornEffect] = useState(true);

  // 邮戳样式
  const [stampStyle, setStampStyle] = useState('classic');

  const dateStr = dateObj ? dateObj.format('YYYY.MM.DD') : '';

  // 重新绘制邮戳
  const redrawStamp = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawStampToCanvas(canvas, {
      location,
      subtitle,
      date: dateStr,
      color,
      stampSize,
      locationFont,
      locationFontSize,
      dateFontFamily,
      dateFontSize,
      rotation: degToRad(rotationDeg),
      stampStyle,
      wornEffect,
    });
  }, [location, subtitle, dateStr, color, stampSize, locationFont, locationFontSize, dateFontFamily, dateFontSize, rotationDeg, stampStyle, wornEffect]);

  useEffect(() => {
    redrawStamp();
  }, [redrawStamp]);

  // 获取本地字体列表
  const handleLoadLocalFonts = useCallback(async () => {
    if (!('queryLocalFonts' in window)) {
      messageApi.warning('当前浏览器不支持 Local Font Access API，请使用 Chrome 103+');
      return;
    }
    setLoadingFonts(true);
    try {
      const availableFonts = await window.queryLocalFonts();
      const uniqueFamilies = [...new Set(availableFonts.map((font) => font.family))];
      const localFontOptions = uniqueFamilies.map((family) => ({ family: `"${family}"`, label: family }));
      setLocalFonts([...BUILTIN_FONTS, ...localFontOptions]);
      messageApi.success(`已加载 ${uniqueFamilies.length} 个本地字体`);
    } catch (err) {
      messageApi.error('获取字体失败，请检查浏览器权限设置');
    } finally {
      setLoadingFonts(false);
    }
  }, [messageApi]);

  // 下载邮戳
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `postmark-${location}-${dateStr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [location, dateStr]);

  const fontOptions = localFonts.map((font) => (
    <Option key={font.family} value={font.family}>
      <span style={{ fontFamily: font.family }}>{font.label}</span>
    </Option>
  ));

  return (
    <div className="postmark-page">
      {contextHolder}

      <div className="page-header">
        <span className="page-header-title">邮戳生成器</span>
      </div>

      <div className="postmark-layout">
        {/* 左侧：预览区 */}
        <div className="postmark-preview-area">
          <Card className="preview-card" title="邮戳预览">
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} className="stamp-canvas" />
            </div>
            <Space className="preview-actions">
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                下载邮戳
              </Button>
            </Space>
          </Card>
        </div>

        {/* 右侧：控制面板 */}
        <div className="postmark-controls">
          <Card className="control-card">

            {/* ── 内容区块 ── */}
            <div className="config-section">
              <div className="config-section-title">内容</div>

              <Row gutter={16}>
                <Col span={12}>
                  <div className="field-item">
                    <label className="field-label">地点文字</label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="输入地点"
                      maxLength={20}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="field-item">
                    <label className="field-label">日期</label>
                    <DatePicker
                      value={dateObj}
                      onChange={setDateObj}
                      format="YYYY.MM.DD"
                      style={{ width: '100%' }}
                      placeholder="选择日期"
                      allowClear={false}
                    />
                  </div>
                </Col>
              </Row>

              {stampStyle === 'postal' && (
                <div className="field-item">
                  <label className="field-label">单位名称 <span style={{ color: '#999', fontWeight: 400 }}>（下弧副标题，仅邮政日戳）</span></label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="输入单位名称，如：中央广播电视总台"
                    maxLength={20}
                  />
                </div>
              )}

              <div className="field-item">
                <label className="field-label">邮戳颜色</label>
                <ColorPicker
                  value={color}
                  onChange={(_, hex) => setColor(hex)}
                  showText
                  format="hex"
                /></div>
            </div>

            {/* ── 字体区块 ── */}
            <div className="config-section">
              <div className="config-section-header">
                <span className="config-section-title">字体</span>
                <Button
                  size="small"
                  type="link"
                  icon={<FontSizeOutlined />}
                  loading={loadingFonts}
                  onClick={handleLoadLocalFonts}
                  className="load-font-btn"
                >
                  加载本地字体
                </Button>
              </div>

              <Row gutter={16}>
                <Col span={14}>
                  <div className="field-item">
                    <label className="field-label">地点字体</label>
                    <Select
                      value={locationFont}
                      onChange={setLocationFont}
                      style={{ width: '100%' }}
                      showSearch
                      filterOption={(input, option) =>
                        option.value.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {fontOptions}
                    </Select>
                  </div>
                </Col>
                <Col span={10}>
                  <div className="field-item">
                    <label className="field-label">字号 <span className="field-value-tag">{locationFontSize}px</span></label>
                    <Slider
                      min={10}
                      max={40}
                      value={locationFontSize}
                      onChange={setLocationFontSize}
                      className="compact-slider"
                    />
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={14}>
                  <div className="field-item">
                    <label className="field-label">日期字体</label>
                    <Select
                      value={dateFontFamily}
                      onChange={setDateFontFamily}
                      style={{ width: '100%' }}
                      showSearch
                      filterOption={(input, option) =>
                        option.value.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {fontOptions}
                    </Select>
                  </div>
                </Col>
                <Col span={10}>
                  <div className="field-item">
                    <label className="field-label">字号 <span className="field-value-tag">{dateFontSize}px</span></label>
                    <Slider
                      min={8}
                      max={30}
                      value={dateFontSize}
                      onChange={setDateFontSize}
                      className="compact-slider"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* ── 邮戳样式切换 ── */}
            <div className="config-section">
              <div className="config-section-title">邮戳样式</div>
              <div className="stamp-style-grid">
                {STAMP_STYLES.map((style) => (
                  <StampStyleCard
                    key={style.value}
                    style={style}
                    selected={stampStyle === style.value}
                    color={color}
                    location={location}
                    date={dateStr}
                    subtitle={subtitle}
                    locationFont={locationFont}
                    locationFontSize={locationFontSize}
                    dateFontFamily={dateFontFamily}
                    dateFontSize={dateFontSize}
                    onClick={() => setStampStyle(style.value)}
                  />
                ))}
              </div>
            </div>

            {/* ── 邮戳大小 & 角度 ── */}
            <div className="config-section config-section--last">
              <div className="config-section-title">尺寸与旋转</div>

              <Row gutter={16}>
                <Col span={12}>
                  <div className="field-item">
                    <label className="field-label">
                      邮戳尺寸 <span className="field-value-tag">{stampSize}px</span>
                    </label>
                    <Slider
                      min={80}
                      max={400}
                      step={10}
                      value={stampSize}
                      onChange={setStampSize}
                      className="compact-slider"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="field-item">
                    <label className="field-label">
                      旋转角度 <span className="field-value-tag">{rotationDeg}°</span>
                    </label>
                    <Slider
                      min={-90}
                      max={90}
                      step={1}
                      value={rotationDeg}
                      onChange={setRotationDeg}
                      className="compact-slider"
                    />
                  </div>
                </Col>
              </Row>

              <div className="field-item" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <span className="field-label" style={{ margin: 0 }}>做旧效果</span>
                <Switch checked={wornEffect} onChange={setWornEffect} />
              </div>
            </div>

          </Card>
        </div>
      </div>
      <Fixed homeUrl="/tool" />
    </div>
  );
}