import React from 'react'

export const HOST = 'http://remons.cn:3009'

export const img = (svg, height) => {
  return <img style={{ height: `${height || 120}px` }} src={svg} alt="" />
}
