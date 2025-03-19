// pages/feedback/feedback.js
const app = getApp();

Page({
  data: {
    app: getApp(),
    theme: 'light',
    feedbackContent: '',
    contactInfo: '',
    submitDisabled: true,
    submitting: false
  },
  
  onLoad: function() {
    this.setData({
      theme: app.getTheme()
    });
  },
  
  onShow: function() {
    // 应用主题
    this.setData({
      theme: app.getTheme()
    });
  },
  
  // 监听主题变化
  onThemeChanged: function(themeData) {
    this.setData({
      theme: themeData.theme
    });
  },
  
  // 输入反馈内容
  onInputFeedback: function(e) {
    const content = e.detail.value;
    this.setData({
      feedbackContent: content,
      submitDisabled: content.trim().length < 5
    });
  },
  
  // 输入联系方式
  onInputContact: function(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },
  
  // 提交反馈
  submitFeedback: function() {
    const content = this.data.feedbackContent.trim();
    
    if (content.length < 5) {
      wx.showToast({
        title: '反馈内容太短',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      submitting: true
    });
    
    // 模拟提交过程
    setTimeout(() => {
      this.setData({
        submitting: false
      });
      
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000,
        complete: () => {
          // 延迟返回
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
      
      // 清空表单
      this.setData({
        feedbackContent: '',
        contactInfo: '',
        submitDisabled: true
      });
    }, 1000);
  }
}); 