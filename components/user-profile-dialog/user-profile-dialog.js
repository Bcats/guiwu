Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    wxUserInfo: {
      type: Object,
      value: null
    }
  },
  
  data: {
    avatarUrl: '/static/images/default-avatar.png',
    nickname: '',
    focusNickname: false,
    avatarChanged: false, // 标记头像是否已更改
    customAvatarUrl: '' // 用户选择的头像临时路径
  },

  observers: {
    'wxUserInfo': function(wxUserInfo) {
      console.log('wxUserInfo changed:', wxUserInfo);
      if (wxUserInfo) {
        // 如果微信用户信息有效且头像未更改，设置默认头像
        if (wxUserInfo.avatarUrl && !this.data.avatarChanged) {
          this.setData({
            avatarUrl: wxUserInfo.avatarUrl
          });
        }
        
        // 使用wxUserInfo中的昵称（无论是nickName还是已登录用户的nickName）
        if (wxUserInfo.nickName) {
          this.setData({
            nickname: wxUserInfo.nickName
          });
        }
      }
    },
    
    'show': function(show) {
      if (show) {
        console.log('Dialog shown, resetting focus');
        // 当对话框显示时，将焦点重置为false
        this.setData({
          focusNickname: false,
          avatarChanged: false // 重置头像更改标记
        });
        
        // 当对话框显示时，重新从wxUserInfo初始化数据
        const wxUserInfo = this.properties.wxUserInfo;
        if (wxUserInfo) {
          const updates = {};
          
          if (wxUserInfo.avatarUrl) {
            updates.avatarUrl = wxUserInfo.avatarUrl;
          }
          
          if (wxUserInfo.nickName) {
            updates.nickname = wxUserInfo.nickName;
          }
          
          if (Object.keys(updates).length > 0) {
            this.setData(updates);
            console.log('重新初始化用户资料:', updates);
          }
        }
      }
    }
  },
  
  methods: {
    preventBubble() {
      // 阻止事件冒泡
    },
    
    // 处理微信头像选择事件
    onChooseAvatar(e) {
      console.log('用户选择了头像:', e.detail);
      const { avatarUrl } = e.detail;
      if (avatarUrl) {
        this.setData({
          avatarUrl: avatarUrl,
          customAvatarUrl: avatarUrl,
          avatarChanged: true
        });
        console.log('设置新头像成功');
      } else {
        console.error('获取头像失败');
        wx.showToast({
          title: '获取头像失败',
          icon: 'none'
        });
      }
    },
    
    onNicknameFocus() {
      this.setData({
        focusNickname: true
      });
    },
    
    onNicknameInput(e) {
      console.log('昵称输入:', e.detail);
      this.setData({
        nickname: e.detail.value
      });
    },
    
    onCancel() {
      // 重置状态并触发取消事件
      this.setData({
        avatarChanged: false
      });
      this.triggerEvent('cancel');
    },
    
    onConfirm() {
      if (!this.data.nickname) {
        wx.showToast({
          title: '请输入昵称',
          icon: 'none'
        });
        return;
      }
      
      const userInfo = {
        avatarUrl: this.data.avatarUrl,
        nickname: this.data.nickname,
        customAvatarUrl: this.data.avatarChanged ? this.data.customAvatarUrl : '',
        avatarChanged: this.data.avatarChanged
      };
      
      console.log('确认个人资料:', userInfo);
      this.triggerEvent('confirm', { userInfo });
    }
  }
}); 