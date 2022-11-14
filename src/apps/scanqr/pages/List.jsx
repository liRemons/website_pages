import React from 'react';
import Container from '@components/Container';
import Header from '@components/Header';
import ScanQr from '@components/ScanQr';
import '@assets/css/index.global.less';

const View = () => {
  return <Container
    header={<Header name='扫描二维码' leftPath={`/${APP_NAME}/tool`} />}
    main={
      <ScanQr />
    }
  >
  </Container>
}

export default View
