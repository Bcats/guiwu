Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    color: "#9EA1A7",
    selectedColor: "#2C7EF8",
    list: [{
      pagePath: "/pages/index/index",
      text: "资产",
      iconClass: "fa-home",
      selectedIconClass: "fa-home"
    },
    {
      pagePath: "/pages/statistics/statistics",
      text: "统计",
      iconClass: "fa-chart-pie",
      selectedIconClass: "fa-chart-pie"
    },
    {
      pagePath: "/pages/personal/personal",
      text: "我的",
      iconClass: "fa-user",
      selectedIconClass: "fa-user"
    }]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 如果点击的就是当前页，不做跳转
      if (this.data.selected === data.index) {
        return;
      }
      
      // 立即更新选中状态，提高响应速度
      this.setData({
        selected: data.index
      });
      
      wx.switchTab({
        url
      });
    },
    
    init() {
      const page = getCurrentPages().pop();
      const route = page ? page.route : null;
      
      if (!route) return;
      
      const index = this.data.list.findIndex(item => ('/' + route) === item.pagePath);
      
      if (index !== -1 && index !== this.data.selected) {
        this.setData({ selected: index });
      }
    }
  },
  
  lifetimes: {
    attached() {
      this.init();
    },
    
    ready() {
      this.init();
    }
  },
  
  pageLifetimes: {
    show() {
      this.init();
    }
  }
}); 