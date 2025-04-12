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
    isCardExpanded: false,
    // 图标动画
    iconAnimating: false,
    // 是否正在预览图片
    isPreviewing: false
  },

  onLoad: function(options) {
    // 应用主题
    this.setData({
      theme: app.getTheme()
    });
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '资产详情'
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
  
  // 计算使用天数
  calculateUsageDays: function(asset) {
    if (!asset.purchaseDate) return 0;
    
    // 使用dateUtil的daysBetween方法，确保与全局日期计算逻辑一致
    const days = dateUtil.daysBetween(asset.purchaseDate, new Date());
    return days || 1; // 确保至少为1天，避免除以0的错误
  },
  
  // 计算每日成本
  calculateDailyCost: function(asset, usageDays) {
    if (!asset || !asset.price) return '0.00';
    
    // 获取基础价格
    let totalCost = Number(asset.price);
    
    // 添加额外费用
    if (asset.additionalCosts && Array.isArray(asset.additionalCosts)) {
      asset.additionalCosts.forEach(cost => {
        totalCost += Number(cost.amount) || 0;
      });
    } else if (asset.additionalCost) {
      // 兼容旧版额外费用字段
      totalCost += Number(asset.additionalCost) || 0;
    }
    
    // 确保使用天数至少为1
    const effectiveUsageDays = Math.max(1, usageDays);
    
    // 计算日均成本
    return (totalCost / effectiveUsageDays).toFixed(2);
  },
  
  // 计算每次使用成本
  calculateUsageCost: function(asset) {
    if (!asset || !asset.price) return '0.00';
    
    // 获取基础价格
    let totalCost = Number(asset.price);
    
    // 添加额外费用
    if (asset.additionalCosts && Array.isArray(asset.additionalCosts)) {
      asset.additionalCosts.forEach(cost => {
        totalCost += Number(cost.amount) || 0;
      });
    } else if (asset.additionalCost) {
      // 兼容旧版额外费用字段
      totalCost += Number(asset.additionalCost) || 0;
    }
    
    // 确保使用次数至少为1
    const effectiveUsageCount = Math.max(1, asset.usageCount || 1);
    
    // 计算次均成本
    return (totalCost / effectiveUsageCount).toFixed(2);
  },
  
  // 加载资产详情
  loadAssetDetail: function(id, skipIncrement = false) {
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
      
      // 更新资产使用次数（除非skipIncrement为true）
      if (!skipIncrement) {
        // 注释掉自动增加使用次数的代码
        // assetManager.updateUsageCount(id);
      }
      
      // 计算使用天数和日均成本
      const usageDays = this.calculateUsageDays(asset);
      const dailyCost = this.calculateDailyCost(asset, usageDays);
      const usageCost = this.calculateUsageCost(asset);
      
      // 格式化使用时间描述
      const usagePeriod = dateUtil.getUsagePeriod(asset.purchaseDate);
      
      // 计算保修状态
      const warranty = dateUtil.getWarrantyStatus(asset.warrantyDate);
      
      // 检查保修日期并设置过期状态
      let isExpired = false;
      if (asset.warrantyDate) {
        const warrantyDate = new Date(asset.warrantyDate.replace(/-/g, '/'));
        const today = new Date();
        isExpired = today > warrantyDate;
      }
      
      // 计算额外费用总计
      let totalAdditionalCost = 0;
      
      if (asset.additionalCosts && Array.isArray(asset.additionalCosts)) {
        asset.additionalCosts.forEach(cost => {
          totalAdditionalCost += Number(cost.amount) || 0;
        });
      } else if (asset.additionalCost) {
        // 兼容旧版额外费用字段
        totalAdditionalCost = Number(asset.additionalCost) || 0;
      }
      
      // 设置额外费用总计
      asset.totalAdditionalCost = totalAdditionalCost.toFixed(2);
      
      // 设置categoryLower属性
      const categoryLower = this.getCategoryLower(asset.category || asset.categoryText);
      
      // 更新数据
      this.setData({
        asset: {
          ...asset,
          usageDays,
          usagePeriod,
          dailyCost,
          usageCost,
          categoryLower,
          iconClass: asset.iconClass || 'fa-cube',
          formattedPurchaseDate: dateUtil.formatDate(asset.purchaseDate),
          formattedWarrantyDate: dateUtil.formatDate(asset.warrantyDate),
          isExpired
        },
        warranty,
        loading: false
      });
      
      console.log('加载资产详情:', this.data.asset);
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
    // 如果正在预览图片，则不刷新数据
    if (this.data.isPreviewing) return;
    
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
    
    // 检查保修日期并设置过期状态
    if (asset.warrantyDate) {
      const warrantyDate = new Date(asset.warrantyDate.replace(/-/g, '/'));
      result.isExpired = currentDate > warrantyDate;
    }
    
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
    
    // 计算额外费用总计
    let totalAdditionalCost = 0;
    
    if (asset.additionalCosts && Array.isArray(asset.additionalCosts)) {
      asset.additionalCosts.forEach(cost => {
        totalAdditionalCost += Number(cost.amount) || 0;
      });
    } else if (asset.additionalCost) {
      // 兼容旧版额外费用字段
      totalAdditionalCost = Number(asset.additionalCost) || 0;
    }
    
    // 设置额外费用总计
    result.totalAdditionalCost = totalAdditionalCost.toFixed(2);
    
    // 计算日均成本和次均成本
    result.dailyCost = this.calculateDailyCost(result, usageDays);
    result.usageCost = this.calculateUsageCost(result);
    
    // 设置categoryLower属性
    result.categoryLower = this.getCategoryLower(result.category || result.categoryText);
    
    // 设置默认图标
    if (!result.iconClass) {
      result.iconClass = 'fa-cube';
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
  },
  
  // 点击图标时的动画效果
  onIconTap: function() {
    this.setData({
      iconAnimating: true
    });
    
    setTimeout(() => {
      this.setData({
        iconAnimating: false
      });
    }, 500);
  },
  
  // 预览详情中的图片
  previewDetailImage: function(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    
    const urls = this.data.asset.imagePaths || [];
    
    // 设置正在预览标记
    this.setData({ isPreviewing: true });
    
    wx.previewImage({
      current: src,
      urls: urls,
      success: () => {
        // 预览成功
      },
      fail: () => {
        // 预览失败
        this.setData({ isPreviewing: false });
      },
      complete: () => {
        // 延迟重置预览标记，确保在onShow之后执行
        setTimeout(() => {
          this.setData({ isPreviewing: false });
        }, 500);
      }
    });
  },
  
  // 安全地将分类转换为小写
  getCategoryLower: function(category) {
    // 确保category是字符串且不为空
    if (typeof category === 'string' && category.trim() !== '') {
      // 中文分类映射到英文标识符
      const categoryMap = {
        '电子产品': 'electronic',
        '家具': 'furniture',
        '交通工具': 'vehicle',
        '娱乐': 'entertainment',
        '服饰': 'clothing',
        '厨房': 'kitchen',
        '工具': 'tool',
        '珠宝': 'jewelry',
        '书籍': 'book',
        '摄影器材': 'electronic',
        '健身器材': 'sport',
        '办公用品': 'office',
        '乐器': 'music',
        '家用电器': 'appliance',
        '户外装备': 'outdoor',
        '智能设备': 'smart',
        '手表': 'watch',
        '箱包': 'bag',
        '其他': 'other'
      };
      
      return categoryMap[category] || 'other';
    }
    return 'other'; // 默认返回'other'
  },

  // 增加使用次数
  increaseUsageCount: function() {
    const asset = this.data.asset;
    if (!asset || !asset.id) return;
    
    // 调用assetManager增加使用次数
    const success = assetManager.incrementUsageCount(asset.id);
    
    if (success) {
      // 直接更新本地数据，不重新加载整个页面
      const updatedAsset = {...this.data.asset};
      updatedAsset.usageCount = (updatedAsset.usageCount || 0) + 1;
      
      // 重新计算次均成本
      updatedAsset.usageCost = this.calculateUsageCost(updatedAsset);
      
      this.setData({
        asset: updatedAsset
      });
      
      wx.showToast({
        title: '使用次数+1',
        icon: 'success'
      });
    }
  }
}); 