import React, { useState, useEffect } from 'react';
import { Button, Menu } from 'antd';
import { FolderOpenOutlined, FileMarkdownOutlined } from '@ant-design/icons';
import Fixed from '@components/Fixed';
import Container from '@components/Container';
import Header from '@components/Header';
import style from './index.less';
import Vditor from 'vditor'

function List() {
  const [files, setFiles] = useState([]);
  const [vditor, setVditor] = useState(null);
  const [type, setType] = useState('edit')

  useEffect(() => {
    const vditor = new Vditor('markdown', {
      height: 'calc(100% - 40px)',
      width: '100%',
      resize: {
        enable: true
      },
      outline: {
        enable: true,
        position: 'right'
      },
      counter: {
        enable: true
      },
      // cache: {
      //   enable: false,
      // },
      preview: {
        mode: 'both'
      },
      after: () => {
        setVditor(vditor)
      },
      blur: (val) => { }
    })
  }, [])

  const changeFolder = (e) => {
    vditor.setValue(null);
    const files = [...e.target.files].filter(file => file.name.includes('md'));
    const path = files.map(file => file.webkitRelativePath.split('/'))
    const arr = path.reduce((initVal, item, index, arr) => {
      item.forEach((el, elIndex) => {
        initVal?.find(a => a.path === el) ? '' : initVal.push({ parent: elIndex > 0 ? item[elIndex - 1] : null, path: el, i: elIndex, type: elIndex === item.length - 1 ? 'file' : 'path' })
      })
      return initVal
    }, [])

    function treeing(arr) {
      let tree = []
      const map = {}
      for (let item of arr) {
        let newItem = map[item.path] = {
          ...item,
          label: item.path,
          key: item.path,
          icon: item.type === 'file' ? <FileMarkdownOutlined /> : <FolderOpenOutlined />,
          ...(item.type === 'file' ? {} : { children: [] }),
          ...(item.type === 'file' ? { file: files.find(el => el.name === item.path) } : {})
        }
        if (map[item.parent]) {
          let parent = map[item.parent]
          parent.children.push(newItem)
        } else {
          tree.push(newItem)
        }
      }
      return tree
    }
    setFiles(treeing(arr))
  }

  const changeFile = (e) => {
    const file = e.target.files?.[0];
    readFile(file)
  }

  const importFolder = () => {
    setType('importFolder')
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = 'true';
    input.onchange = changeFolder;
    input.click();
  }

  const edit = () => {
    setType('edit');
    vditor.setValue(null);
  }

  const importFile = () => {
    setType('importFile');
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = changeFile;
    input.click();
  }




  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      vditor.setValue(evt.target.result);
    };
    reader.readAsText(file);
  }

  const menuClick = ({ item }) => {
    setTimeout(() => {
      readFile(item.props.file)
    }, 500);
  }

  return <> <Fixed /><Container
    header={<Header name='所见即所得 markdown 编辑查看器' leftPath={`/${APP_NAME}/tool`} />}
    main={<>
      <div className={style.main}>
        {files.length !== 0 && type === 'importFolder' && <div className={style.menu}>
          <Menu
            onClick={menuClick}
            mode="inline"
            items={files}
          />
        </div>}
        <div className={style.content}>
          <div className={style.btn}>
            <Button onClick={edit}>仅编辑</Button>
            <Button onClick={importFile}>单个导入</Button>
            <Button onClick={importFolder}>导入文件夹</Button>
            导入仅识别 markdown 格式文件
          </div>

          <div id="markdown"></div>
        </div>
      </div></>}
  >
  </Container>
  </>
}

export default List;
