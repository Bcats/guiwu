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
      console.log('TabBar.switchTab 被调用，当前索引:', this.data.selected, '目标索引:', e.currentTarget.dataset.index);
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 如果点击的就是当前页，不做跳转
      if (this.data.selected === data.index) {
        console.log('已经在当前页面，不执行跳转');
        return;
      }
      
      // 立即更新选中状态，提高响应速度
      this.setData({
        selected: data.index
      });
      
      console.log('切换到:', url);
      wx.switchTab({
        url
      });
    },
    
    init() {
      const page = getCurrentPages().pop();
      const route = page ? page.route : null;
      console.log('TabBar.init 当前页面路由:', route);
      
      if (!route) return;
      
      const index = this.data.list.findIndex(item => ('/' + route) === item.pagePath);
      console.log('匹配的TabBar索引:', index);
      
      if (index !== -1 && index !== this.data.selected) {
        this.setData({ selected: index });
      }
    }
  },
  
  lifetimes: {
    attached() {
      console.log('TabBar组件已附加');
      this.init();
    },
    
    ready() {
      console.log('TabBar组件已就绪');
      this.init();
    }
  },
  
  pageLifetimes: {
    show() {
      console.log('TabBar页面显示');
      this.init();
    }
  }
}); 