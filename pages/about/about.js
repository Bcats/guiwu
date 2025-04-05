// pages/about/about.js
const app = getApp();
const {
  getTheme
} = require('../../utils/theme');

Page({
  data: {
    theme: 'light',
    version: '1.0.0',
    updateTime: '2025-03-22',
    contactEmail: 'MYbcats@163.com'
  },

  onLoad: function (options) {
    // 设置主题
    this.setData({
      theme: getTheme()
    });

    // 获取版本信息
    this.getVersionInfo();
  },

  onShow: function () {
    // 更新主题
    this.setData({
      theme: getTheme()
    });

    // // 每次显示时更新版本信息
    // this.getVersionInfo();
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
  },

  // 复制联系邮箱
  copyEmail: function () {
    wx.setClipboardData({
      data: this.data.contactEmail,
      success: function (res) {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      }
    });
  },

  // 查看用户协议
  openUserAgreement: function () {
    wx.showModal({
      title: '用户协议',
      content: '暂无用户协议可查看',
      showCancel: false
    });
  },

  // 查看隐私政策
  openPrivacyPolicy: function () {
    wx.showModal({
      title: '隐私政策',
      content: '暂无隐私政策可查看',
      showCancel: false
    });
  },

  // 检查更新

  checkUpdate: function () {
    wx.showLoading({
      title: '检查更新中...',
      mask: true
    });

    // 获取小程序更新管理器
    if (!wx.getUpdateManager) {
      wx.hideLoading();
      wx.showModal({
        title: '检查更新',
        content: '当前微信版本不支持自动更新，请升级微信版本',
        showCancel: false
      });
      return;
    }

    const updateManager = wx.getUpdateManager();

    // 监听检查结果
    updateManager.onCheckForUpdate(res => {
      wx.hideLoading();
      console.log('小程序是否有新版本：', res.hasUpdate);
      if (res.hasUpdate) {
        // 有新版本，监听下载完成事件
        updateManager.onUpdateReady(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: (res) => {
              if (res.confirm) {
                // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                updateManager.applyUpdate();
              }
            }
          });
        });

        // 监听下载失败事件
        updateManager.onUpdateFailed(() => {
          wx.showModal({
            title: '更新提示',
            content: '新版本下载失败，请检查网络后重试',
            showCancel: false
          });
        });
      } else {
        // 没有新版本
        setTimeout(() => {
          wx.showToast({
            title: '已经是最新版本',
            icon: 'success',
            duration: 2000
          });
        }, 500);
      }
    });
  }

});