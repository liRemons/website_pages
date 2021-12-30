import { makeAutoObservable } from 'mobx';
import { queryArticleList } from './server';

class Store {
  price = 1;

  amount = 10;

  constructor() {
    makeAutoObservable(this);
  }

  get total() {
    return this.price * this.amount;
  }

  async getArticleList() {
    const { data: articleList } = await queryArticleList();
    console.log(articleList);
    // https://vip6.3sybf.com/20210924/kE59gdKo/2000kb/hls/index.m3u8
  }

  changePrice() {
    this.price += 1;
  }
}

const store = new Store();

export default store;
