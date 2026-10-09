import { makeAutoObservable } from 'mobx'
import { queryProjectList, queryProjectDocList, getProjectDoc } from './server'
import { markdownFormat } from 'remons-render-markdown';

class Store {
  // 项目列表
  projectList = []
  // 当前选中的项目 ID
  projectId = ''
  // 当前项目名称
  projectName = ''
  // 当前项目的文档列表（不含 content）
  docList = []
  // 当前文档 ID
  activeDocId = ''
  // Markdown 原文
  markdownInfo = ''
  // Markdown 解析后的 html 信息（供增量渲染/diff 使用）
  htmlInfo = ''
  // 目录锚点
  anchor = []
  // 当前文档标题
  title = ''
  // 当前文档更新时间
  updateTime = ''

  constructor() {
    makeAutoObservable(this)
  }

  async queryProjectList() {
    const { data } = await queryProjectList()
    this.projectList = data || [];
  }

  async queryProjectDocList(projectId) {
    this.docList = [];
    const { data } = await queryProjectDocList(projectId)
    this.docList = data || [];
  }

  async getProjectDoc(id) {
    this.markdownInfo = '';
    this.htmlInfo = '';
    this.anchor = [];
    const { data } = await getProjectDoc(id)
    const { anchor, info } = await markdownFormat(data.content)
    this.anchor = anchor;
    this.markdownInfo = data.content;
    this.htmlInfo = info;
    this.title = data.title;
    this.updateTime = data.updateTime;
  }
}

const store = new Store()

export default store