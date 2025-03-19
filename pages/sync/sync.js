// pages/sync/sync.js
const { getTheme } = require('../../utils/theme');

Page({
  data: {
    theme: 'light',
    iCloudSync: true,
    localBackup: false,
    lastSyncTime: '--',
    lastBackupTime: '--',
    syncInProgress: false,
    backupInProgress: false
  },

  onLoad: function (options) {
    // 设置主题
    this.setData({ theme: getTheme() });
    
    // 获取上次同步时间
    const lastSyncTime = wx.getStorageSync('lastSyncTime');
    const lastBackupTime = wx.getStorageSync('lastBackupTime');
    
    if (lastSyncTime) {
      this.setData({
        lastSyncTime: this.formatSyncTime(lastSyncTime)
      });
    }
    
    if (lastBackupTime) {
      this.setData({
        lastBackupTime: this.formatSyncTime(lastBackupTime)
      });
    }
    
    // 获取同步设置
    this.setData({
      iCloudSync: wx.getStorageSync('iCloudSync') !== false,
      localBackup: wx.getStorageSync('localBackup') === true
    });
  },
  
  onShow: function () {
    // 更新主题
    this.setData({ theme: getTheme() });
  },
  
  // 格式化同步时间
  formatSyncTime: function (timestamp) {
    if (!timestamp) return '--';
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
  
  // 切换iCloud同步设置
  toggleICloudSync: function (e) {
    const value = e.detail.value;
    
    this.setData({
      iCloudSync: value
    });
    
    wx.setStorageSync('iCloudSync', value);
    
    if (value) {
      wx.showToast({
        title: '已开启iCloud同步',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '已关闭iCloud同步',
        icon: 'none'
      });
    }
  },
  
  // 切换本地备份设置
  toggleLocalBackup: function (e) {
    const value = e.detail.value;
    
    this.setData({
      localBackup: value
    });
    
    wx.setStorageSync('localBackup', value);
    
    if (value) {
      wx.showToast({
        title: '已开启本地备份',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '已关闭本地备份',
        icon: 'none'
      });
    }
  },
  
  // 立即同步
  syncNow: function () {
    if (this.data.syncInProgress) return;
    
    this.setData({
      syncInProgress: true
    });
    
    wx.showLoading({
      title: '同步中...',
      mask: true
    });
    
    // 模拟同步过程
    setTimeout(() => {
      const now = Date.now();
      
      this.setData({
        lastSyncTime: this.formatSyncTime(now),
        syncInProgress: false
      });
      
      wx.setStorageSync('lastSyncTime', now);
      wx.hideLoading();
      
      wx.showToast({
        title: '同步成功',
        icon: 'success'
      });
    }, 2000);
  },
  
  // 立即备份
  backupNow: function () {
    if (this.data.backupInProgress) return;
    
    this.setData({
      backupInProgress: true
    });
    
    wx.showLoading({
      title: '备份中...',
      mask: true
    });
    
    // 模拟备份过程
    setTimeout(() => {
      const now = Date.now();
      
      this.setData({
        lastBackupTime: this.formatSyncTime(now),
        backupInProgress: false
      });
      
      wx.setStorageSync('lastBackupTime', now);
      wx.hideLoading();
      
      wx.showToast({
        title: '备份成功',
        icon: 'success'
      });
    }, 2000);
  },
  
  // 恢复备份
  restoreBackup: function () {
    wx.showModal({
      title: '恢复备份',
      content: '确定要从最近的备份恢复数据吗？当前数据将被覆盖。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '恢复中...',
            mask: true
          });
          
          // 模拟恢复过程
          setTimeout(() => {
            wx.hideLoading();
            
            wx.showToast({
              title: '恢复成功',
              icon: 'success'
            });
          }, 2000);
        }
      }
    });
  }
}); 