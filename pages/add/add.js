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
    isEditing: false,
    // 资产信息
    id: null, // 编辑模式下的资产ID
    name: '', // 资产名称
    price: '', // 购买价格
    categoryId: '', // 分类ID
    categoryText: '', // 分类文本
    purchaseDate: '', // 购买日期
    warrantyDate: '', // 保修日期
    description: '', // 备注描述
    tempImagePaths: [], // 临时图片路径数组
    selectedIcon: '', // 选中的图标
    // 选择器状态
    showIconPicker: false,
    // 分类列表
    categoryList: [
      { id: 1, name: '电子数码' },
      { id: 2, name: '家居家电' },
      { id: 3, name: '服装配饰' },
      { id: 4, name: '珠宝首饰' },
      { id: 5, name: '书籍文具' },
      { id: 6, name: '运动户外' },
      { id: 7, name: '交通工具' },
      { id: 8, name: '收藏品' },
      { id: 9, name: '其他' }
    ],
    // 编辑模式
    isEditMode: false
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
          isEditing: true,
          id: options.id,
          isEditMode: true
        });
        this.loadAssetData(options.id);
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

    // 设置默认日期为今天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // 设置默认分类为"其他"
    const otherCategory = this.data.categoryList.find(c => c.name === '其他');
    
    this.setData({
      purchaseDate: formattedDate,
      categoryId: otherCategory.id,
      categoryText: otherCategory.name
    });
  },
  
  // 加载资产数据（编辑模式）
  loadAssetData: function(id) {
    // 这里应该从数据库获取资产数据
    // 为简化示例，这里假设从全局数据获取
    const assetList = wx.getStorageSync('assetList') || [];
    const asset = assetList.find(item => item.id === id);
    
    if (asset) {
      const category = this.data.categoryList.find(c => c.id === asset.categoryId);
      
      this.setData({
        name: asset.name,
        price: asset.price,
        categoryId: asset.categoryId || '',
        categoryText: category ? category.name : '',
        purchaseDate: asset.purchaseDate,
        warrantyDate: asset.warrantyDate || '',
        description: asset.description || '',
        selectedIcon: asset.icon || '',
        tempImagePaths: asset.imagePaths || []
      });
    }
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
  selectCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    
    this.setData({
      categoryId: category.id,
      categoryText: category.name,
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
  
  // 选择图片
  chooseImage: function() {
    const currentCount = this.data.tempImagePaths ? this.data.tempImagePaths.length : 0;
    const remaining = 9 - currentCount;
    
    if (remaining <= 0) {
      wx.showToast({
        title: '最多只能上传9张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 合并已有图片和新选择的图片
        const newImagePaths = res.tempFilePaths;
        const allImagePaths = this.data.tempImagePaths ? [...this.data.tempImagePaths, ...newImagePaths] : [...newImagePaths];
        
        this.setData({
          tempImagePaths: allImagePaths
        });
      }
    });
  },
  
  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const tempImagePaths = this.data.tempImagePaths;
    
    // 从数组中移除指定索引的图片
    tempImagePaths.splice(index, 1);
    
    this.setData({
      tempImagePaths: tempImagePaths
    });
  },
  
  // 绑定输入框变化
  bindKeyInput: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [field]: value
    });
  },
  
  // 绑定日期选择器变化
  bindDateChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [field]: value
    });
  },
  
  // 显示图标选择器
  showIconPicker: function() {
    this.setData({
      showIconPicker: true
    });
  },
  
  // 隐藏图标选择器
  hideIconPicker: function() {
    this.setData({
      showIconPicker: false
    });
  },
  
  // 选择图标
  selectIcon: function(e) {
    const icon = e.currentTarget.dataset.icon;
    
    this.setData({
      selectedIcon: icon,
      showIconPicker: false
    });
  },
  
  // 验证表单
  validateForm: function() {
    // 验证必填字段
    if (!this.data.name) {
      wx.showToast({
        title: '请输入资产名称',
        icon: 'none'
      });
      return false;
    }
    
    if (!this.data.price) {
      wx.showToast({
        title: '请输入购买价格',
        icon: 'none'
      });
      return false;
    }
    
    if (!this.data.purchaseDate) {
      wx.showToast({
        title: '请选择购买日期',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },
  
  // 保存资产
  saveAsset: function() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }
    
    // 准备保存的资产数据
    const assetData = {
      id: this.data.id || Date.now().toString(), // 新建模式生成ID
      name: this.data.name,
      price: parseFloat(this.data.price),
      categoryId: this.data.categoryId,
      category: this.data.categoryText,
      purchaseDate: this.data.purchaseDate,
      warrantyDate: this.data.warrantyDate || '',
      description: this.data.description || '',
      imagePaths: this.data.tempImagePaths || [],
      icon: this.data.selectedIcon || 'fa-tag', // 默认图标
      createTime: new Date().getTime()
    };
    
    // 获取现有资产列表
    let assetList = wx.getStorageSync('assetList') || [];
    
    // 编辑模式：更新现有资产
    if (this.data.isEditMode) {
      assetList = assetList.map(item => {
        if (item.id === assetData.id) {
          return assetData;
        }
        return item;
      });
    } 
    // 新建模式：添加新资产
    else {
      assetList.unshift(assetData);
    }
    
    // 保存到本地存储
    wx.setStorageSync('assetList', assetList);
    
    // 显示成功提示
    wx.showToast({
      title: this.data.isEditMode ? '资产已更新' : '资产已添加',
      icon: 'success',
      duration: 2000,
      success: () => {
        // 返回上一页
        setTimeout(() => {
          // 设置上一页需要刷新的标志
          const pages = getCurrentPages();
          if (pages.length > 1) {
            const prevPage = pages[pages.length - 2];
            prevPage.setData({
              needRefresh: true
            });
          }
          
          wx.navigateBack();
        }, 2000);
      }
    });
  },
  
  // 取消添加/编辑
  cancelAdd: function() {
    wx.navigateBack();
  }
}); 