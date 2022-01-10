import { service } from '@axios'

export const queryMyInfo = (params) => {
  return service({
    method: 'get',
    url: '/info/queryMyInfo',
    params,
  })
}
