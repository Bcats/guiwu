// add.js
const app = getApp();
const assetManager = require('../../utils/assetManager');
const dateUtil = require('../../utils/dateUtil');

Page({
  data: {
    // 页面类型：add - 添加，edit - 编辑
    pageType: 'add',
    // 资产对象
    asset: {
      id: '',
      name: '',
      price: '',
      category: '',
      purchaseDate: dateUtil.formatDate(new Date()),
      warrantyDate: '',
      description: '',
      status: '使用中', // 默认状态
      expectedDailyCost: '',
      targetDate: '',
      additionalCost: '',
    },
    // 编辑前的资产对象（用于取消编辑时恢复）
    originalAsset: {},
    // 分类选项
    categories: [
      '电子产品', '家具', '交通工具', '娱乐', '服饰', 
      '厨房', '工具', '珠宝', '书籍', '其他'
    ],
    // 状态选项
    statusOptions: ['使用中', '闲置中', '已损坏', '已出售', '已赠送'],
    // 是否显示分类选择器
    showCategoryPicker: false,
    // 是否显示状态选择器
    showStatusPicker: false,
    // 主题
    theme: 'light',
    // 是否需要刷新
    needRefresh: false,
    isEditing: false
  },

  onLoad: function(options) {
    // 设置主题
    this.setData({
      theme: app.getTheme()
    });
    
    // 判断是添加还是编辑
    if (options.id) {
      // 编辑模式
      this.setData({ pageType: 'edit' });
      
      // 获取资产数据
      const asset = assetManager.getAssetById(options.id);
      if (asset) {
        // 保存原始资产数据
        this.setData({
          asset: asset,
          originalAsset: { ...asset },
          isEditing: true
        });
      } else {
        wx.showToast({
          title: '资产不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.pageType === 'add' ? '添加资产' : '编辑资产'
    });
  },
  
  // 页面卸载时设置全局数据，通知首页需要刷新
  onUnload: function() {
    if (this.data.needRefresh) {
      // 在全局app对象上设置需要刷新的标志
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2]; // 获取上一个页面
      if (prevPage && prevPage.route === 'pages/index/index') {
        // 直接调用上一个页面的方法，通知其刷新数据
        prevPage.loadAssets();
      }
    }
  },
  
  // 输入框内容变化处理函数
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`asset.${field}`]: value
    });
  },
  
  // 显示分类选择器
  showCategoryPicker: function() {
    this.setData({
      showCategoryPicker: true
    });
  },
  
  // 隐藏分类选择器
  hideCategoryPicker: function() {
    this.setData({
      showCategoryPicker: false
    });
  },
  
  // 选择分类
  onCategorySelect: function(e) {
    const { category } = e.currentTarget.dataset;
    
    this.setData({
      'asset.category': category,
      showCategoryPicker: false
    });
  },
  
  // 显示状态选择器
  showStatusPicker: function() {
    this.setData({
      showStatusPicker: true
    });
  },
  
  // 隐藏状态选择器
  hideStatusPicker: function() {
    this.setData({
      showStatusPicker: false
    });
  },
  
  // 选择状态
  onStatusSelect: function(e) {
    const { status } = e.currentTarget.dataset;
    
    this.setData({
      'asset.status': status,
      showStatusPicker: false
    });
  },
  
  // 选择购买日期
  onPurchaseDateChange: function(e) {
    this.setData({
      'asset.purchaseDate': e.detail.value
    });
  },
  
  // 选择保修到期日期
  onWarrantyDateChange: function(e) {
    this.setData({
      'asset.warrantyDate': e.detail.value
    });
  },
  
  // 处理目标日期变更
  onTargetDateChange(e) {
    this.setData({
      'asset.targetDate': e.detail.value
    });
  },
  
  // 保存资产
  saveAsset: function() {
    const { asset, pageType, isEditing } = this.data;
    
    // 校验必填字段
    if (!asset.name.trim()) {
      wx.showToast({
        title: '请输入资产名称',
        icon: 'none'
      });
      return;
    }
    
    if (!asset.price || isNaN(parseFloat(asset.price))) {
      wx.showToast({
        title: '请输入有效的价格',
        icon: 'none'
      });
      return;
    }
    
    if (!asset.purchaseDate) {
      wx.showToast({
        title: '请选择购买日期',
        icon: 'none'
      });
      return;
    }
    
    // 将价格转为数字
    asset.price = Number(asset.price);
    
    // 计算总价（包含附加费用）
    const price = parseFloat(asset.price);
    const additionalCost = asset.additionalCost ? parseFloat(asset.additionalCost) : 0;
    const totalCost = price + additionalCost;
    
    // 获取当前资产列表
    let assets = wx.getStorageSync('assets') || [];
    
    // 创建/更新资产对象
    const assetToSave = {
      ...asset,
      price: price.toFixed(2),
      additionalCost: additionalCost.toFixed(2),
      totalCost: totalCost.toFixed(2)
    };
    
    if (isEditing && asset.id) {
      // 编辑现有资产
      const index = assets.findIndex(a => a.id === asset.id);
      if (index !== -1) {
        assets[index] = assetToSave;
      }
    } else {
      // 创建新资产
      assetToSave.id = Date.now().toString();
      assetToSave.createdAt = new Date().toISOString();
      assets.push(assetToSave);
    }
    
    // 保存到本地存储
    wx.setStorageSync('assets', assets);
    
    // 设置需要刷新的标记
    this.setData({
      needRefresh: true
    });
    
    wx.showToast({
      title: pageType === 'add' ? '添加成功' : '更新成功',
    });
    
    // 返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },
  
  // 取消编辑
  cancelEdit: function() {
    wx.navigateBack();
  },

  // 选择图片
  chooseImage: function() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        const asset = that.data.asset;
        asset.imagePath = tempFilePath;
        that.setData({
          asset: asset
        });
      }
    });
  }
}); 