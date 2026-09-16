import { makeAutoObservable } from 'mobx';
import { queryTechClassList, verifyLogin } from './server';

class Store {
  techClassList = [];

  constructor() {
    makeAutoObservable(this);
  }

  async getVerifyLogin() {
    const res = await verifyLogin();
    return res;
  }

  async queryTechClassList(payload = {}) {
    const { data: techClassList } = await queryTechClassList(payload);
    techClassList.forEach(item => {
      item.url = item.icon;
      item.title = item.name;
      delete item.icon;
    })
    this.techClassList = techClassList;
  }
}

const store = new Store();

export default store;
