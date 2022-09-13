import React, { useEffect, useState } from 'react';
import List from './pages/List';
import Doc from './pages/Doc';
import { getSearchParams } from 'methods-r';
import 'antd/dist/antd.css';


export default function App() {
  const [page, setPage] = useState('');
  useEffect(() => {
    const { page: pageName } = getSearchParams();
    setPage(pageName?.toLowerCase());
  }, []);
  const pages = {
    list: List,
    doc: Doc
  };

  const Ele = pages[page] || List;

  return <Ele />;
}
