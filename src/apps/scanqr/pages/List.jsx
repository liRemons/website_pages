import React, { useEffect, useState, useRef } from 'react';

import { Alert, notification } from 'antd';

import classnames from 'classnames';

import Fixed from '@components/Fixed';

import Container from '@components/Container';

import Header from '@components/Header';

import { copy } from 'methods-r';

import jsQR from "jsqr";

const View = () => {

  const [qrcodeVal, setQrcodeVal] = useState('');

  const [video, setVideo] = useState(false);

  const [videoText, setVideoText] = useState('请开启摄像头权限');

  const qrcodeValRef = useRef('')

  const openNotification = (val) => {

    notification.config({

      duration: 0,

      maxCount: 1

    });

    const btn = <div onClick={() => {

      notification.close(val);

      setQrcodeVal('')

      copy(val)

    }} className={classnames('circle')}>copy</div>;

    notification.open({

      message: '二维码内容',

      description: val,

      btn,

      key: val,

    });

  };

  useEffect(() => {

    qrcodeValRef.current = qrcodeVal;

  }, [qrcodeVal])

  useEffect(() => {

    var video = document.createElement("video");

    var canvasElement = document.getElementById("canvas");

    var canvas = canvasElement.getContext("2d");

    function drawLine(begin, end, color) {

      canvas.beginPath();

      canvas.moveTo(begin.x, begin.y);

      canvas.lineTo(end.x, end.y);

      canvas.lineWidth = 4;

      canvas.strokeStyle = color;

      canvas.stroke();

    }

    navigator.mediaDevices?.getUserMedia({

      video: {

        facingMode: "environment",

        width: { min: 1280 },

        height: { min: 720 }

      }

    }).then((stream) => {

      video.srcObject = stream;

      video.setAttribute("playsinline", true);

      video.play();

      requestAnimationFrame(tick);

    });

    function tick() {

      setVideoText('⌛ Loading video...')

      if (video.readyState === video.HAVE_ENOUGH_DATA) {

        setVideo(false)

        canvasElement.hidden = false;

        // canvasElement.height = 300;

        // canvasElement.width = 300;

        canvasElement.height = video.videoHeight;

        canvasElement.width = video.videoWidth;

        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

        var code = jsQR(imageData.data, imageData.width, imageData.height, {

          inversionAttempts: "dontInvert",

        });

        if (code) {

          drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");

          drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");

          drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");

          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

          if ((qrcodeValRef.current !== code.data) && code.data) {

            setQrcodeVal(code.data);

            openNotification(code.data);

          }

        }

      }

      requestAnimationFrame(tick);

    }

  }, []);

  return <Container

    header={<Header name='扫描二维码' leftPath={`/${APP_NAME}/tool`} />}

    main={

      <div style={{ height: '100%' }}>

        {video && <Alert type='warning' message={videoText} />}

          <canvas id="canvas" hidden></canvas>

        <Fixed />

      </div>

    }

  >

  </Container>

}

export default View
