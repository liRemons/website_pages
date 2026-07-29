import { makeAutoObservable } from 'mobx'
import { queryArticleList, markdownToHTML } from './server'
import { markdownFormat } from 'remons-render-markdown';

class Store {
  articleList = []

  markdownInfo = ''

  markdownUrl = ''

  anchor = []

  htmlInfo = ''
  
  title = ''

  createTime = ''

  techClassName = ''

  constructor() {
    makeAutoObservable(this)
  }

  async queryArticleList(payload) {
    const { data: articleList } = await queryArticleList(payload)
    this.articleList = articleList;
    if (articleList?.length) {
      this.techClassName = articleList[0].techClassName
    }
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
    const { anchor, info } = markdownFormat(data.content);
    const { content, title, createTime } = data || {}
    this.anchor = anchor;
    this.markdownInfo = content;
    this.htmlInfo = info;
    this.title = title;
    this.createTime = createTime;
  }
}

const store = new Store()

export default store
