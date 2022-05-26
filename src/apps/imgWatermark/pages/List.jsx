import React, { useState, useEffect } from 'react';
import Header from '@components/Header';
import { Input, Slider } from 'antd';
import Fixed from '@components/Fixed';
import { RgbaColorPicker } from "react-colorful";
import style from './index.less'
import classNames from 'classnames';
import { DragOutlined, ArrowDownOutlined } from '@ant-design/icons'

function List () {
  const [img, setImg] = useState('');
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [color, setColor] = useState('rgba(255, 255, 255, 0.3)');
  const [rotate, setRotate] = useState(45);
  const [fontSize, setFontSize] = useState(12);

  useEffect(() => {
    setCanvas()
  }, [text, color, img, rotate, fontSize, fileName]);

  useEffect(() => {
    let icon = document.getElementById('icon');
    let moveBox = document.getElementById('moveBox');
    let warp = document.getElementById('warp');
    icon.onmousedown = (ev) => {
      let e = ev || window.event;
      let restLeft = e.clientX - warp.offsetLeft - moveBox.offsetLeft;
      let restTop = e.clientY - warp.offsetTop - moveBox.offsetTop;
      document.onmousemove = (ev) => {
        let e = ev || window.event;
        //计算出left值和top值
        let boxLeft = e.clientX - restLeft - warp.offsetLeft;
        let boxTop = e.clientY - restTop - warp.offsetTop;
        //设置left，top值
        moveBox.style.left = boxLeft + "px";
        moveBox.style.top = boxTop + "px";
      }
      moveBox.onmouseup = function () {
        document.onmousemove = null;
        document.onmouseup = null;
      }
    }
  }, []);

  const changeFile = (e) => {
    const file = e.target.files[0]
    if (e.target.files[0]) {
      setFileName(e.target.files[0]?.name);
      setImg(URL.createObjectURL(file));
    }
  }

  const changeInput = (e) => {
    setText(e.target.value || ' ')
  }


  const setCanvas = () => {
    const img = document.getElementById('img');
    const main = document.getElementById('main');
    const pageCanvas = document.querySelector('canvas');
    if (pageCanvas || !text) {
      pageCanvas && main.removeChild(pageCanvas);
    }
    const canvas = document.createElement('canvas');
    // 用 width 会导致模糊
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.imageSmoothingEnabled = false;
    ctx.font = `${fontSize}px Montserrat,sans-serif`;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const xCount = Math.floor(canvas.width / 100);
    const yCount = Math.floor(canvas.height / (text.length * 10));
    // 判断是否在区间内，左开右闭
    const isSection = (value) => (min, max) => (value > min && value <= max);
    // 生成文字逻辑
    for (let i = 0; i <= xCount; i++) {
      for (let index = 0; index < yCount; index++) {
        let yLength = 0;
        let xLength = 0;
        let x = 0;
        let y = 0;
        // 求出文字长度在坐标轴的投影
        yLength = Math.abs(fontSize * text.length * Math.cos(rotate * Math.PI / 180))
        xLength = Math.abs(fontSize * text.length * Math.sin(rotate * Math.PI / 180))
        x = xLength + 100;
        y = yLength + 150;
        // 特殊处理，接近垂直状态，此时应当将文字垂直间距增大
        if (isSection(rotate)(60, 120) || isSection(rotate)(240, 300)) {
          if (text.length >= 10 || fontSize >= 20) {
            y = 150 + text.length * fontSize;
          }
        }

        // 特殊处理，接近水平状态，此时应当将文字水平间距增大
        if (isSection(rotate)(-1, 30) || isSection(rotate)(150, 220) || isSection(rotate)(330, 360)) {
          if (text.length >= 10 || fontSize >= 20) {
            x = 100 + text.length * fontSize;
          }
        }
        canvasRotate(i * x, index * y, i)
      }
    }

    function canvasRotate(x, y, i) {
      ctx.translate(x, y); // 将画布的原点移动到正中央
      ctx.rotate((rotate * 2) * (Math.PI / 360));
      ctx.fillText(text || '', 0, 0);
      ctx.rotate(-(rotate * 2) * (Math.PI / 360));
      ctx.translate(-x, -y); // 将画布的原点还原
    };

    main.appendChild(canvas)
  }

  const save = () => {
    const canvas = document.querySelector('canvas');
    const save_url = canvas.toDataURL("image/png");
    const a = document.createElement('a')
    a.href = save_url;
    a.download = `图片文字水印(remons.cn)_${fileName}`
    a.click()
  }

  return <>
    <div className={style.container}>
      <Header name='图片文字水印' leftPath={`/${APP_NAME}/tool`} />
      
      <Fixed />
      <div id="warp">
        <div id='moveBox' className={classNames('shadow', style.setting)}>
          <span id='icon'> <DragOutlined /> </span>
          <input accept='image/*' id='file' style={{ marginBottom: '10px' }} type="file" onChange={changeFile} />
          水印文字： <Input onChange={changeInput} />
          水印角度： <Slider value={rotate} min={0} max={360} onChange={(val) => setRotate(val)} />
          字体大小： <Slider value={fontSize} min={12} max={50} onChange={(val) => setFontSize(val)} />
          水印颜色：<RgbaColorPicker onChange={({ r, g, b, a }) => setColor(`rgba(${r},${g},${b},${a})`)} />
          下载处理文件：<span className='circle' onClick={save}><ArrowDownOutlined /></span>
        </div>
      </div>
      <div id='main' className={style.main}>
        <img id='img' style={{ maxWidth: '100%' }} src={img} alt="" />
      </div>
    </div>
  </>
}

export default List;

