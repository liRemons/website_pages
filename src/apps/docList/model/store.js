import { makeAutoObservable } from 'mobx';
import { queryArticleList } from './server';

class Store {
  articleList = [];

  constructor() {
    makeAutoObservable(this);
  }

  async queryArticleList(payload) {
    const { data: articleList } = await queryArticleList(payload);
    this.articleList = articleList;
  }
}

const store = new Store();

export default store;
