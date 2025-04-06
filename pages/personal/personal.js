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
      nickName: '游客',
      userId: 'guest'
    },
    assetStats: {
      count: 0,
      totalValue: 0
    },
    theme: 'light',
    loading: true,
    isLoggedIn: false,
    version: '1.0.0',
    updateTime: '2025-03-22',
    showProfileDialog: false,
    wxUserInfo: null,
    useDays: 0,  // 使用天数
    menuList: [
      // 菜单列表...
    ]
  },

  onLoad: function () {
    this.getVersionInfo();
    this.setData({
      theme: app.getTheme()
    });
    
    // 检查并设置首次使用日期
    let firstUseDate = wx.getStorageSync('firstUseDate');
    if (!firstUseDate) {
      const now = new Date();
      firstUseDate = now.toISOString();
      wx.setStorageSync('firstUseDate', firstUseDate);
      console.log('首次使用日期已设置:', firstUseDate);
    }
    
    this.checkLoginStatus();
    this.loadData();
    this.calculateUseDays(); // 计算使用天数
  },

  onShow: function () {
    this.setData({ theme: app.getTheme() });
    
    this.checkLoginStatus();
    this.loadData();
    this.calculateUseDays(); // 计算使用天数
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  // 计算使用天数
  calculateUseDays: function() {
    // 从存储中获取首次使用日期
    const firstUseDate = wx.getStorageSync('firstUseDate');
    if (firstUseDate) {
      // 使用ISO字符串创建日期时，确保处理正确的时区
      // 替换连字符以修复某些环境中的日期解析问题
      const firstDateStr = firstUseDate.replace(/-/g, '/').replace(/T/g, ' ').split('.')[0];
      const firstDate = new Date(firstDateStr);
      
      // 使用当前日期时区的时间
      const today = new Date();
      
      // 计算两个日期的时间戳差值（毫秒）
      const diffTime = Math.abs(today.getTime() - firstDate.getTime());
      
      // 转换为天数（1天 = 24小时 * 60分钟 * 60秒 * 1000毫秒）
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
      
      // 首次使用当天算第1天
      this.setData({
        useDays: Math.max(1, diffDays + 1)
      });
      
      console.log('使用天数计算结果:', this.data.useDays, '首次使用日期:', firstDateStr, '今天:', today.toLocaleString());
    } else {
      // 如果没有首次使用日期，设置为1天
      this.setData({
        useDays: 1
      });
      console.log('未找到首次使用日期，默认使用天数设为1');
      
      // 设置今天为首次使用日期
      const now = new Date();
      wx.setStorageSync('firstUseDate', now.toISOString());
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

  /**
   * 登录获取用户信息
   */
  getUserProfile() {
    console.log('用户点击头像，尝试获取信息');
    
    if (this.data.isLoggedIn) {
      console.log('用户已登录，显示编辑资料对话框');
      // 对已登录用户，将当前用户信息传递给对话框组件
      this.setData({
        wxUserInfo: {
          avatarUrl: this.data.userInfo.avatarUrl,
          nickName: this.data.userInfo.nickName,
          userId: this.data.userInfo.userId
        },
        showProfileDialog: true
      });
      return;
    }

    wx.showLoading({
      title: '获取信息中',
    });

    console.log('调用wx.getUserProfile API');
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        wx.hideLoading();
        
        // 生成随机用户ID
        const userId = 'user_' + Math.random().toString(36).substr(2, 9);
        
        // 将用户信息保存到data
        const userInfo = res.userInfo;
        userInfo.userId = userId;
        
        this.setData({
          wxUserInfo: userInfo,
          showProfileDialog: true
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.hideLoading();
        
        // 根据错误类型显示不同提示
        if (err.errMsg.indexOf('auth deny') > -1 || err.errMsg.indexOf('auth denied') > -1) {
          wx.showToast({
            title: '您已拒绝授权',
            icon: 'none'
          });
        } else if (err.errMsg.indexOf('cancel') > -1) {
          wx.showToast({
            title: '您已取消登录',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 用户确认个人资料设置
   */
  onProfileConfirm(e) {
    console.log('用户确认个人资料:', e.detail);
    const { userInfo } = e.detail;
    
    // 隐藏对话框
    this.setData({
      showProfileDialog: false
    });
    
    // 如果不是已登录状态，这是首次登录
    if (!this.data.isLoggedIn) {
      // 处理头像上传（如果用户选择了新头像）
      if (userInfo.avatarChanged && userInfo.customAvatarUrl) {
        this.uploadUserAvatar(userInfo.customAvatarUrl);
      }
      
      // 首次登录，设置注册日期（保留此逻辑用于其他用途）
      const now = new Date();
      
      // 设置用户信息并登录
      this.setData({
        userInfo: {
          avatarUrl: userInfo.avatarUrl,
          nickName: userInfo.nickname,
          userId: this.data.wxUserInfo.userId || 'user_' + Math.random().toString(36).substr(2, 9),
          registerDate: now.toISOString() // 记录注册日期（保留）
        },
        isLoggedIn: true
      });
      
      // 保存用户信息到本地存储
      wx.setStorageSync('userInfo', this.data.userInfo);
      wx.setStorageSync('isLoggedIn', true);
      
      // 计算使用天数（不再依赖registerDate）
      this.calculateUseDays();
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    } else {
      // 已登录状态，更新用户信息
      // 处理头像上传（如果用户选择了新头像）
      if (userInfo.avatarChanged && userInfo.customAvatarUrl) {
        this.uploadUserAvatar(userInfo.customAvatarUrl);
      }
      
      // 更新用户信息，保留注册日期
      this.setData({
        'userInfo.avatarUrl': userInfo.avatarUrl,
        'userInfo.nickName': userInfo.nickname
      });
      
      // 保存更新后的用户信息到本地存储
      wx.setStorageSync('userInfo', this.data.userInfo);
      
      wx.showToast({
        title: '资料已更新',
        icon: 'success'
      });
    }
  },

  /**
   * 用户取消个人资料设置
   */
  onProfileCancel() {
    console.log('用户取消个人资料设置');
    this.setData({
      showProfileDialog: false
    });
    
    // 如果是首次登录(还未登录)，显示提示
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '您已取消登录',
        icon: 'none'
      });
    }
  },

  /**
   * 上传用户头像
   */
  uploadUserAvatar(tempFilePath) {
    console.log('准备上传头像:', tempFilePath);
    // TODO: 这里可以实现上传头像到服务器的逻辑
    // 为了简化，这里仅做本地处理
    console.log('头像已保存到本地');
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
            // 移除 useDays: 0，保持使用天数不变
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转到数据管理页面
  goToDataManage: function() {
    wx.navigateTo({
      url: '/pages/data-manage/data-manage'
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

  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage: function () {
    return {
      title: '物记盒子 - 让资产管理更简单高效',
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
  },

  // 获取版本信息
  getVersionInfo: function () {
    // 优先从全局获取版本信息
    if (app.globalData.versionInfo && app.globalData.versionInfo.version) {
      console.log('globalData.versionInfo', app.globalData.versionInfo);
      this.setData({
        version: app.globalData.versionInfo.version,
        updateTime: app.globalData.versionInfo.updateTime
      });
      return;
    }
  }
}); 