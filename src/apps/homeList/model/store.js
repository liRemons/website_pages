import { makeAutoObservable } from 'mobx';
import { queryTechClassList } from './server';

class Store {
  techClassList = [];

  constructor() {
    makeAutoObservable(this);
  }

  async queryTechClassList() {
    const { data: techClassList } = await queryTechClassList();
    this.techClassList = techClassList;
  }
}

const store = new Store();

export default store;
