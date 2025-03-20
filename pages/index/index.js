const app = getApp();
const assetManager = require('../../utils/assetManager');
const dateUtil = require('../../utils/dateUtil');
const statisticsUtil = require('../../utils/statisticsUtil');

Page({
  data: {
    app: getApp(),
    // 资产列表
    assets: [],
    // 资产总数
    totalAssets: 0,
    // 资产总价值
    totalValue: 0,
    // 日均成本
    dailyAverage: 0,
    // 分类列表
    categories: [],
    // 当前选中的分类
    selectedCategory: '',
    // 搜索关键词
    searchKeyword: '',
    // 是否正在加载
    loading: true,
    // 是否显示"我的资产"卡片
    showOverview: true,
    // 是否添加新资产后刷新
    refreshOnAdd: false,
    // 是否显示分类下拉菜单
    showCategoryDropdown: false,
    // 是否显示滑动选项
    showSlideOptions: false,
    // 当前滑动显示选项的资产ID
    currentSlideAssetId: null,
    
    // 资产分类样式
    categoryStyles: {
      '电子产品': { bgColor: '#E9F6FF', borderColor: '#2C7EF8', icon: 'mobile-alt' },
      '家具': { bgColor: '#E6F7FF', borderColor: '#36CFC9', icon: 'couch' },
      '交通工具': { bgColor: '#F4FFED', borderColor: '#52C41A', icon: 'bicycle' },
      '娱乐': { bgColor: '#FFF1E6', borderColor: '#FF9500', icon: 'gamepad' },
      '服饰': { bgColor: '#F9F0FF', borderColor: '#722ED1', icon: 'tshirt' },
      '厨房': { bgColor: '#FCF4E6', borderColor: '#FA8C16', icon: 'utensils' },
      '工具': { bgColor: '#FCFCFC', borderColor: '#333333', icon: 'tools' },
      '珠宝': { bgColor: '#FFF0F6', borderColor: '#EB2F96', icon: 'gem' },
      '书籍': { bgColor: '#F0F5FF', borderColor: '#2F54EB', icon: 'book' },
      '摄影器材': { bgColor: '#FFE8E8', borderColor: '#FF4D4F', icon: 'camera' },
      '未分类': { bgColor: '#F5F5F5', borderColor: '#999999', icon: 'cube' }
    }
  },

  onLoad: function () {
    console.log('页面加载 - onLoad');
    // 获取应用实例
    const app = getApp();
    this.setData({
      app: app,
      theme: app.globalData && app.globalData.theme ? app.globalData.theme : 'light'
    });
    
    // 初始化触控变量
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    // 默认设置
    this.setData({
      showCategoryDropdown: false,
      currentSlideAssetId: null,
      showOverview: true,
      searchKeyword: '',
      assets: [],
      filteredAssets: []
    });
    
    // 立即加载资产数据
    this.loadAssets();
  },
  
  onShow: function() {
    console.log('页面显示 - onShow');
    
    // 如果标记为需要刷新，则重新加载资产
    if (this.data.refreshOnAdd) {
      this.loadAssets();
      this.setData({ refreshOnAdd: false });
    }
    
    // 设置tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
    
    // 确保所有卡片初始状态都是收起的
    this.resetAssetCardStates();
  },
  
  // 重置资产卡片的状态
  resetAssetCardStates: function() {
    if (Array.isArray(this.data.assets)) {
      const assets = this.data.assets.map(asset => ({
        ...asset,
        expanded: false
      }));
      
      const filteredAssets = Array.isArray(this.data.filteredAssets) 
        ? this.data.filteredAssets.map(asset => ({
            ...asset,
            expanded: false
          }))
        : [];
      
      this.setData({
        assets,
        filteredAssets,
        currentSlideAssetId: null // 重置左滑状态
      });
    }
  },

  // 加载资产列表
  loadAssets: function () {
    console.log('开始加载资产数据');
    this.setData({ loading: true });
    
    try {
      // 获取所有资产
      const assets = assetManager.getAllAssets() || [];
      console.log('获取到资产数量:', assets.length);
      
      // 获取概览数据
      const overview = statisticsUtil.getOverview() || { totalCount: 0, totalValue: 0, dailyAverage: 0 };
      
      // 获取并处理所有分类
      const categories = assetManager.getCategories() || [];
      
      // 如果没有资产，直接设置空数据
      if (!assets || assets.length === 0) {
        console.log('没有资产数据');
        this.setData({
          assets: [],
          filteredAssets: [],
          categories: ['全部'],
          selectedCategory: '全部',
          totalAssets: 0,
          totalValue: 0,
          dailyAverage: 0,
          loading: false
        });
        return;
      }
      
      // 对资产列表进行处理，添加额外的展示字段
      const formattedAssets = assets.map(asset => {
        // 计算使用天数
        const usageDays = this.calculateUsageDays(asset);
        
        // 计算使用成本
        const dailyCost = this.calculateDailyCost(asset, usageDays);
        
        // 格式化日期
        const formattedPurchaseDate = asset.purchaseDate 
          ? dateUtil.formatDateString(asset.purchaseDate) 
          : '未知';
        
        // 计算使用率
        const usageRate = this.calculateUsageRate(asset);
        
        return {
          ...asset,
          usageDays: usageDays,
          dailyCost: dailyCost,
          formattedPurchaseDate: formattedPurchaseDate,
          usageRate: usageRate,
          expanded: false // 默认不展开
        };
      });
      
      // 所有分类加上"全部"选项
      const allCategories = ['全部', ...categories];
      
      this.setData({
        assets: formattedAssets,
        filteredAssets: formattedAssets,
        categories: allCategories,
        selectedCategory: '全部',
        totalAssets: formattedAssets.length,
        totalValue: overview.totalValue.toFixed(2),
        dailyAverage: overview.dailyAverage.toFixed(2),
        loading: false
      });
      
      // 搜索关键词或分类如果存在，则需要应用筛选
      if (this.data.searchKeyword || (this.data.selectedCategory && this.data.selectedCategory !== '全部')) {
        this.filterAssets();
      }
    } catch (e) {
      console.error('加载资产数据失败:', e);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },
  
  // 计算使用天数
  calculateUsageDays: function(asset) {
    if (!asset.purchaseDate) return 0;
    
    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();
    const diffTime = Math.abs(today - purchaseDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  },
  
  // 计算每日成本
  calculateDailyCost: function(asset, usageDays) {
    if (!asset.price || !usageDays) return 0;
    
    const price = parseFloat(asset.price);
    return (price / usageDays).toFixed(2);
  },
  
  // 计算使用率
  calculateUsageRate: function(asset) {
    if (!asset.purchaseDate || !asset.targetDate) return 0;
    
    try {
      const purchaseDate = new Date(asset.purchaseDate.replace(/-/g, '/'));
      const targetDate = new Date(asset.targetDate.replace(/-/g, '/'));
      const today = new Date();
      
      // 验证日期有效性
      if (isNaN(purchaseDate.getTime()) || isNaN(targetDate.getTime())) {
        console.warn('无效的日期格式:', asset.purchaseDate, asset.targetDate);
        return 0;
      }
      
      // 计算总天数，确保不为零
      const totalDays = Math.max(1, Math.abs(targetDate - purchaseDate) / (1000 * 60 * 60 * 24));
      const usedDays = Math.max(0, Math.abs(today - purchaseDate) / (1000 * 60 * 60 * 24));
      
      // 确保结果在 0-100 范围内
      return Math.min(Math.floor((usedDays / totalDays) * 100), 100);
    } catch (e) {
      console.error('计算使用率失败:', e, asset);
      return 0;
    }
  },
  
  // 搜索资产
  onSearch: function(e) {
    const keyword = e.detail.value || '';
    this.setData({
      searchKeyword: keyword
    }, () => {
      this.filterAssets();
    });
  },
  
  // 清除搜索关键词
  clearSearch: function() {
    this.setData({
      searchKeyword: ''
    }, () => {
      this.filterAssets();
    });
  },
  
  // 切换分类
  selectCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category,
      showCategoryDropdown: false
    }, () => {
      this.filterAssets();
    });
  },
  
  // 显示/隐藏分类下拉菜单
  toggleCategoryDropdown: function() {
    this.setData({
      showCategoryDropdown: !this.data.showCategoryDropdown
    });
  },
  
  // 筛选资产列表
  filterAssets: function() {
    console.log('开始筛选资产');
    
    if (!this.data.assets || this.data.assets.length === 0) {
      console.log('没有资产数据，筛选结束');
      this.setData({
        filteredAssets: [],
        totalAssets: 0,
        totalValue: 0,
        dailyAverage: 0
      });
      return;
    }
    
    let filtered = [...this.data.assets];
    
    // 关键词筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(asset => {
        return (
          (asset.name && asset.name.toLowerCase().includes(keyword)) || 
          (asset.category && asset.category.toLowerCase().includes(keyword)) ||
          (asset.description && asset.description.toLowerCase().includes(keyword))
        );
      });
    }
    
    // 分类筛选
    if (this.data.selectedCategory && this.data.selectedCategory !== '全部') {
      filtered = filtered.filter(asset => asset.category === this.data.selectedCategory);
    }
    
    // 计算筛选后的统计数据
    let filteredTotalValue = 0;
    let filteredDailyAverage = 0;
    
    filtered.forEach(asset => {
      filteredTotalValue += Number(asset.price) || 0;
      
      const assetDailyCost = Number(asset.dailyCost) || 0;
      filteredDailyAverage += assetDailyCost;
    });
    
    // 保留两位小数
    filteredDailyAverage = Number(filteredDailyAverage.toFixed(2));
    
    this.setData({
      filteredAssets: filtered,
      totalAssets: filtered.length,
      totalValue: filteredTotalValue.toFixed(2),
      dailyAverage: filteredDailyAverage
    });
  },
  
  // 处理资产卡片的触摸事件
  onAssetTouchStart: function(e) {
    this.touchStartX = e.touches[0].pageX;
    this.touchStartY = e.touches[0].pageY;
    this.touchStartTime = Date.now();
    this.isTouchMove = false;
  },
  
  onAssetTouchMove: function(e) {
    const moveX = e.touches[0].pageX;
    const moveY = e.touches[0].pageY;
    
    // 计算X和Y方向的移动距离
    const deltaX = moveX - this.touchStartX;
    const deltaY = moveY - this.touchStartY;
    
    // 如果Y方向移动大于X方向，认为是上下滚动，不处理左右滑动
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }
    
    this.isTouchMove = true;
    
    // 获取当前触摸的资产ID
    const assetId = e.currentTarget.dataset.id;
    
    // 向左滑动显示操作按钮，向右滑动隐藏
    if (deltaX < -50) {
      this.setData({
        currentSlideAssetId: assetId
      });
    } else if (deltaX > 20) {
      this.setData({
        currentSlideAssetId: null
      });
    }
  },
  
  onAssetTouchEnd: function(e) {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;
    
    // 如果触摸时间很短且没有明显移动，可能是点击
    if (touchDuration < 150 && !this.isTouchMove) {
      this.goToDetail(e);
    }
  },
  
  // 编辑资产
  editAsset: function(e) {
    const assetId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/add/add?id=' + assetId
    });
    
    // 关闭滑动选项
    this.closeSlideOptions();
  },
  
  // 删除资产
  deleteAsset: function(e) {
    const assetId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个资产吗？',
      success: (res) => {
        if (res.confirm) {
          const result = assetManager.deleteAsset(assetId);
          if (result) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadAssets();
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
    
    // 关闭滑动选项
    this.closeSlideOptions();
  },
  
  // 置顶资产
  topAsset: function(e) {
    const assetId = e.currentTarget.dataset.id;
    
    // 获取所有资产
    const allAssets = assetManager.getAllAssets();
    const assetIndex = allAssets.findIndex(asset => asset.id === assetId);
    
    if (assetIndex > -1) {
      // 取出要置顶的资产
      const asset = allAssets[assetIndex];
      
      // 从数组中移除
      allAssets.splice(assetIndex, 1);
      
      // 添加到数组开头
      allAssets.unshift(asset);
      
      // 保存更新后的资产列表
      wx.setStorageSync('assets', allAssets);
      
      // 重新加载资产列表
      this.loadAssets();
      
      wx.showToast({
        title: '置顶成功',
        icon: 'success'
      });
    }
    
    // 关闭滑动选项
    this.closeSlideOptions();
  },
  
  // 关闭滑动选项
  closeSlideOptions: function() {
    this.setData({
      currentSlideAssetId: null
    });
  },
  
  // 前往资产详情页
  goToDetail: function(e) {
    const assetId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + assetId
    });
  },
  
  // 前往添加资产页
  goToAdd: function() {
    wx.navigateTo({
      url: '/pages/add/add',
      success: () => {
        this.setData({
          refreshOnAdd: true
        });
      }
    });
  },
  
  // 展开/收起资产卡片
  toggleAssetExpand: function(e) {
    const assetId = e.currentTarget.dataset.id;
    const assets = this.data.assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          expanded: !asset.expanded
        };
      }
      return asset;
    });
    
    const filteredAssets = this.data.filteredAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          expanded: !asset.expanded
        };
      }
      return asset;
    });
    
    this.setData({
      assets,
      filteredAssets
    });
  },
  
  // 主题变更回调
  onThemeChanged: function(theme) {
    this.setData({
      theme: theme
    });
  },
  
  // 根据分类和名称获取图标
  getItemIcon: function(category, name) {
    if (!category && !name) return 'default';
    
    // 电子产品
    if (name && name.toLowerCase().includes('iphone') || name && name.toLowerCase().includes('手机')) {
      return 'smartphone';
    } else if (name && name.toLowerCase().includes('macbook') || name && name.toLowerCase().includes('笔记本')) {
      return 'laptop';
    } else if (name && name.toLowerCase().includes('ipad') || name && name.toLowerCase().includes('平板')) {
      return 'tablet';
    }
    
    // 根据分类返回默认图标
    const categoryMap = {
      '电子产品': 'device',
      '家具': 'furniture',
      '交通工具': 'transport',
      '娱乐': 'entertainment',
      '服饰': 'clothing',
      '厨房': 'kitchen',
      '工具': 'tools',
      '珠宝': 'jewelry',
      '书籍': 'book',
      '摄影器材': 'camera'
    };
    
    return categoryMap[category] || 'default';
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    console.log('下拉刷新触发');
    wx.showLoading({
      title: '刷新中...',
    });
    
    this.loadAssets();
    
    setTimeout(() => {
      wx.hideLoading();
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    }, 800);
  }
}); 