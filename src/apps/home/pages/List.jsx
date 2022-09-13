import React, { useEffect } from 'react';
import { HomeOutlined } from '@ant-design/icons';
import './home.css';
import { openApp } from 'methods-r';
import { load } from './home';

export default function List() {
  useEffect(() => {
    load();
  }, []);

  return  <>
    <canvas className="canvas"></canvas>

    <button className="help">?</button>
    <button className='go-home' onClick={() => openApp({ url: `/${APP_NAME}/homeList` })}><HomeOutlined /></button>

    <div className="ui">
      <input id='input' className="ui-input" type="text" />
      <button className="ui-return">↵</button>
    </div>

    <div className="overlay">
      <div className="tabs">
        <div className="tabs-labels"><span className="tabs-label"></span></div>
        <div className="tabs-panels">
          <ul className="tabs-panel commands">
            <li className="commands-item"><span className="commands-item-title">Text</span><span className="commands-item-info"
              data-demo="Hello :)">Type anything</span><span className="commands-item-action">Demo</span></li>
            <li className="commands-item"><span className="commands-item-title">Countdown</span><span className="commands-item-info"
              data-demo="#countdown 10">#countdown<span className="commands-item-mode">number</span></span><span
                className="commands-item-action">Demo</span></li>
            <li className="commands-item"><span className="commands-item-title">Time</span><span className="commands-item-info"
              data-demo="#time">#time</span><span className="commands-item-action">Demo</span></li>
            <li className="commands-item"><span className="commands-item-title">Rectangle</span><span className="commands-item-info"
              data-demo="#rectangle 30x15">#rectangle<span className="commands-item-mode">width x height</span></span><span
                className="commands-item-action">Demo</span></li>
            <li className="commands-item"><span className="commands-item-title">Circle</span><span className="commands-item-info"
              data-demo="#circle 25">#circle<span className="commands-item-mode">diameter</span></span><span
                className="commands-item-action">Demo</span></li>

            <li className="commands-item commands-item--gap"><span className="commands-item-title">Animate</span><span
              className="commands-item-info" data-demo="The time is|#time|#countdown 3|#icon thumbs-up"><span
                className="commands-item-mode">command1</span>&nbsp;|<span
                  className="commands-item-mode">command2</span></span><span className="commands-item-action">Demo</span></li>
          </ul>
        </div>
      </div>
    </div>
  </>;
}