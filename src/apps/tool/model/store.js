import { makeAutoObservable } from 'mobx';
import { queryDocList } from './server';

class Store {
  docList = [];

  constructor() {
    makeAutoObservable(this);
  }

  async getDocList() {
    const { data } = await queryDocList();
    this.docList = data;
  }
}

export default new Store();
