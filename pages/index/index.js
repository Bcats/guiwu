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
      ['价格', '使用天数', '日均成本', '次均成本'],
      ['降序', '升序']
    ],
    // 当前选中的排序索引 [字段索引, 方式索引]
    sortIndex: [1, 0],
    // 当前选中的排序名称组合
    sortName: '使用天数 降序',
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
    iconAnimating: false,
    // 长按资产卡片相关
    showActionMenuId: null,
    actionMenuTimer: null
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
      sortName: this.getSortName([1, 0])
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
    
    // 检查日期是否变化，如果变化则重新加载资产以更新天数
    this.checkDateChange();
    
    // 保存当前的筛选条件
    const currentFilters = {
      searchKeyword: this.data.searchKeyword,
      selectedCategory: this.data.selectedCategory,
      categoryIndex: this.data.categoryIndex,
      selectedStatus: this.data.selectedStatus,
      statusIndex: this.data.statusIndex,
      sortIndex: this.data.sortIndex,
      sortName: this.data.sortName
    };
    
    // 总是重新加载资产数据，确保最新状态
    this.loadAssets();
    
    // 恢复筛选条件
    if (this.data.searchKeyword || 
        this.data.selectedCategory !== '全部分类' || 
        this.data.selectedStatus !== '全部状态' || 
        (this.data.sortIndex && this.data.sortIndex[0] !== 1)) {
      this.setData({
        searchKeyword: currentFilters.searchKeyword,
        selectedCategory: currentFilters.selectedCategory,
        categoryIndex: currentFilters.categoryIndex,
        selectedStatus: currentFilters.selectedStatus,
        statusIndex: currentFilters.statusIndex,
        sortIndex: currentFilters.sortIndex,
        sortName: currentFilters.sortName
      }, () => {
        // 重新应用筛选
        this.filterAssets();
      });
    }
    
    // 检查全局刷新标记
    if (app.globalData && app.globalData.needRefresh) {
      console.log('检测到全局刷新标记');
      app.globalData.needRefresh = false;
    }
    // 重置刷新标记
    if (this.data.refreshOnAdd) {
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
  
  // 检查日期是否变化，变化则更新资产天数
  checkDateChange: function() {
    try {
      // 获取当前日期的字符串表示（仅包含年月日）
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      
      // 从缓存获取上次更新的日期
      const lastUpdateDate = wx.getStorageSync('lastUpdateDate') || '';
      
      console.log('当前日期:', dateStr, '上次更新日期:', lastUpdateDate);
      
      // 如果日期变化，则重新加载资产数据
      if (dateStr !== lastUpdateDate) {
        console.log('检测到日期变化，需要更新资产天数');
        this.loadAssets(true);
        
        // 更新缓存中的日期
        wx.setStorageSync('lastUpdateDate', dateStr);
      }
    } catch (e) {
      console.error('检查日期变化失败:', e);
    }
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
  loadAssets: function (isDateChange = false) {
    console.log('开始加载资产数据', isDateChange ? '(日期变化触发)' : '');
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
          sortIndex: [1, 0],
          sortName: this.getSortName([1, 0]),
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
        sortIndex: [1, 0],
        sortName: this.getSortName([1, 0]),
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
    
    // 使用dateUtil的daysBetween方法，确保与全局日期计算逻辑一致
    // 该方法已经被修改为使用0点作为计算基准
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
    
    // 计算日均成本并保留两位小数
    const dailyCost = (totalCost / effectiveUsageDays).toFixed(2);
    return dailyCost;
  },
  
  // 计算次均成本
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
    
    // 获取使用次数，确保至少为1
    const usageCount = Math.max(1, parseInt(asset.usageCount || 1));
    
    // 计算次均成本并保留两位小数
    const usageCost = (totalCost / usageCount).toFixed(2);
    return usageCost;
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
    if (!this.data.sortOptions || !Array.isArray(this.data.sortOptions) || !indexArray) return '使用天数 降序';
    
    const fieldIndex = indexArray[0];
    const directionIndex = indexArray[1];
    
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
          case 3: // 日均成本
            valueA = a.dailyCost || 0;
            valueB = b.dailyCost || 0;
            break;
          case 4: // 次均成本
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
  
  // 长按资产卡片
  onAssetLongPress: function(e) {
    const assetId = e.currentTarget.dataset.id;
    console.log('长按资产卡片:', assetId);
    
    // 切换当前菜单的显示状态
    this.setData({
      showActionMenuId: assetId
    });
    
    // 添加震动反馈
    wx.vibrateShort({
      type: 'medium'
    });
  },
  
  // 关闭操作菜单
  closeActionMenu: function() {
    console.log('关闭操作菜单');
    this.setData({
      showActionMenuId: null
    });
    
    if (this.actionMenuTimer) {
      clearTimeout(this.actionMenuTimer);
    }
  },
  
  // 单击页面空白区域时关闭所有操作菜单
  onPageTap: function() {
    // 当点击页面空白区域时，关闭所有操作菜单
    if (this.data.showActionMenuId) {
      this.closeActionMenu();
    }
  },
  
  // 编辑资产
  editAsset: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('编辑资产', id);
    
    // 关闭操作菜单
    this.closeActionMenu();
    
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
    
    // 关闭操作菜单
    this.closeActionMenu();
    
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
    
    // 关闭操作菜单
    this.closeActionMenu();
    
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
    
    // 跳转到详情页面
    wx.navigateTo({
      url: `/pages/detail/detail?id=${asset.id}`
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
    console.log('下拉刷新');
    this.refreshAssets();
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

  /**
   * 刷新资产数据
   */
  refreshAssets: function() {
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
    }, 600);
  },
}); 