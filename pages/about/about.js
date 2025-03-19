// pages/about/about.js
const { getTheme } = require('../../utils/theme');

Page({
  data: {
    theme: 'light',
    version: '1.0.0',
    updateTime: '2023-07-15',
    contactEmail: 'support@guiwu.com'
  },

  onLoad: function (options) {
    // 设置主题
    this.setData({ theme: getTheme() });
  },

  onShow: function () {
    // 更新主题
    this.setData({ theme: getTheme() });
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
      title: '检查中...',
      mask: true
    });

    // 模拟检查更新
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showModal({
        title: '检查更新',
        content: '当前已是最新版本',
        showCancel: false
      });
    }, 1500);
  }
}); 