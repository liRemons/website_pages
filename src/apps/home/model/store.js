import { makeAutoObservable } from 'mobx';
import { queryArticleList } from './server';

class Store {
  constructor() {
    makeAutoObservable(this);
  }
}

const store = new Store();

export default store;
