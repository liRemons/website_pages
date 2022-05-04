import { makeAutoObservable } from 'mobx'
import { queryArticleList, getMarkdown, markdownToHTML } from './server'

class Store {
  articleList = []

  markdownInfo = ''

  markdownUrl = ''

  anchor = []

  htmlInfo = ''

  constructor() {
    makeAutoObservable(this)
  }

  async queryArticleList(payload) {
    const { data: articleList } = await queryArticleList(payload)
    this.articleList = articleList
  }

  async getMarkdown(payload) {
    this.markdownInfo = ''
    this.markdownUrl = payload
    const data = await getMarkdown(payload)
    this.markdownInfo = data
  }

  async markdownToHTML(payload) {
    const { data } = await markdownToHTML(payload)
    const { anchor, info } = data || {}
    this.anchor = anchor
    this.htmlInfo = info
  }
}

const store = new Store()

export default store
