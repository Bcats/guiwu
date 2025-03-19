// components/tabBar/tabBar.js
const app = getApp();

Component({
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },
  
  data: {
    theme: 'light',
    themeColor: '#2C7EF8',
    themeStyle: {},
    list: [
      {
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
      }
    ]
  },
  
  attached() {
    // 获取全局主题
    if (app.globalData) {
      this.setData({
        theme: app.globalData.theme || 'light',
        themeColor: app.globalData.themeColor || '#2C7EF8',
        themeStyle: app.globalData.themeStyle || {}
      });
    }
    
    // 监听主题变化
    this.watchTheme();
  },
  
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      console.log('switchTab', url);
      wx.switchTab({
        url
      });
    },
    
    goToAddPage() {
      wx.navigateTo({
        url: '/pages/add/add'
      });
    },
    
    // 监听主题变化
    watchTheme() {
      if (app.watchTheme) {
        app.watchTheme((theme, themeColor) => {
          this.setData({ 
            theme: theme,
            themeColor: themeColor,
            themeStyle: app.globalData.themeStyle || {}
          });
        });
      }
    },
    
    // 更新主题
    updateTheme(theme, themeColor) {
      this.setData({
        theme: theme,
        themeColor: themeColor,
        themeStyle: app.globalData.themeStyle || {}
      });
    }
  }
}); 