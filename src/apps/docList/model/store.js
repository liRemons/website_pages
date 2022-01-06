import { makeAutoObservable } from 'mobx';
import { queryArticleList, getMarkdown } from './server';

class Store {
  articleList = [];

  markdownInfo = '';

  markdownUrl = '';

  constructor() {
    makeAutoObservable(this);
  }

  async queryArticleList(payload) {
    const { data: articleList } = await queryArticleList(payload);
    this.articleList = articleList;
  }

  async getMarkdown(payload) {
    this.markdownInfo = '';
    this.markdownUrl = payload;
    const data = await getMarkdown(payload);
    this.markdownInfo = data;
  }
}

const store = new Store();

export default store;
