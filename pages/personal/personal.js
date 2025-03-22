// pages/personal/personal.js
const app = getApp();
const { getUserInfo, saveUserInfo, userLogout } = require('../../utils/user');
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
    loading: true,
    isLoggedIn: false
  },

  onLoad: function () {
    this.setData({
      theme: app.getTheme()
    });
    
    this.checkLoginStatus();
    this.loadData();
  },

  onShow: function () {
    this.setData({ theme: app.getTheme() });
    
    this.checkLoginStatus();
    this.loadData();
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  // 检查登录状态
  checkLoginStatus: function() {
    let userInfo = wx.getStorageSync('userInfo');
    const isLoggedIn = !!userInfo && userInfo.nickName !== '游客' && userInfo.nickName !== '未登录';
    
    if (!userInfo) {
      // 为未登录用户提供默认信息
      userInfo = {
        avatarUrl: '/static/images/default-avatar.png',
        nickName: '未登录',
        userId: ''
      };
      wx.setStorageSync('userInfo', userInfo);
    } else if (userInfo.avatarUrl && userInfo.avatarUrl.includes('/assets/')) {
      // 修复路径
      userInfo.avatarUrl = '/static/images/default-avatar.png';
      wx.setStorageSync('userInfo', userInfo);
    }
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn,
      loading: false
    });
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

  // 获取用户信息
  getUserProfile: function() {
    // 如果已登录，则不再获取
    if (this.data.isLoggedIn) {
      return;
    }
    
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        console.log("获取用户信息成功", res);
        const userInfo = res.userInfo;
        
        // 生成随机用户ID
        const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
        const userId = `user_${randomSuffix}`;
        
        // 补充用户ID
        userInfo.userId = userId;
        
        // 保存用户信息
        wx.setStorageSync('userInfo', userInfo);
        app.updateUserInfo && app.updateUserInfo(userInfo);
        
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true
        });
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error("获取用户信息失败", err);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 用户登出
  userLogout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确定
          const defaultUserInfo = {
            avatarUrl: '/static/images/default-avatar.png',
            nickName: '未登录',
            userId: ''
          };
          
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          // 设置默认用户信息
          wx.setStorageSync('userInfo', defaultUserInfo);
          app.userLogout && app.userLogout();
          
          this.setData({
            userInfo: defaultUserInfo,
            isLoggedIn: false
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 显示清除数据确认框
  showClearDataConfirm: function() {
    this.setData({
      showClearConfirm: true
    });
  },
  
  // 隐藏清除数据确认框
  hideClearDataConfirm: function() {
    this.setData({
      showClearConfirm: false
    });
  },
  
  // 阻止点击穿透
  preventTap: function(e) {
    // 阻止事件冒泡
    return;
  },
  
  // 清除所有数据
  clearAllData: function() {
    wx.showLoading({
      title: '正在清除...'
    });
    
    // 清除资产数据
    wx.removeStorageSync('assets');
    
    // 更新状态
    this.setData({
      showClearConfirm: false,
      assetStats: {
        count: 0,
        totalValue: 0
      }
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '数据已清除',
        icon: 'success'
      });
      
      // 刷新首页资产
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
          success: () => {
            // 获取首页实例并刷新数据
            const pages = getCurrentPages();
            const indexPage = pages.find(page => page.route === 'pages/index/index');
            if (indexPage && typeof indexPage.onPullDownRefresh === 'function') {
              indexPage.onPullDownRefresh();
            }
            
            // 或者通过事件广播通知首页刷新
            if (app.globalData) {
              app.globalData.needRefresh = true;
            }
          }
        });
      }, 1000);
    }, 800);
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
      title: '归物盒子 - 让资产管理更简单高效',
      path: '/pages/index/index',
      imageUrl: '/static/images/share-cover.png',
      success: function(res) {
        // 分享成功
        wx.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 2000
        });
      },
      fail: function(res) {
        // 分享失败
        wx.showToast({
          title: '分享失败',
          icon: 'none',
          duration: 2000
        });
      }
    };
  }
}) 