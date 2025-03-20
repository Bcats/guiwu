// pages/personal/personal.js
const app = getApp();
const { getUserInfo, userLogout } = require('../../utils/user');
const { setTheme, getTheme } = require('../../utils/theme');
const assetManager = require('../../utils/assetManager');

Page({
  data: {
    app: getApp(),
    userInfo: {
      avatarUrl: '/static/images/default-avatar.png',
      nickName: '未登录',
      userId: ''
    },
    assetStats: {
      count: 0,
      totalValue: 0
    },
    theme: 'light',
    showClearConfirm: false,
    loading: true
  },

  onLoad: function () {
    this.setData({
      theme: app.getTheme()
    });
    
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const userId = `user_${randomSuffix}`;

    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      userInfo = {
        avatarUrl: '/static/images/default-avatar.png',
        nickName: '游客',
        userId: userId
      };
      wx.setStorageSync('userInfo', userInfo);
    } else if (userInfo.avatarUrl && userInfo.avatarUrl.includes('/assets/')) {
      // 修复路径
      userInfo.avatarUrl = '/static/images/default-avatar.png';
      wx.setStorageSync('userInfo', userInfo);
    }
    
    this.setData({
      userInfo: userInfo,
      loading: false
    });
    
    this.loadData();
  },

  onShow: function () {
    this.setData({ theme: app.getTheme() });
    
    this.loadData();
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  loadData: function () {
    const stats = assetManager.getStats();
    
    this.setData({
      assetStats: {
        count: stats.totalCount,
        totalValue: stats.totalValue
      }
    });
  },

  goToTheme: function () {
    wx.navigateTo({
      url: '/pages/theme/theme'
    });
  },

  goToAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  shareApp: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none',
      duration: 2000
    });
  },

  sendFeedback: function () {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  goToAddAsset: function () {
    wx.navigateTo({
      url: '/pages/add/add'
    });
  },

  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage: function () {
    return {
      title: '归物 - 让物品管理更简单',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-cover.png'
    };
  }
}) 