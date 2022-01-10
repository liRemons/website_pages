import { makeAutoObservable } from 'mobx'
import { queryMyInfo } from './server'

class Store {
  info = {}

  constructor() {
    makeAutoObservable(this)
  }

  async queryMyInfo(payload) {
    const obj = {}
    const { data: articleList } = await queryMyInfo(payload)
    articleList.forEach(({ keyName, val, url, description }) => {
      obj[keyName] = {
        val,
        url,
        description,
      }
    })
    // console.log(obj);
    this.info = obj
  }
}

const store = new Store()

export default store
