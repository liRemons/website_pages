import { makeAutoObservable } from 'mobx'
import { login } from './server';

class Store {
  constructor() {
    makeAutoObservable(this)
  }

  async login(payload) {
    const res = await login(payload);
    return res;
  }
}

const store = new Store()

export default store
