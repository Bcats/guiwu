const { getTheme, getThemeColor } = require('./utils/theme');

App({
  globalData: {
    theme: 'light',
    userInfo: null,
    themeColor: '#2C7EF8',
    themeStyle: null
  },

  onLaunch: function () {
    console.log('App onLaunch');
    // 初始化主题设置
    this.initTheme();
    
    // 初始化首次使用的资产数据，仅用于演示
    this.initDemoAssets();
    
    // 初始化主题样式变量，防止访问前未定义
    this.globalData.themeStyle = {
      '--color-primary': '#2C7EF8',
      '--color-background': '#F7F8FA',
      '--color-card': '#FFFFFF',
      '--color-text': '#333333',
      '--color-text-secondary': '#666666',
      '--color-text-light': '#999999',
      '--color-border': '#EEEEEE'
    };
    
    // 检查是否有已保存的主题设置
    const savedTheme = wx.getStorageSync('theme') || 'light';
    const savedThemeColor = wx.getStorageSync('themeColor') || '#2C7EF8';
    
    this.setTheme(savedTheme);
    this.setThemeColor(savedThemeColor);
    
    // 监听网络状态变化
    wx.onNetworkStatusChange(function(res) {
      console.log('网络状态变化：', res.isConnected);
    });
  },

  // 获取当前主题
  getTheme: function () {
    return this.globalData.theme;
  },

  // 获取当前主题色
  getThemeColor: function () {
    return this.globalData.themeColor;
  },

  // 设置主题
  setTheme: function (theme) {
    this.globalData.theme = theme;
    wx.setStorageSync('theme', theme);
    
    // 设置主题相关样式
    const themeStyle = this.getThemeStyle(theme);
    this.globalData.themeStyle = themeStyle;
    
    // 更新页面主题样式
    this.updateThemeStyle();
    
    // 通知所有页面更新主题
    this.notifyPagesThemeChanged();
    
    // 通知监听器主题变化
    this.notifyThemeChange();
    
    return theme;
  },
  
  // 设置主题色
  setThemeColor: function (color) {
    this.globalData.themeColor = color;
    wx.setStorageSync('themeColor', color);
    
    // 更新页面主题样式
    this.updateThemeStyle();
    
    // 通知所有页面更新主题
    this.notifyPagesThemeChanged();
    
    // 通知监听器主题变化
    this.notifyThemeChange();
    
    return color;
  },
  
  // 更新主题样式
  updateThemeStyle: function () {
    const theme = this.globalData.theme;
    const themeColor = this.globalData.themeColor;
    
    // 设置页面样式变量
    let backgroundColor, textColor, cardColor, borderColor, textSecondary, textLight;
    
    if (theme === 'dark') {
      // 暗色模式
      backgroundColor = '#121212';
      cardColor = '#1E1E1E';
      textColor = '#FFFFFF';
      borderColor = '#333333';
      textSecondary = '#CCCCCC';
      textLight = '#999999';
    } else {
      // 亮色模式
      backgroundColor = '#F7F8FA';
      cardColor = '#FFFFFF';
      textColor = '#333333';
      borderColor = '#EEEEEE';
      textSecondary = '#666666';
      textLight = '#999999';
    }
    
    // 创建CSS变量对象
    this.globalData.themeStyle = {
      '--color-primary': themeColor,
      '--color-background': backgroundColor,
      '--color-card': cardColor,
      '--color-text': textColor,
      '--color-text-secondary': textSecondary,
      '--color-text-light': textLight,
      '--color-border': borderColor
    };
    
    // 兼容性处理：检查是否支持 setPageStyle
    if (typeof wx.setPageStyle === 'function') {
      try {
        // 创建CSS样式字符串
        let styleString = '';
        for (const key in this.globalData.themeStyle) {
          styleString += `${key}: ${this.globalData.themeStyle[key]}; `;
        }
        
        // 使用页面属性选择器设置全局样式
        try {
          const result = wx.setPageStyle({
            style: {
              '[data-theme]': styleString
            }
          });
          
          // 安全地处理可能的Promise结果
          if (result && typeof result.catch === 'function') {
            result.catch(function(err) {
              console.error('设置页面样式失败:', err);
            });
          }
        } catch (err) {
          console.error('设置页面样式API调用异常:', err);
        }
      } catch (err) {
        console.error('setPageStyle处理失败', err);
      }
    } else {
      console.log('当前环境不支持setPageStyle API，将使用数据属性传递主题变量');
    }
  },
  
  // 通知所有页面主题已更改
  notifyPagesThemeChanged: function () {
    // 获取当前所有页面实例
    const pages = getCurrentPages();
    
    // 遍历所有页面，调用它们的onThemeChanged方法
    pages.forEach(page => {
      if (page && typeof page.onThemeChanged === 'function') {
        page.onThemeChanged({
          theme: this.globalData.theme,
          themeColor: this.globalData.themeColor
        });
      }
    });
  },

  // 检查是否首次运行应用
  checkFirstRun: function () {
    const isFirstRun = wx.getStorageSync('isFirstRun');
    
    if (isFirstRun === '') {
      // 首次运行，可以进行一些初始化操作
      this.initFirstRun();
      
      // 标记应用已运行
      wx.setStorageSync('isFirstRun', 'false');
    }
  },
  
  // 首次运行初始化
  initFirstRun: function () {
    console.log('首次运行应用，进行初始化操作');
    
    // 可以在这里添加一些初始化操作，比如创建初始数据等
  },

  // 添加主题监听
  themeWatchers: [],
  
  // 添加主题变化监听器
  watchTheme: function(callback) {
    if (typeof callback === 'function') {
      this.themeWatchers.push(callback);
      // 立即通知当前主题
      callback(this.globalData.theme, this.globalData.themeColor);
    }
  },
  
  // 移除主题监听器
  unwatchTheme: function(callback) {
    const index = this.themeWatchers.indexOf(callback);
    if (index > -1) {
      this.themeWatchers.splice(index, 1);
    }
  },
  
  // 通知主题变化
  notifyThemeChange: function() {
    const theme = this.globalData.theme;
    const themeColor = this.globalData.themeColor;
    this.themeWatchers.forEach(callback => {
      if (typeof callback === 'function') {
        callback(theme, themeColor);
      }
    });
  },

  // 初始化演示资产数据
  initDemoAssets: function() {
    const hasInitialized = wx.getStorageSync('demoInitialized');
    if (hasInitialized) return;
    
    // 示例数据
    const demoAssets = [
      {
        id: 'asset_' + Date.now() + '_1',
        name: 'iPhone 12 Pro',
        category: '电子产品',
        price: 9299,
        purchaseDate: '2022-01-01',
        description: '深空灰 256GB',
        status: '使用中',
        targetDate: '2026-01-01',
        expectedDailyCost: 5.91
      },
      {
        id: 'asset_' + Date.now() + '_2',
        name: 'MacBook Pro',
        category: '电子产品',
        price: 12800,
        purchaseDate: '2021-02-15',
        description: 'M1芯片 16GB内存',
        status: '使用中',
        targetDate: '2025-02-15',
        expectedDailyCost: 17.5
      },
      {
        id: 'asset_' + Date.now() + '_3',
        name: 'Sony A7m4',
        category: '摄影器材',
        price: 14800,
        purchaseDate: '2022-06-01',
        description: '全画幅微单相机',
        status: '使用中',
        targetDate: '2027-06-01',
        expectedDailyCost: 264.3,
        usageType: '次'
      },
      {
        id: 'asset_' + Date.now() + '_4',
        name: '平衡车',
        category: '交通工具',
        price: 3583,
        purchaseDate: '2019-06-18',
        description: '电动代步工具',
        status: '使用中',
        targetDate: '2023-06-18',
        expectedDailyCost: 2.5
      },
      {
        id: 'asset_' + Date.now() + '_5',
        name: 'Sony PS5',
        category: '娱乐',
        price: 3500,
        purchaseDate: '2022-10-01',
        description: '游戏主机',
        status: '使用中',
        targetDate: '2026-10-01',
        expectedDailyCost: 20.7
      }
    ];
    
    // 保存到本地存储
    wx.setStorageSync('assets', demoAssets);
    wx.setStorageSync('demoInitialized', true);
    
    console.log('初始化演示资产数据完成');
  },

  // 获取主题样式
  getThemeStyle: function(theme) {
    const themeStyles = {
      light: {
        '--color-bg': '#f7f8fa',
        '--color-card': '#ffffff',
        '--color-text': '#333333',
        '--color-text-secondary': '#666666',
        '--color-primary': '#2C7EF8',
        '--color-border': '#e0e0e0'
      },
      dark: {
        '--color-bg': '#1a1a1a',
        '--color-card': '#2c2c2c',
        '--color-text': '#f0f0f0',
        '--color-text-secondary': '#a0a0a0',
        '--color-primary': '#3a86ff',
        '--color-border': '#444444'
      }
    };
    
    return themeStyles[theme] || themeStyles.light;
  },

  // 初始化主题
  initTheme: function() {
    const theme = wx.getStorageSync('theme') || 'light';
    this.setTheme(theme);
  },
});