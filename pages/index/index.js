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
    
    // 立即加载资产数据
    setTimeout(() => {
      this.loadAssets();
    }, 100);
    
    // 初始化触控变量
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    // 默认不显示分类下拉菜单
    this.setData({
      showCategoryDropdown: false,
      currentSlideAssetId: null, // 当前左滑的资产ID
      showOverview: true, // 默认显示我的资产卡片
      searchKeyword: '', // 搜索关键词
      // 确保所有卡片初始状态都是收起的
      assets: [],
      filteredAssets: []
    });
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
    
    // 确保所有卡片初始状态都是收起的，添加空值检查
    const assets = Array.isArray(this.data.assets) ? this.data.assets.map(asset => ({
      ...asset,
      expanded: false
    })) : [];
    
    const filteredAssets = Array.isArray(this.data.filteredAssets) ? this.data.filteredAssets.map(asset => ({
      ...asset,
      expanded: false
    })) : [];
    
    this.setData({
      assets,
      filteredAssets,
      currentSlideAssetId: null // 重置左滑状态
    });
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
        try {
          // 计算使用天数
          const usageDays = dateUtil.daysBetween(asset.purchaseDate);
          // 格式化使用时间描述
          const usageDuration = dateUtil.getUsageDuration(asset.purchaseDate);
          // 计算日均成本
          const effectiveUsageDays = Math.max(1, usageDays);
          const dailyCost = ((Number(asset.price) || 0) / effectiveUsageDays).toFixed(2);
          
          // 获取分类样式，如果没有匹配的分类则使用未分类样式
          const categoryStyle = this.data.categoryStyles[asset.category] || this.data.categoryStyles['未分类'];
          
          // 添加退役状态
          const isRetired = asset.status === '已退役';
          
          // 计算计划使用日期是否超期
          let isOverTime = false;
          if (asset.targetDate) {
            const targetDate = new Date(asset.targetDate);
            isOverTime = new Date() > targetDate && !isRetired;
          }
          
          return {
            ...asset,
            usageDays,
            usageDuration,
            dailyCost,
            categoryStyle,
            // 为不同分类添加样式类
            categoryClass: this.getCategoryClass(asset.category),
            // 添加展开状态
            expanded: false,
            // 添加滑动状态
            slideOpen: false,
            isRetired,
            isOverTime
          };
        } catch (err) {
          console.error('处理资产出错:', err, asset);
          return {
            ...asset,
            usageDays: 0,
            usageDuration: '无法计算',
            dailyCost: '0.00',
            categoryClass: 'default',
            expanded: false,
            slideOpen: false,
            isRetired: false,
            isOverTime: false
          };
        }
      });
      
      console.log('格式化后资产数量:', formattedAssets.length);
      
      this.setData({
        assets: formattedAssets,
        filteredAssets: formattedAssets,
        categories: ['全部', ...categories],
        selectedCategory: '全部',
        totalAssets: overview.totalCount,
        totalValue: overview.totalValue,
        dailyAverage: overview.dailyAverage,
        loading: false
      }, () => {
        console.log('资产数据加载完成');
        // 应用搜索和分类筛选
        this.filterAssets();
      });
    } catch (error) {
      console.error('加载资产数据出错:', error);
      // 出错时显示空数据
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
    }
  },
  
  // 根据分类返回对应的样式类
  getCategoryClass: function(category) {
    const categoryMap = {
      '电子产品': 'electronic',
      '家具家电': 'furniture',
      '交通工具': 'transport',
      '娱乐设备': 'entertainment',
      '摄影器材': 'photography',
      '厨房用品': 'kitchen',
      '服饰鞋包': 'clothing'
    };
    
    return categoryMap[category] || 'default';
  },
  
  // 根据分类返回对应的图标类名
  getCategoryIcon: function(category) {
    const iconMap = {
      '电子产品': 'fa-mobile-alt',
      '家具': 'fa-couch',
      '交通工具': 'fa-car',
      '娱乐': 'fa-gamepad',
      '服饰': 'fa-tshirt',
      '厨房': 'fa-utensils',
      '工具': 'fa-tools',
      '珠宝': 'fa-gem',
      '书籍': 'fa-book',
      '摄影器材': 'fa-camera',
      '健身器材': 'fa-dumbbell',
      '办公用品': 'fa-briefcase',
      '乐器': 'fa-music',
      '家用电器': 'fa-tv',
      '户外装备': 'fa-hiking',
      '智能设备': 'fa-robot',
      '手表': 'fa-clock',
      '箱包': 'fa-suitcase'
    };
    
    return iconMap[category] || 'fa-cube';
  },
  
  // 根据分类和物品名称返回对应的图标名称
  getItemIcon: function(category, name) {
    // 检查名称中是否包含特定关键词，以确定具体图标
    const nameLower = (name || '').toLowerCase();
    
    // 电子产品
    if (nameLower.includes('iphone') || nameLower.includes('手机')) {
      return 'smartphone';
    } else if (nameLower.includes('macbook') || nameLower.includes('笔记本') || nameLower.includes('laptop')) {
      return 'laptop';
    } else if (nameLower.includes('ipad') || nameLower.includes('平板')) {
      return 'tablet';
    } else if (nameLower.includes('耳机') || nameLower.includes('airpods')) {
      return 'headphones';
    }
    
    // 摄影器材
    if (nameLower.includes('相机') || nameLower.includes('camera') || nameLower.includes('sony') || nameLower.includes('canon') || nameLower.includes('nikon')) {
      return 'camera';
    } else if (nameLower.includes('镜头') || nameLower.includes('lens')) {
      return 'camera-lens';
    }
    
    // 游戏设备
    if (nameLower.includes('ps5') || nameLower.includes('playstation')) {
      return 'game-console';
    } else if (nameLower.includes('xbox') || nameLower.includes('switch')) {
      return 'game-controller';
    }
    
    // 交通工具
    if (nameLower.includes('自行车') || nameLower.includes('bike') || nameLower.includes('bicycle')) {
      return 'bicycle';
    } else if (nameLower.includes('电动车') || nameLower.includes('平衡车')) {
      return 'scooter';
    } else if (nameLower.includes('汽车') || nameLower.includes('car')) {
      return 'car';
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
      '摄影器材': 'camera',
      '健身器材': 'fitness',
      '办公用品': 'office',
      '乐器': 'music',
      '家用电器': 'appliance',
      '户外装备': 'outdoor',
      '智能设备': 'smart-device'
    };
    
    return categoryMap[category] || 'default';
  },
  
  // 处理搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.filterAssets();
  },
  
  // 处理分类切换
  onCategoryTap: function(e) {
    const category = e.currentTarget.dataset.category;
    console.log('切换分类:', category);
    this.setData({
      selectedCategory: category,
      showCategoryDropdown: false
    }, () => {
      // 确保在状态更新后执行筛选
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
    console.log('当前分类:', this.data.selectedCategory);
    console.log('当前搜索关键词:', this.data.searchKeyword);
    console.log('原始资产数量:', this.data.assets ? this.data.assets.length : 0);
    
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
    
    // 先按关键词筛选
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
    
    // 再按分类筛选
    if (this.data.selectedCategory && this.data.selectedCategory !== '全部') {
      filtered = filtered.filter(asset => asset.category === this.data.selectedCategory);
    }
    
    console.log('筛选后资产数量:', filtered.length);
    
    // 重新计算筛选后资产的总价值和日均成本
    let filteredTotalValue = 0;
    let filteredDailyAverage = 0;
    
    filtered.forEach(asset => {
      // 累加总价值
      filteredTotalValue += Number(asset.price) || 0;
      
      // 累加日均成本
      const usageDays = asset.usageDays || 1;
      const effectiveUsageDays = Math.max(1, usageDays);
      const assetDailyCost = (Number(asset.price) || 0) / effectiveUsageDays;
      filteredDailyAverage += assetDailyCost;
    });
    
    // 保留两位小数
    filteredDailyAverage = Number(filteredDailyAverage.toFixed(2));
    
    this.setData({
      filteredAssets: filtered,
      totalAssets: filtered.length,
      totalValue: filteredTotalValue.toFixed(2),
      dailyAverage: filteredDailyAverage
    }, () => {
      console.log('筛选完成，更新后的filteredAssets长度:', this.data.filteredAssets.length);
    });
  },
  
  // 资产卡片触摸开始
  onAssetTouchStart: function(e) {
    console.log('触摸开始');
    this.touchStartX = e.touches[0].pageX;
    this.touchStartY = e.touches[0].pageY;
    this.touchStartTime = Date.now();
    this.isTouchMove = false; // 重置移动状态
  },
  
  // 资产卡片触摸移动
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
    
    // 标记为移动状态
    this.isTouchMove = true;
    
    // 获取当前触摸的资产ID
    const assetId = e.currentTarget.dataset.id;
    
    // 如果是向左滑动超过50px，显示操作按钮
    if (deltaX < -50) {
      this.setData({
        currentSlideAssetId: assetId
      });
    } else if (deltaX > 20) {
      // 如果是向右滑动超过20px，隐藏操作按钮
      this.setData({
        currentSlideAssetId: null
      });
    }
  },
  
  // 资产卡片触摸结束
  onAssetTouchEnd: function(e) {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;
    
    // 如果触摸时间很短且没有明显移动，可能是点击
    if (touchDuration < 150 && !this.isTouchMove) {
      console.log('触摸结束 - 可能是点击', e);
      // 不做任何处理，让点击事件处理
      this.goToDetail(e);
      return;
    }
    
    console.log('触摸结束 - 滑动操作');
    // 滑动操作已在touchmove中处理
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
    const asset = this.data.assets.find(asset => asset.id === assetId);
    
    wx.showModal({
      title: '删除资产',
      content: `确定要删除"${asset.name}"吗？此操作不可恢复。`,
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          const success = assetManager.deleteAsset(assetId);
          
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 2000
            });
            
            // 重新加载资产列表
            this.loadAssets();
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'none',
              duration: 2000
            });
          }
        }
        
        // 关闭滑动选项
        this.closeSlideOptions();
      }
    });
  },
  
  // 置顶资产
  topAsset: function(e) {
    const assetId = e.currentTarget.dataset.id;
    
    // 找到要置顶的资产
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
      
      // 为置顶资产添加动画效果
      let animation = wx.createAnimation({
        duration: 500,
        timingFunction: 'ease',
      });
      
      // 应用动画效果并重新加载资产列表
      this.setData({
        topAnimation: animation.opacity(0).translateY(-100).step().export()
      });
      
      setTimeout(() => {
        // 重新加载资产列表
        this.loadAssets();
      }, 200);
    }
    
    // 关闭滑动选项
    this.closeSlideOptions();
  },
  
  // 点击资产卡片 - 实现展开/收缩功能
  goToDetail: function(e) {
    console.log('----------------');
    console.log('goToDetail触发', new Date().toLocaleTimeString());
    
    try {
      const assetId = e.currentTarget.dataset.id;
      console.log('点击资产ID:', assetId);
      
      // 如果有滑动显示的选项，先关闭它并返回
      if (this.data.currentSlideAssetId) {
        console.log('有滑动选项打开，关闭它:', this.data.currentSlideAssetId);
        this.closeSlideOptions();
        return;
      }

      // 获取当前资产列表
      const filteredAssets = [...this.data.filteredAssets];
      const assetIndex = filteredAssets.findIndex(a => a.id === assetId);
      
      if (assetIndex === -1) {
        console.error('找不到资产:', assetId);
        return;
      }
      
      // 获取当前展开状态并切换
      const currentExpanded = filteredAssets[assetIndex].expanded;
      console.log('当前展开状态:', currentExpanded, '将切换为:', !currentExpanded);
      
      // 更新展开状态 - 注意：直接修改数组中的对象
      for (let i = 0; i < filteredAssets.length; i++) {
        if (filteredAssets[i].id === assetId) {
          filteredAssets[i].expanded = !currentExpanded;
        } else {
          filteredAssets[i].expanded = false;
        }
      }
      
      // 更新所有资产列表数据
      const allAssets = [...this.data.assets];
      for (let i = 0; i < allAssets.length; i++) {
        if (allAssets[i].id === assetId) {
          allAssets[i].expanded = !currentExpanded;
        } else {
          allAssets[i].expanded = false;
        }
      }
      
      // 更新数据
      console.log('更新数据...');
      this.setData({
        filteredAssets: filteredAssets,
        assets: allAssets
      }, () => {
        console.log('数据更新完成');
      });
      
      console.log('资产展开状态已更新');
    } catch (error) {
      console.error('展开资产卡片错误:', error);
    }
    
    console.log('----------------');
  },
  
  // 切换"我的资产"卡片显示状态
  toggleOverview: function() {
    this.setData({
      showOverview: !this.data.showOverview
    });
  },
  
  // 跳转到资产详情页
  navigateToDetail: function(e) {
    const assetId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${assetId}`
    });
  },
  
  // 切换资产卡片展开状态
  toggleAssetExpand: function(e) {
    try {
      e.stopPropagation && e.stopPropagation(); // 安全地调用stopPropagation
      
      const assetId = e.currentTarget.dataset.id;
      
      // 如果有滑动显示的选项，先关闭它
      if (this.data.currentSlideAssetId) {
        this.closeSlideOptions();
        return; // 如果正在滑动，不触发展开收缩
      }

      // 更新资产列表中的展开状态
      const filteredAssets = this.data.filteredAssets.map(item => {
        if (item.id === assetId) {
          return { ...item, expanded: !item.expanded };
        } else {
          // 关闭其他所有展开的卡片
          return { ...item, expanded: false };
        }
      });
      
      // 同时更新原始资产列表中的展开状态
      const assets = this.data.assets.map(item => {
        if (item.id === assetId) {
          return { ...item, expanded: !item.expanded };
        } else {
          return { ...item, expanded: false };
        }
      });
      
      // 一次性更新数据，避免多次渲染
      this.setData({ 
        filteredAssets: filteredAssets,
        assets: assets
      });
    } catch (error) {
      console.error('切换展开状态错误:', error);
    }
  },
  
  // 跳转到添加资产页
  navigateToAdd: function() {
    wx.navigateTo({
      url: '/pages/add/add',
      events: {
        // 监听添加成功事件
        addSuccess: () => {
          this.setData({ refreshOnAdd: true });
        }
      }
    });
  },
  
  // 添加资产按钮点击事件处理函数
  goToAddAsset: function() {
    wx.navigateTo({
      url: '/pages/add/add'
    });
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadAssets();
    wx.stopPullDownRefresh();
  },
  
  // 格式化价格显示
  formatPrice: function(price) {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
  // 关闭滑动操作选项
  closeSlideOptions: function() {
    this.setData({
      currentSlideAssetId: null
    });
  }
}); 