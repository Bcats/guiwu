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
    // 次均成本
    usageAverage: 0,
    // 资产残值（暂不计算）
    secondHandValue: null,
    // 成本显示模式: 'daily'(日均) 或 'usage'(次均)
    costMode: 'daily', 
    // 当前显示的成本值
    currentAverage: 0,
    // 是否隐藏敏感数据
    hideData: false,
    // 分类列表
    categories: [],
    // 当前选中的分类
    selectedCategory: '全部分类',
    // 当前选中的分类索引
    categoryIndex: 0,
    // 状态选项
    statusOptions: ['全部状态', '使用中', '停用'],
    // 当前选中的状态
    selectedStatus: '全部状态',
    // 当前选中的状态索引
    statusIndex: 0,
    // 排序多列选择器选项
    sortOptions: [
      ['默认排序', '价格', '使用天数', '购买时间', '日均成本', '次均成本'],
      ['降序', '升序']
    ],
    // 当前选中的排序索引 [字段索引, 方式索引]
    sortIndex: [0, 0],
    // 当前选中的排序名称组合
    sortName: '默认排序',
    // 搜索关键词
    searchKeyword: '',
    // 是否显示搜索框
    showSearch: false,
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
    // 当前滑动进度（0-1范围，用于控制动画）
    slideProgress: 0,
    // 最大滑动距离（单位rpx）
    maxSlideDistance: 360,
    // 是否启用滑动动画
    slideAnimating: false,
    // 浮动按钮位置
    btnPosition: {
      x: 40,
      y: 400
    },
    
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
    },
    
    // 资产详情弹出层
    showDetailPopup: false,
    detailAsset: null,
    iconAnimating: false
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
    this.touchStartTime = 0;
    this.isTouchMove = false;
    this.totalMoveDistance = 0;
    this.slideDirection = null;
    // 初始化右滑最大距离，与最大滑动距离相同
    this.maxRightSwipeDistance = this.data.maxSlideDistance;
    this.lastUpdateTime = 0;
    
    // 默认设置
    this.setData({
      showCategoryDropdown: false,
      currentSlideAssetId: null,
      showOverview: true,
      searchKeyword: '',
      assets: [],
      filteredAssets: [],
      sortName: this.getSortName([0, 1])
    });
    
    // 获取系统信息设置合理的初始按钮位置
    try {
      const systemInfo = wx.getSystemInfoSync();
      const screenWidth = systemInfo.windowWidth;
      const screenHeight = systemInfo.windowHeight;
      
      // 尝试从缓存中读取按钮位置
      const savedPosition = wx.getStorageSync('floatingBtnPosition');
      
      // 设置初始位置或使用缓存的位置
      let btnPosition;
      if (savedPosition) {
        // 确保缓存的位置在屏幕范围内
        btnPosition = {
          x: Math.min(screenWidth - 60, Math.max(0, savedPosition.x)),
          y: Math.min(screenHeight - 60, Math.max(0, savedPosition.y))
        };
      } else {
        // 默认右下角位置，距离右边和底部各40px
        btnPosition = {
          x: screenWidth - 100,
          y: screenHeight - 200
        };
      }
      
      this.setData({
        btnPosition: btnPosition
      });
    } catch (e) {
      console.error('初始化按钮位置失败:', e);
      // 设置一个默认位置
      this.setData({
        btnPosition: {x: 40, y: 500}
      });
    }
    
    // 立即加载资产数据
    this.loadAssets();
  },
  
  onShow: function() {
    console.log('首页显示 - onShow');
    
    // 检查全局刷新标记
    if (app.globalData && app.globalData.needRefresh) {
      console.log('检测到全局刷新标记，正在重新加载资产...');
      this.loadAssets();
      app.globalData.needRefresh = false;
    }
    // 如果标记为需要刷新，则重新加载资产
    else if (this.data.refreshOnAdd) {
      console.log('检测到需要刷新标记，正在重新加载资产...');
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
      const overview = statisticsUtil.getOverview() || { totalCount: 0, totalValue: 0, dailyAverage: 0, usageAverage: 0 };
      
      // 获取并处理所有分类
      const categories = assetManager.getCategories() || [];
      
      // 如果没有资产，直接设置空数据
      if (!assets || assets.length === 0) {
        console.log('没有资产数据');
        this.setData({
          assets: [],
          filteredAssets: [],
          categories: ['全部分类'],
          selectedCategory: '全部分类',
          categoryIndex: 0,
          selectedStatus: '全部状态',
          statusIndex: 0,
          sortIndex: [0, 1],
          sortName: this.getSortName([0, 1]),
          totalAssets: 0,
          totalValue: '0.00',
          dailyAverage: '0.00',
          usageAverage: '0.00',
          currentAverage: '0.00',
          secondHandValue: null,
          loading: false
        });
        return;
      }
      
      // 对资产列表进行处理，添加额外的展示字段
      const formattedAssets = assets.map(asset => {
        // 计算使用天数
        const usageDays = this.calculateUsageDays(asset);
        
        // 计算日均成本
        const dailyCost = this.calculateDailyCost(asset, usageDays);
        
        // 计算次均成本
        const usageCost = this.calculateUsageCost(asset);
        
        // 格式化日期
        const formattedPurchaseDate = asset.purchaseDate 
          ? dateUtil.formatDateString(asset.purchaseDate) 
          : '未知';
        
        // 计算使用率
        const usageRate = this.calculateUsageRate(asset);
        
        // 处理分类小写
        const categoryLower = asset.category ? asset.category.toLowerCase() : 'default';
        
        // 确保资产有状态值，默认为"使用中"
        const status = asset.status || '使用中';
        
        return {
          ...asset,
          status: status, // 确保每个资产都有状态值
          usageDays: usageDays,
          dailyCost: dailyCost,
          usageCost: usageCost,
          formattedPurchaseDate: formattedPurchaseDate,
          usageRate: usageRate,
          categoryLower: categoryLower,
          expanded: false // 默认不展开
        };
      });
      
      // 所有分类加上"全部分类"选项
      const allCategories = ['全部分类', ...categories];
      
      // 根据当前模式计算要显示的成本
      const currentAverage = this.data.costMode === 'daily' ? 
        Number(overview.dailyAverage).toFixed(2) : 
        Number(overview.usageAverage).toFixed(2);
      
      // 计算资产残值（默认为总资产价值的60%）
      // const secondHandValue = (Number(overview.totalValue) * 0.6).toFixed(2);
      
      this.setData({
        assets: formattedAssets,
        filteredAssets: formattedAssets,
        categories: allCategories,
        selectedCategory: '全部分类',
        categoryIndex: 0,
        selectedStatus: '全部状态',
        statusIndex: 0,
        sortIndex: [0, 1],
        sortName: this.getSortName([0, 1]),
        totalAssets: formattedAssets.length,
        totalValue: Number(overview.totalValue).toFixed(2),
        dailyAverage: Number(overview.dailyAverage).toFixed(2),
        usageAverage: Number(overview.usageAverage).toFixed(2),
        currentAverage: currentAverage,
        // secondHandValue: secondHandValue,
        loading: false
      });
      
      // 搜索关键词或分类如果存在，则需要应用筛选
      if (this.data.searchKeyword || 
          (this.data.selectedCategory && this.data.selectedCategory !== '全部分类') ||
          (this.data.selectedStatus && this.data.selectedStatus !== '全部状态') ||
          (this.data.sortIndex && this.data.sortIndex[0] > 0)) {
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
  
  // 计算次均成本
  calculateUsageCost: function(asset) {
    if (!asset.price) return 0;
    
    const price = parseFloat(asset.price);
    const usageCount = parseInt(asset.usageCount || 1);
    return (price / Math.max(1, usageCount)).toFixed(2);
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
  
  // Picker分类变更
  onCategoryChange: function(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    
    this.setData({
      selectedCategory: category,
      categoryIndex: index
    }, () => {
      this.filterAssets();
    });
  },
  
  // Picker状态变更
  onStatusChange: function(e) {
    const index = e.detail.value;
    const status = this.data.statusOptions[index];
    
    console.log('状态筛选变更:', status, '索引:', index);
    
    this.setData({
      selectedStatus: status,
      statusIndex: index
    }, () => {
      this.filterAssets();
    });
  },
  
  // 组合排序名称
  getSortName: function(indexArray) {
    if (!this.data.sortOptions || !Array.isArray(this.data.sortOptions) || !indexArray) return '默认排序';
    
    const fieldIndex = indexArray[0];
    const directionIndex = indexArray[1];
    
    // 如果是默认排序，不显示排序方式
    if (fieldIndex === 0) {
      return this.data.sortOptions[0][fieldIndex];
    }
    
    // 组合字段和方式
    return this.data.sortOptions[0][fieldIndex] + ' ' + this.data.sortOptions[1][directionIndex];
  },
  
  // 多列排序选择器变更
  onSortChange: function(e) {
    const indexArray = e.detail.value;
    const sortName = this.getSortName(indexArray);
    
    this.setData({
      sortIndex: indexArray,
      sortName: sortName
    }, () => {
      this.filterAssets();
    });
  },
  
  /**
   * 筛选资产列表
   */
  filterAssets() {
    const { assets, selectedCategory, selectedStatus, searchKeyword, costMode } = this.data;
    console.log('筛选条件 - 状态:', selectedStatus);
    
    // 筛选条件
    const filteredAssets = assets.filter(item => {
      // 分类筛选
      if (selectedCategory !== '全部分类' && item.category !== selectedCategory) {
        return false;
      }
      
      // 状态筛选
      if (selectedStatus === '使用中' && item.status !== '使用中') {
        console.log('筛选掉非使用中资产:', item.name, '状态:', item.status);
        return false;
      } else if (selectedStatus === '停用' && item.status !== '停用') {
        console.log('筛选掉非停用资产:', item.name, '状态:', item.status);
        return false;
      } else if (selectedStatus !== '全部状态' && selectedStatus !== '使用中' && selectedStatus !== '停用' && item.status !== selectedStatus) {
        console.log('筛选掉其他状态资产:', item.name, '状态:', item.status, '期望状态:', selectedStatus);
        return false;
      }
      
      // 搜索关键词筛选
      if (searchKeyword && searchKeyword.trim() !== '') {
        const keyword = searchKeyword.trim().toLowerCase();
        return item.name.toLowerCase().includes(keyword) || 
               (item.remark && item.remark.toLowerCase().includes(keyword)) ||
               (item.category && item.category.toLowerCase().includes(keyword));
      }
      
      return true;
    });
    
    // 排序
    const [fieldIndex, orderIndex] = this.data.sortIndex;
    let sortedAssets = [...filteredAssets];
    
    // 如果不是默认排序，进行排序
    if (fieldIndex > 0) {
      const isAsc = orderIndex === 0; // 0表示升序，1表示降序
      
      sortedAssets.sort((a, b) => {
        let valueA, valueB;
        
        // 根据选择的字段获取排序值
        switch(fieldIndex) {
          case 1: // 价格
            valueA = a.price || 0;
            valueB = b.price || 0;
            break;
          case 2: // 使用天数
            valueA = a.usageDays || 0;
            valueB = b.usageDays || 0;
            break;
          case 3: // 购买时间
            valueA = a.buyDate ? new Date(a.buyDate).getTime() : 0;
            valueB = b.buyDate ? new Date(b.buyDate).getTime() : 0;
            break;
          case 4: // 日均成本
            valueA = a.dailyCost || 0;
            valueB = b.dailyCost || 0;
            break;
          case 5: // 次均成本
            valueA = a.usageCost || 0;
            valueB = b.usageCost || 0;
            break;
          default:
            return 0;
        }
        
        // 根据排序方式返回结果
        return isAsc ? valueA - valueB : valueB - valueA;
      });
    }
    
    // 计算筛选后的资产总价值
    const totalValue = sortedAssets.reduce((sum, item) => sum + (Number(item.price) || 0), 0).toFixed(2);
    
    // 重新计算筛选后的日均和次均成本
    let dailyAverage = 0;
    let usageAverage = 0;
    
    sortedAssets.forEach(asset => {
      // 累加日均成本
      dailyAverage += Number(asset.dailyCost) || 0;
      
      // 累加次均成本
      usageAverage += Number(asset.usageCost) || 0;
    });
    
    // 保留两位小数
    dailyAverage = dailyAverage.toFixed(2);
    usageAverage = usageAverage.toFixed(2);
    
    // 根据当前显示模式选择要显示的值
    const currentAverage = costMode === 'daily' ? dailyAverage : usageAverage;
    
    // 资产残值暂不计算，设为null以显示"--"
    const secondHandValue = null;
    
    this.setData({
      filteredAssets: sortedAssets,
      // 资产总数
      assetCount: sortedAssets.length,
      // 资产总价值
      totalValue: totalValue,
      // 更新日均和次均成本
      dailyAverage: dailyAverage,
      usageAverage: usageAverage,
      // 更新当前显示的成本值
      currentAverage: currentAverage,
      // 更新资产残值
      secondHandValue: secondHandValue,
      // 空状态提示文案
      emptyText: '还没有添加任何资产'
    });
  },
  
  // 处理资产卡片的触摸事件
  onAssetTouchStart: function(e) {
    // 获取当前触摸的资产ID
    const assetId = e.currentTarget.dataset.id;
    
    // 记录起始触摸位置和时间
    this.touchStartX = e.touches[0].pageX;
    this.touchStartY = e.touches[0].pageY;
    this.touchStartTime = Date.now();
    this.isTouchMove = false;
    this.totalMoveDistance = 0;
    
    // 关闭滑动动画，确保跟手感
    this.setData({
      slideAnimating: false
    });
  },
  
  onAssetTouchMove: function(e) {
    const moveX = e.touches[0].pageX;
    const moveY = e.touches[0].pageY;
    
    // 计算X和Y方向的移动距离
    const deltaX = moveX - this.touchStartX;
    const deltaY = moveY - this.touchStartY;
    
    // 计算总移动距离
    this.totalMoveDistance = Math.abs(deltaX);
    
    // 如果Y方向移动大于X方向，不处理左右滑动，让页面自然滚动
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }
    
    // 节流处理：限制UI更新频率，提高性能
    const now = Date.now();
    if (this.lastUpdateTime && now - this.lastUpdateTime < 16) { // 约60fps
      return;
    }
    this.lastUpdateTime = now;
    
    // 降低滑动触发阈值，提高灵敏度
    if (Math.abs(deltaX) > 2) { // 更低的阈值，更灵敏
      this.isTouchMove = true;
      
      // 获取当前触摸的资产ID
      const assetId = e.currentTarget.dataset.id;
      
      // 计算滑动进度
      let progress = 0;
      
      // 计算门槛值
      const threshold = this.data.maxSlideDistance * 0.4;
      
      // 向左滑动时，deltaX为负值，打开操作按钮
      if (deltaX < 0) {
        // 只有当没有其他卡片展开或者正在操作当前卡片时，才允许左滑
        if (!this.data.currentSlideAssetId || this.data.currentSlideAssetId === assetId) {
          // 计算左滑进度，范围0-1
          progress = Math.min(1, Math.abs(deltaX) / threshold);
          this.slideDirection = 'left';
        } else {
          // 如果其他卡片已经展开，不处理
          return;
        }
      } 
      // 向右滑动时，deltaX为正值
      else if (deltaX > 0) {
        // 只有当前卡片已经处于左滑状态时才处理右滑
        if (this.data.currentSlideAssetId === assetId && this.data.slideProgress > 0) {
          // 简单对称：用当前进度减去右滑带来的进度变化
          // 将右滑距离等比例转换为进度减少量
          const progressDecrement = Math.min(1, deltaX / threshold);
          // 当前进度减去右滑进度，最小为0
          progress = Math.max(0, this.data.slideProgress - progressDecrement);
          
          this.slideDirection = 'right';
        } else {
          return; // 如果卡片未处于左滑状态，不处理右滑
        }
      }
      
      // 随着进度变化调整视觉效果
      const rightCornerRadius = progress > 0.8 ? 8 : Math.max(8, 32 - progress * 32);
      
      // 更新滑动状态
      this.setData({
        slideAnimating: false, // 触摸移动时禁用动画，保证跟手感
        currentSlideAssetId: assetId,
        slideProgress: progress,
        rightCornerRadius: rightCornerRadius
      });
    }
  },
  
  onAssetTouchEnd: function(e) {
    if (!this.isTouchMove) {
      return;
    }
    
    this.isTouchMove = false;
    
    // 获取结束触摸时间
    const endTime = Date.now();
    const touchDuration = endTime - this.touchStartTime;
    
    // 计算平均速度（像素/毫秒）
    const speed = this.totalMoveDistance / Math.max(touchDuration, 1);
    
    // 速度阈值
    const speedThreshold = 0.15;
    
    const assetId = e.currentTarget.dataset.id;
    const slideDirection = this.slideDirection || 'none';
    
    // 启用动画，使后续变化平滑
    this.setData({
      slideAnimating: true
    });
    
    // 进度阈值
    const progressThreshold = 0.2;
    
    // 根据滑动方向和进度决定最终状态
    if (slideDirection === 'left') {
      // 左滑：进度大或速度快则完全展开，否则恢复原位
      if (this.data.slideProgress > progressThreshold || speed > speedThreshold) {
        this.setData({
          slideProgress: 1,
          rightCornerRadius: 8
        });
      } else {
        this.restoreCardPosition(assetId);
      }
    } else if (slideDirection === 'right') {
      // 右滑：进度小或速度快则完全恢复，否则保持原位
      if (this.data.slideProgress < (1 - progressThreshold) || speed > speedThreshold) {
        this.restoreCardPosition(assetId);
      } else {
        // 保持展开状态
        this.setData({
          slideProgress: 1,
          rightCornerRadius: 8
        });
      }
    } else {
      // 无明确方向，根据当前进度决定
      if (this.data.slideProgress > 0.5) {
        this.setData({
          slideProgress: 1,
          rightCornerRadius: 8
        });
      } else {
        this.restoreCardPosition(assetId);
      }
    }
    
    // 清除滑动方向
    this.slideDirection = null;
  },
  
  // 恢复卡片位置的辅助函数
  restoreCardPosition: function(assetId) {
    // 启用动画，设为0进度
    this.setData({
      slideAnimating: true,
      slideProgress: 0,
      rightCornerRadius: 32
    });
    
    // 立即重置当前滑动资产ID，不等待动画完成
    this.setData({
      currentSlideAssetId: null
    });
    
    // 仍然保留计时器以确保动画完成后UI状态一致
    setTimeout(() => {
      // 额外的安全检查，确保进度确实为0
      if (this.data.slideProgress !== 0) {
        this.setData({
          slideProgress: 0
        });
      }
    }, 300);
  },
  
  // 关闭所有滑动选项
  closeAllSlideOptions: function() {
    // 如果没有打开的卡片，直接返回
    if (!this.data.currentSlideAssetId) {
      return;
    }
    
    // 保存当前滑动卡片ID，以便后续清理
    const slidingCardId = this.data.currentSlideAssetId;
    
    // 启用动画，设为0进度
    this.setData({
      slideAnimating: true,
      slideProgress: 0,
      rightCornerRadius: 32
    });
    
    // 立即重置当前滑动状态，不等待动画完成
    // 这样可以确保在showAssetDetail中点击其他卡片时能正确显示详情
    this.setData({
      currentSlideAssetId: null
    });
    
    // 仍然保留计时器以确保动画完成后UI状态一致
    setTimeout(() => {
      // 额外的安全检查，确保进度确实为0
      if (this.data.slideProgress !== 0) {
        this.setData({
          slideProgress: 0
        });
      }
    }, 300);
  },
  
  // 单击页面空白区域时关闭所有滑动选项
  onPageTap: function() {
    // 当点击页面空白区域时，关闭所有展开的滑动选项
    if (this.data.currentSlideAssetId) {
      this.closeAllSlideOptions();
    }
  },
  
  // 编辑资产
  editAsset: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('编辑资产', id);
    
    // 隐藏滑动操作区
    this.setData({
      currentSlideAssetId: null
    });
    
    // 跳转到编辑页面
    wx.navigateTo({
      url: `/pages/add/add?id=${id}`
    });
  },
  
  // 删除资产
  deleteAsset: function(e) {
    const id = e.currentTarget.dataset.id;
    
    // 查找对应的资产
    const asset = this.data.assets.find(a => a.id === id);
    if (!asset) {
      console.error('找不到对应ID的资产:', id);
      return;
    }
    
    const name = asset.name;
    
    // 显示删除确认对话框
    wx.showModal({
      title: '删除确认',
      content: `确定要删除"${name}"吗？此操作不可恢复。`,
      confirmColor: '#FA5151',
      success: (res) => {
        // 隐藏滑动操作区
        this.setData({
          currentSlideAssetId: null
        });
        
        if (res.confirm) {
          const result = assetManager.deleteAsset(id);
          if (result) {
            // 显示删除成功提示
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 重新加载资产列表
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
  },
  
  // 置顶资产
  topAsset: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('置顶资产', id);
    
    // 获取当前资产列表
    const assets = this.data.assets;
    const asset = assets.find(a => a.id === id);
    
    if (!asset) {
      wx.showToast({
        title: '资产不存在',
        icon: 'none'
      });
      return;
    }
    
    // 从列表中移除该资产
    const newAssets = assets.filter(a => a.id !== id);
    // 将资产添加到列表开头
    newAssets.unshift(asset);
    
    // 更新本地存储
    try {
      wx.setStorageSync('assets', newAssets);
      
      // 更新页面数据
      this.setData({
        assets: newAssets,
        filteredAssets: this.data.selectedCategory === '全部分类' ? newAssets : newAssets.filter(a => a.category === this.data.selectedCategory),
        currentSlideAssetId: null
      });
      
      wx.showToast({
        title: '置顶成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('置顶资产失败:', error);
      wx.showToast({
        title: '置顶失败',
        icon: 'none'
      });
    }
  },
  
  // 显示资产详情
  showAssetDetail: function(e) {
    const assetId = e.currentTarget.dataset.id;
    const assetIndex = this.data.filteredAssets.findIndex(item => item.id === assetId);
    
    if (assetIndex === -1) {
      return;
    }
    
    // 判断点击的是否是当前正在滑动的卡片
    const isSlidingCard = this.data.currentSlideAssetId === assetId;
    
    // 如果有任何卡片处于滑动状态
    if (this.data.currentSlideAssetId) {
      // 关闭所有滑动选项
      this.closeAllSlideOptions();
      
      // 如果点击的不是当前滑动的卡片，不显示详情，仅关闭滑动选项
      if (!isSlidingCard) {
        return;
      }
      
      // 如果点击的是当前滑动的卡片，已经在closeAllSlideOptions中关闭了滑动选项
      // 阻止显示详情
      return;
    }
    
    // 获取资产并处理保修状态
    const asset = this.data.filteredAssets[assetIndex];
    
    // 检查保修期是否过期
    if (asset.warrantyDate) {
      const today = new Date();
      const warrantyDate = new Date(asset.warrantyDate.replace(/-/g, '/'));
      
      // 设置isExpired属性：当前日期超过保修日期即为过期
      asset.isExpired = today > warrantyDate;
    } else {
      asset.isExpired = false;
    }
    
    // 显示资产详情
    this.setData({
      detailAsset: asset,
      showDetailPopup: true
    });
  },
  
  // 关闭资产详情弹出层
  closeAssetDetail: function() {
    this.setData({
      showDetailPopup: false
    });
  },
  
  // 阻止事件冒泡
  stopPropagation: function(e) {
    // 阻止点击内容区域触发关闭事件
    return false;
  },
  
  // 预览详情中的图片
  previewDetailImage: function(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    
    const urls = this.data.detailAsset.imagePaths || [];
    wx.previewImage({
      current: src,
      urls: urls
    });
  },
  
  // 编辑详情资产
  editDetailAsset: function() {
    if (!this.data.detailAsset) return;
    
    const id = this.data.detailAsset.id;
    
    // 关闭弹窗并跳转到编辑页
    this.closeAssetDetail();
    
    wx.navigateTo({
      url: `/pages/add/add?id=${id}`
    });
  },
  
  // 删除详情中的资产
  deleteDetailAsset: function() {
    if (!this.data.detailAsset) return;
    
    const id = this.data.detailAsset.id;
    const name = this.data.detailAsset.name;
    
    wx.showModal({
      title: '删除确认',
      content: `确定要删除"${name}"吗？此操作不可恢复。`,
      confirmColor: '#FA5151',
      success: (res) => {
        if (res.confirm) {
          const result = assetManager.deleteAsset(id);
          if (result) {
            // 关闭弹出层
            this.closeAssetDetail();
            
            // 显示删除成功提示
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 重新加载资产列表
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
  },
  
  // 按钮触摸开始
  btnTouchStart: function(e) {
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.isDragging = false;
    this.btnStartPosition = {
      x: this.data.btnPosition.x,
      y: this.data.btnPosition.y
    };
  },
  
  // 按钮触摸移动
  btnTouchMove: function(e) {
    // 获取系统信息计算边界
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    const screenHeight = systemInfo.windowHeight;
    
    // 计算tabBar位置（通常在底部，预留120px高度）
    const tabBarTop = screenHeight - 90;
    
    // 计算按钮大小（约60px）
    const btnSize = 60;
    
    // 计算移动距离
    const moveX = e.touches[0].clientX - this.startX;
    const moveY = e.touches[0].clientY - this.startY;
    
    // 如果移动距离足够大才认为是拖动
    if (Math.abs(moveX) > 5 || Math.abs(moveY) > 5) {
      this.isDragging = true;
    }
    
    // 计算新位置（保持在屏幕内）
    let newX = this.btnStartPosition.x + moveX;
    let newY = this.btnStartPosition.y + moveY;
    
    // 边界检查：确保按钮不会超出屏幕
    newX = Math.max(0, Math.min(screenWidth - btnSize, newX));
    // 防止按钮拖到tabBar区域
    newY = Math.max(0, Math.min(tabBarTop - btnSize, newY));
    
    // 更新按钮位置
    this.setData({
      btnPosition: {
        x: newX,
        y: newY
      }
    });
  },
  
  // 按钮触摸结束
  btnTouchEnd: function(e) {
    // 保存按钮位置到本地存储
    wx.setStorageSync('floatingBtnPosition', this.data.btnPosition);
    
    // 如果没有拖动，则视为点击，触发跳转
    if (!this.isDragging) {
      setTimeout(() => {
        this.goToAdd();
      }, 50); // 短暂延时避免可能的冲突
    }
    
    // 重置拖动状态（延时重置，防止与点击事件冲突）
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  },
  
  // 跳转到添加页面
  goToAdd: function() {
    console.log('跳转到添加页面');
    wx.navigateTo({
      url: '/pages/add/add'
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
  },
  
  // 保留原有goToDetail方法以保持兼容性
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    // 改为调用showAssetDetail方法
    this.showAssetDetail(e);
  },
  
  // 分享资产
  shareAsset: function() {
    if (!this.data.detailAsset) return;
    
    const asset = this.data.detailAsset;
    
    // 准备分享内容
    const shareText = `我的资产: ${asset.name}\n购买价格: ¥${asset.price}\n使用天数: ${asset.usageDays}天\n日均成本: ¥${asset.dailyCost}/天`;
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
    
    // 也可以使用小程序的分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
  
  // 增强UI交互，点击图标放大效果
  onIconTap: function() {
    if (!this.data.detailAsset) return;
    
    // 添加一个临时类来执行动画效果
    this.setData({
      iconAnimating: true
    });
    
    setTimeout(() => {
      this.setData({
        iconAnimating: false
      });
    }, 300);
  },
  
  // 切换成本显示模式（日均/次均）
  toggleCostMode: function() {
    // 切换模式
    const newMode = this.data.costMode === 'daily' ? 'usage' : 'daily';
    
    // 确保数值格式化为两位小数
    const currentAverage = newMode === 'daily' ? 
      Number(this.data.dailyAverage).toFixed(2) : 
      Number(this.data.usageAverage).toFixed(2);
    
    console.log('切换成本模式:', newMode, '当前平均值:', currentAverage);
    
    // 更新状态
    this.setData({
      costMode: newMode,
      currentAverage: currentAverage
    });
  },

  /**
   * 切换搜索框显示
   */
  toggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch
    });
    // 如果关闭搜索框且有搜索关键词，则清空搜索
    if (!this.data.showSearch && this.data.searchKeyword) {
      this.clearSearch();
    }
    // 如果打开搜索框则聚焦输入框
    if (this.data.showSearch) {
      // 微信小程序中不需要手动聚焦，通过设置focus属性自动聚焦
    }
  },

  /**
   * 处理搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    // 延迟执行搜索，避免频繁刷新
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.filterAssets();
    }, 300);
  },

  /**
   * 清除搜索内容
   */
  clearSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.filterAssets();
  },

  /**
   * 切换数据可见性（显示/隐藏敏感数据）
   */
  toggleDataVisibility: function() {
    this.setData({
      hideData: !this.data.hideData
    });
  },
}); 