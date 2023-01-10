import { makeAutoObservable } from 'mobx'
import { queryArticleList, getMarkdown, markdownToHTML } from './server'

class Store {
  articleList = []

  markdownInfo = ''

  markdownUrl = ''

  anchor = []

  htmlInfo = ''
  
  title = ''

  constructor() {
    makeAutoObservable(this)
  }

  async queryArticleList(payload) {
    const { data: articleList } = await queryArticleList(payload)
    this.articleList = articleList
  }

  // async getMarkdown(payload) {
  //   this.markdownInfo = ''
  //   // this.markdownUrl = payload
  //   const res = await getMarkdown(payload)
  //   this.markdownInfo = res.data;
  // }

  async getMarkdown(payload) {
    this.markdownInfo = '';
    this.htmlInfo = '';
    const { data } = await markdownToHTML(payload)
    const { anchor, info, content, title } = data || {}
    this.anchor = anchor;
    this.markdownInfo = content;
    this.htmlInfo = info;
    this.title = title;
  }
}

const store = new Store()

export default store
