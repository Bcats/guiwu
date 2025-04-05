const { getTheme, getThemeColor } = require('./utils/theme');

App({
  globalData: {
    theme: 'light',
    userInfo: null,
    themeColor: '#2C7EF8',
    themeStyle: null,
    needRefresh: false,  // 控制首页刷新的标记
    versionInfo: {
      version: '',
      updateTime: ''
    }
  },

  onLaunch: function () {
    console.log('App onLaunch');
    // 初始化主题设置
    this.initTheme();
    
    // 获取版本信息
    this.getVersionInfo();
    
    // 检查小程序更新
    this.checkForUpdates();
    
    // 初始化首次使用的资产数据，仅用于演示
    // this.initDemoAssets();
    
    // 初始化主题样式变量
    this.updateThemeStyle();
    
    // 监听网络状态变化
    wx.onNetworkStatusChange(function(res) {
      console.log('网络状态变化：', res.isConnected);
    });
  },

  // 获取版本信息
  getVersionInfo: function() {
    try {
      // 获取小程序版本信息
      const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : {};
      const version = (accountInfo.miniProgram && accountInfo.miniProgram.version) || '1.0.0';
      console.log('当前版本信息:', accountInfo);
      // 获取当前日期作为更新时间
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const updateTime = `${year}-${month}-${day}`;
      
      // 保存到全局数据
      this.globalData.versionInfo = {
        version: version,
        updateTime: updateTime
      };
      
      console.log('当前版本信息:', this.globalData.versionInfo);
      return this.globalData.versionInfo;
    } catch(e) {
      console.error('获取版本信息失败:', e);
      return {
        version: '1.0.0',
        updateTime: '2025-03-22'
      };
    }
  },
  
  // 检查小程序更新
  checkForUpdates: function() {
    if (!wx.getUpdateManager) {
      console.log('当前微信版本不支持自动更新');
      return;
    }
    
    // 获取小程序更新管理器
    const updateManager = wx.getUpdateManager();
    
    // 监听向微信后台请求检查更新结果事件
    updateManager.onCheckForUpdate(function(res) {
      // res.hasUpdate 表示是否有更新版本
      console.log('小程序是否有新版本：', res.hasUpdate);
      if (res.hasUpdate) {
        wx.showToast({
          title: '发现新版本',
          icon: 'none',
          duration: 2000
        });
      }
    });
    
    // 监听小程序有版本更新事件，客户端主动触发下载
    updateManager.onUpdateReady(function() {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate();
          }
        }
      });
    });
    
    // 监听小程序更新失败事件
    updateManager.onUpdateFailed(function() {
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false
      });
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
    
    // 更新主题样式
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
    
    // 使用时间戳作为基础ID，确保唯一性
    const baseTimestamp = Date.now();
    
    // 示例数据
    const demoAssets = [
      {
        id: 'asset_' + baseTimestamp + '_1',
        name: 'iPhone 12 Pro',
        category: '电子产品',
        price: 9299,
        purchaseDate: '2022-01-01',
        description: '深空灰 256GB',
        status: '使用中',
        targetDate: '2026-01-01',
        expectedDailyCost: 5.91,
        createTime: new Date('2022-01-01').toISOString()
      },
      {
        id: 'asset_' + baseTimestamp + '_2',
        name: 'MacBook Pro',
        category: '电子产品',
        price: 12800,
        purchaseDate: '2021-02-15',
        description: 'M1芯片 16GB内存',
        status: '使用中',
        targetDate: '2025-02-15',
        expectedDailyCost: 17.5,
        createTime: new Date('2021-02-15').toISOString()
      },
      {
        id: 'asset_' + baseTimestamp + '_3',
        name: 'Sony A7m4',
        category: '摄影器材',
        price: 14800,
        purchaseDate: '2022-06-01',
        description: '全画幅微单相机',
        status: '使用中',
        targetDate: '2027-06-01',
        expectedDailyCost: 264.3,
        usageType: '次',
        createTime: new Date('2022-06-01').toISOString()
      },
      {
        id: 'asset_' + baseTimestamp + '_4',
        name: '平衡车',
        category: '交通工具',
        price: 3583,
        purchaseDate: '2019-06-18',
        description: '电动代步工具',
        status: '使用中',
        targetDate: '2023-06-18',
        expectedDailyCost: 2.5,
        createTime: new Date('2019-06-18').toISOString()
      },
      {
        id: 'asset_' + baseTimestamp + '_5',
        name: 'Sony PS5',
        category: '娱乐',
        price: 3500,
        purchaseDate: '2022-10-01',
        description: '游戏主机',
        status: '使用中',
        targetDate: '2026-10-01',
        expectedDailyCost: 20.7,
        createTime: new Date('2022-10-01').toISOString()
      }
    ];
    
    // 保存到本地存储
    wx.setStorageSync('assets', demoAssets);
    wx.setStorageSync('demoInitialized', true);
    
    console.log('初始化演示资产数据完成');
  },

  // 初始化主题
  initTheme: function() {
    const theme = wx.getStorageSync('theme') || 'light';
    const themeColor = wx.getStorageSync('themeColor') || '#2C7EF8';
    
    this.globalData.theme = theme;
    this.globalData.themeColor = themeColor;
  },
});