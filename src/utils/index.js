import React from 'react'
const hostMap = {
  'http:': 'http://remons.cn:3009',
  'https:': 'https://remons.cn:3008',
}
export const HOST = hostMap[window.location.protocol]

export const img = (svg, height) => {
  return <img style={{ height: `${height || 120}px` }} src={svg} alt="" />
}
