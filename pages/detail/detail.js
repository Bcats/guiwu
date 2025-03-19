// detail.js
const app = getApp();
const assetManager = require('../../utils/assetManager');
const dateUtil = require('../../utils/dateUtil');

Page({
  data: {
    asset: null,
    loading: true,
    theme: 'light',
    // 保修信息
    warranty: {
      status: 'unknown',
      daysLeft: 0
    },
    // 是否显示删除确认弹窗
    showDeleteConfirm: false,
    // 卡片是否展开
    isCardExpanded: false
  },

  onLoad: function(options) {
    // 应用主题
    this.setData({
      theme: app.getTheme()
    });
    
    if (!options.id) {
      wx.showToast({
        title: '资产ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 获取资产详情
    const id = options.id;
    if (id) {
      // 从本地存储获取资产
      const assets = wx.getStorageSync('assets') || [];
      const asset = assets.find(a => a.id === id);
      
      if (asset) {
        // 添加计算字段
        const processedAsset = this.calculateAssetProgress(asset);
        
        this.setData({
          asset: processedAsset,
          loading: false
        });
        
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: processedAsset.name
        });
      } else {
        this.setData({
          loading: false
        });
        
        wx.showToast({
          title: '找不到该资产',
          icon: 'none'
        });
      }
    } else {
      this.setData({
        loading: false
      });
      
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
    }
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },
  
  // 加载资产详情
  loadAssetDetail: function(id) {
    this.setData({ loading: true });
    
    setTimeout(() => {
      const asset = assetManager.getAssetById(id);
      
      if (!asset) {
        wx.showToast({
          title: '资产不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }
      
      // 更新资产使用次数
      assetManager.updateUsageCount(id);
      
      // 计算使用天数
      const usageDays = dateUtil.daysBetween(asset.purchaseDate);
      
      // 格式化使用时间描述
      const usagePeriod = dateUtil.getUsagePeriod(asset.purchaseDate);
      
      // 计算保修状态
      const warranty = dateUtil.getWarrantyStatus(asset.warrantyDate);
      
      // 计算日均成本
      const dailyCost = usageDays > 0 ? (Number(asset.price) / usageDays).toFixed(2) : 0;
      
      // 更新数据
      this.setData({
        asset: {
          ...asset,
          usageDays,
          usagePeriod,
          dailyCost,
          formattedPurchaseDate: dateUtil.formatDate(asset.purchaseDate),
          formattedWarrantyDate: dateUtil.formatDate(asset.warrantyDate)
        },
        warranty,
        loading: false
      });
    }, 500);
  },
  
  // 跳转到编辑页面
  goToEdit: function() {
    wx.navigateTo({
      url: `/pages/add/add?id=${this.data.asset.id}`
    });
  },
  
  // 显示删除确认
  showDeleteConfirm: function() {
    this.setData({
      showDeleteConfirm: true
    });
  },
  
  // 隐藏删除确认
  hideDeleteConfirm: function() {
    this.setData({
      showDeleteConfirm: false
    });
  },
  
  // 删除资产
  deleteAsset: function() {
    const { asset } = this.data;
    
    const success = assetManager.deleteAsset(asset.id);
    
    if (success) {
      wx.showToast({
        title: '删除成功'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
    
    this.hideDeleteConfirm();
  },
  
  // 获取保修状态对应的文本
  getWarrantyStatusText: function(status) {
    const statusMap = {
      'unknown': '未知',
      'valid': '保修中',
      'expiring': '即将过期',
      'expired': '已过期'
    };
    
    return statusMap[status] || '未知';
  },
  
  // 页面显示时刷新数据
  onShow: function() {
    if (this.data.asset) {
      this.loadAssetDetail(this.data.asset.id);
    }
  },

  // 计算资产使用进度和状态
  calculateAssetProgress(asset) {
    if (!asset) return asset;
    
    // 计算使用天数
    const purchaseDate = new Date(asset.purchaseDate);
    const currentDate = new Date();
    const usageDays = Math.floor((currentDate - purchaseDate) / (24 * 60 * 60 * 1000));
    
    // 基本信息
    let result = {
      ...asset,
      usageDays,
      formattedPurchaseDate: asset.purchaseDate || '未设置',
      usagePercentage: 0,
      isRetired: asset.status === '已退役',
      currentDailyAverage: '0.00',
      remainingDays: 0
    };
    
    // 计算均价
    if (usageDays > 0) {
      result.currentDailyAverage = (asset.price / usageDays).toFixed(2);
    }
    
    // 计算目标日期和进度
    if (asset.targetDate) {
      const targetDate = new Date(asset.targetDate);
      const totalPlannedDays = Math.floor((targetDate - purchaseDate) / (24 * 60 * 60 * 1000));
      
      if (totalPlannedDays > 0) {
        // 计算进度百分比
        let progress = (usageDays / totalPlannedDays) * 100;
        result.usagePercentage = Math.min(progress, 100).toFixed(2);
        
        // 计算剩余天数
        result.remainingDays = Math.max(totalPlannedDays - usageDays, 0);
        
        // 判断是否超期
        result.isOverTime = currentDate > targetDate && !result.isRetired;
      }
    }
    
    return result;
  },

  // 切换退役状态
  toggleRetireStatus() {
    const asset = this.data.asset;
    const newStatus = asset.isRetired ? '使用中' : '已退役';
    
    // 更新本地存储
    const assets = wx.getStorageSync('assets') || [];
    const index = assets.findIndex(a => a.id === asset.id);
    
    if (index !== -1) {
      assets[index].status = newStatus;
      wx.setStorageSync('assets', assets);
      
      // 更新UI
      const updatedAsset = this.calculateAssetProgress({
        ...asset,
        status: newStatus
      });
      
      this.setData({
        asset: updatedAsset
      });
      
      wx.showToast({
        title: newStatus === '已退役' ? '已标记为退役' : '已恢复使用',
        icon: 'none'
      });
    }
  },

  // 切换卡片展开状态
  toggleCardExpand: function() {
    this.setData({
      isCardExpanded: !this.data.isCardExpanded
    });
  },
  
  // 根据分类获取对应的图标
  getCategoryIcon: function(category) {
    const iconMap = {
      '电子产品': 'fa-mobile-alt icon-electronic',
      '家具': 'fa-couch icon-furniture',
      '交通工具': 'fa-car icon-vehicle',
      '娱乐': 'fa-gamepad icon-hobby',
      '服饰': 'fa-tshirt icon-clothing',
      '厨房': 'fa-utensils icon-kitchen',
      '工具': 'fa-tools icon-tool',
      '珠宝': 'fa-gem icon-jewelry',
      '书籍': 'fa-book icon-book',
      '摄影器材': 'fa-camera icon-electronic',
      '健身器材': 'fa-dumbbell icon-hobby',
      '办公用品': 'fa-briefcase icon-tool',
      '乐器': 'fa-music icon-hobby',
      '家用电器': 'fa-tv icon-furniture',
      '户外装备': 'fa-hiking icon-tool',
      '智能设备': 'fa-robot icon-electronic',
      '手表': 'fa-clock icon-jewelry',
      '箱包': 'fa-suitcase icon-clothing'
    };
    
    return iconMap[category] || 'fa-cube icon-other';
  }
}); 