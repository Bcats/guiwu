// pages/theme/theme.js
const { getTheme, setTheme, getThemeColor, setThemeColor, getAllThemeColors } = require('../../utils/theme');

Page({
  data: {
    theme: 'light',
    themeColor: '',
    colors: [],
    selectedColor: ''
  },

  onLoad: function (options) {
    // 获取当前主题设置
    const theme = getTheme();
    const themeColor = getThemeColor();
    
    // 获取所有可用主题色
    const themeColors = getAllThemeColors();
    const colors = [];
    
    // 转换颜色对象为数组格式
    for (const key in themeColors) {
      colors.push({
        name: key,
        value: themeColors[key]
      });
      
      // 找到当前选中的颜色
      if (themeColors[key] === themeColor) {
        this.data.selectedColor = key;
      }
    }
    
    this.setData({
      theme: theme,
      themeColor: themeColor,
      colors: colors,
      selectedColor: this.data.selectedColor
    });
  },

  // 切换主题模式（亮/暗）
  toggleTheme: function (e) {
    const theme = e.detail.value ? 'dark' : 'light';
    setTheme(theme);
    
    this.setData({
      theme: theme
    });
    
    // 通知首页刷新主题
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];  // 获取上一个页面
    if (prevPage) {
      prevPage.setData({
        theme: theme
      });
    }
    
    // 显示提示
    wx.showToast({
      title: '主题已更新',
      icon: 'success'
    });
  },

  // 选择主题色
  selectColor: function (e) {
    const colorKey = e.currentTarget.dataset.name;
    const colorValue = e.currentTarget.dataset.value;
    
    setThemeColor(colorKey);
    
    this.setData({
      themeColor: colorValue,
      selectedColor: colorKey
    });
    
    // 显示提示
    wx.showToast({
      title: '主题色已更新',
      icon: 'success'
    });
    
    // 更新全局主题色变量
    wx.setStorageSync('themeColorValue', colorValue);
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
}); 