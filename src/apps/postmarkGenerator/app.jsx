import React, { useState, useEffect, useRef, useCallback } from "react";
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
} from "antd";
import {
  DownloadOutlined,
  FontSizeOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { BUILTIN_FONTS, STAMP_STYLES } from "./constants";
import { degToRad, drawStampToCanvas } from "./canvas/drawers";
import Container from "@components/Container";
import Header from "@components/Header";
import Fixed from "@components/Fixed";
import handleContent from "./handle.md";
import '@assets/css/index.global.less';
import "./app.less";

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
    <div className={`stamp-style-card ${selected ? "stamp-style-card--selected" : ""}`} onClick={onClick}>
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

  const [location, setLocation] = useState("杭州");
  const [subtitle, setSubtitle] = useState("西湖风景名胜区");
  const [dateObj, setDateObj] = useState(dayjs());
  const [color, setColor] = useState("#C0392B");

  const [localFonts, setLocalFonts] = useState(BUILTIN_FONTS);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [locationFont, setLocationFont] = useState('"STFangsong"');
  const [dateFontFamily, setDateFontFamily] = useState('"Courier New"');

  const [locationFontSize, setLocationFontSize] = useState(16);
  const [dateFontSize, setDateFontSize] = useState(14);
  const [stampSize, setStampSize] = useState(150);

  const [rotationDeg, setRotationDeg] = useState(0);
  const [wornEffect, setWornEffect] = useState(true);
  const [stampStyle, setStampStyle] = useState("classic");

  const dateStr = dateObj ? dateObj.format("YYYY.MM.DD") : "";

  const handleLoadLocalFonts = useCallback(async () => {
    if (!("queryLocalFonts" in window)) {
      messageApi.warning("当前浏览器不支持 Local Font Access API，请使用 Chrome 103+");
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
      messageApi.error("获取字体失败，请检查浏览器权限设置");
    } finally {
      setLoadingFonts(false);
    }
  }, [messageApi]);

  const fontOptions = localFonts.map((font) => (
    <Select.Option key={font.family} value={font.family}>
      {font.label}
    </Select.Option>
  ));

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

  return (
    <>
      {contextHolder}
      <Container
        header={<Header name="邮戳生成器" leftPath={`/${APP_NAME}/tool`}  handleContent={handleContent} />}
        main={
          <div className="postmark-layout">
            {/* 预览区 */}
            <div className="postmark-preview-area">
              <Card className="preview-card" styles={{ body: { padding: 16 } }}>
                <div className="canvas-wrapper">
                  <canvas ref={canvasRef} className="stamp-canvas" />
                </div>
                <Space className="preview-actions" style={{ justifyContent: "center", width: "100%" }}>
                  <Button type="primary" icon={<DownloadOutlined />} onClick={redrawStamp}>
                    下载邮戳
                  </Button>
                </Space>
              </Card>
            </div>

            {/* 控制面板 */}
            <div className="postmark-controls">
              <Card className="control-card" styles={{ body: { padding: 0 } }}>
                <div className="config-section">
                  <div className="config-section-title">基础信息</div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="field-item">
                        <label className="field-label">地点</label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="field-item">
                        <label className="field-label">日期</label>
                        <DatePicker value={dateObj} onChange={setDateObj} style={{ width: "100%" }} />
                      </div>
                    </Col>
                  </Row>
                  <div className="field-item">
                    <label className="field-label">副标题</label>
                    <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                  </div>
                  <div className="field-item">
                    <label className="field-label">颜色</label>
                    <ColorPicker value={color} onChange={(c) => setColor(c.toHexString())} />
                  </div>
                </div>

                <div className="config-section">
                  <div className="config-section-header">
                    <div className="config-section-title">字体设置</div>
                    <Button type="link" className="load-font-btn" icon={<FontSizeOutlined />} onClick={handleLoadLocalFonts} loading={loadingFonts}>
                      加载本地字体
                    </Button>
                  </div>
                  <Row gutter={16}>
                    <Col span={14}>
                      <div className="field-item">
                        <label className="field-label">地点字体</label>
                        <Select value={locationFont} onChange={setLocationFont} style={{ width: "100%" }} showSearch filterOption={(input, option) => option.value.toLowerCase().includes(input.toLowerCase())}>
                          {fontOptions}
                        </Select>
                      </div>
                    </Col>
                    <Col span={10}>
                      <div className="field-item">
                        <label className="field-label">字号 <span className="field-value-tag">{locationFontSize}px</span></label>
                        <Slider min={10} max={40} value={locationFontSize} onChange={setLocationFontSize} className="compact-slider" />
                      </div>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={14}>
                      <div className="field-item">
                        <label className="field-label">日期字体</label>
                        <Select value={dateFontFamily} onChange={setDateFontFamily} style={{ width: "100%" }} showSearch filterOption={(input, option) => option.value.toLowerCase().includes(input.toLowerCase())}>
                          {fontOptions}
                        </Select>
                      </div>
                    </Col>
                    <Col span={10}>
                      <div className="field-item">
                        <label className="field-label">字号 <span className="field-value-tag">{dateFontSize}px</span></label>
                        <Slider min={8} max={30} value={dateFontSize} onChange={setDateFontSize} className="compact-slider" />
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="config-section">
                  <div className="config-section-title">邮戳样式</div>
                  <div className="stamp-style-grid">
                    {STAMP_STYLES.map((style) => (
                      <StampStyleCard key={style.value} style={style} selected={stampStyle === style.value} color={color} location={location} date={dateStr} subtitle={subtitle} locationFont={locationFont} locationFontSize={locationFontSize} dateFontFamily={dateFontFamily} dateFontSize={dateFontSize} onClick={() => setStampStyle(style.value)} />
                    ))}
                  </div>
                </div>

                <div className="config-section config-section--last">
                  <div className="config-section-title">尺寸与旋转</div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="field-item">
                        <label className="field-label">邮戳尺寸 <span className="field-value-tag">{stampSize}px</span></label>
                        <Slider min={80} max={400} step={10} value={stampSize} onChange={setStampSize} className="compact-slider" />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="field-item">
                        <label className="field-label">旋转角度 <span className="field-value-tag">{rotationDeg}°</span></label>
                        <Slider min={-90} max={90} step={1} value={rotationDeg} onChange={setRotationDeg} className="compact-slider" />
                      </div>
                    </Col>
                  </Row>
                  <div className="field-item" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <span className="field-label" style={{ margin: 0 }}>做旧效果</span>
                    <Switch checked={wornEffect} onChange={setWornEffect} />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        }
      />
      <Fixed homeUrl="/tool" handleContent={handleContent} />
    </>
  );
}
