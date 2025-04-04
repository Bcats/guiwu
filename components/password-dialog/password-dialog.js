Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '请输入密码'
    },
    description: {
      type: String,
      value: '请输入用于加密/解密数据的密码'
    },
    showHint: {
      type: Boolean,
      value: true
    }
  },
  
  data: {
    password: ''
  },
  
  methods: {
    // 阻止冒泡，防止点击对话框内部关闭对话框
    preventBubble: function() {
      return;
    },
    
    // 处理密码输入
    onPasswordInput: function(e) {
      this.setData({
        password: e.detail.value
      });
    },
    
    // 取消按钮事件
    onCancel: function() {
      this.setData({
        password: ''
      });
      this.triggerEvent('cancel');
    },
    
    // 确认按钮事件
    onConfirm: function() {
      if (!this.data.password) {
        wx.showToast({
          title: '请输入密码',
          icon: 'none'
        });
        return;
      }
      
      this.triggerEvent('confirm', { password: this.data.password });
      
      // 清空密码
      setTimeout(() => {
        this.setData({
          password: ''
        });
      }, 300);
    }
  }
}); 