// statistics.js
const app = getApp();
const statisticsUtil = require('../../utils/statisticsUtil');
const assetManager = require('../../utils/assetManager');
const dateUtil = require('../../utils/dateUtil');

Page({
  data: {
    app: getApp(),
    loading: true,
    theme: 'light',
    overview: {
      totalValue: 0,
      assetCount: 0,
      dailyAverage: 0
    },
    categories: [], // 分类统计
    mostUsedAssets: [], // 最常使用
    recentlyAddedAssets: [], // 最近添加
    // 用于随机生成饼图颜色
    colors: ['#F44336', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#FF9800', '#795548', '#607D8B']
  },

  onLoad: function() {
    this.setData({
      theme: app.getTheme()
    });
    
    this.loadStatisticsData();
  },
  
  onShow: function() {
    this.loadStatisticsData();
    
    // 设置tabBar高亮
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },
  
  // 加载统计数据
  loadStatisticsData: function() {
    this.setData({ loading: true });
    
    setTimeout(() => {
      const overview = statisticsUtil.getOverview();
      const categories = statisticsUtil.getCategoryStatistics();
      const mostUsedAssets = statisticsUtil.getMostUsedAssets(5);
      const recentlyAddedAssets = statisticsUtil.getRecentlyAddedAssets(5);
      
      // 计算每个分类在饼图中的角度
      let totalValue = overview.totalValue || 1; // 防止除以零
      let startAngle = 0;
      
      // 为分类添加颜色和角度信息
      const categoriesWithData = categories.map((category, index) => {
        // 计算该分类所占比例
        const percentage = (category.value / totalValue) * 100;
        
        // 计算角度，确保角度与百分比成比例
        // 将百分比转换为角度（100% = 360度）
        const sweepAngle = Math.min(percentage * 3.6, 360);
        
        // 保存当前的起始角度
        const currentStartAngle = startAngle;
        
        // 更新下一个分类的起始角度
        startAngle += sweepAngle;
        
        return {
          ...category,
          color: this.data.colors[index % this.data.colors.length],
          percentage: Math.round(percentage), // 四舍五入到整数
          startAngle: currentStartAngle,
          sweepAngle: sweepAngle
        };
      });
      
      // 如果没有分类数据，添加一个默认的空分类以显示完整环形
      if (categoriesWithData.length === 0) {
        categoriesWithData.push({
          name: '未分类',
          value: 0,
          count: 0,
          color: '#E0E0E0',
          percentage: 0,
          startAngle: 0,
          sweepAngle: 360
        });
      }
      
      // 为最近添加的资产添加相对时间
      const recentWithTime = recentlyAddedAssets.map(asset => {
        return {
          ...asset,
          relativeTime: dateUtil.getRelativeTimeDesc(asset.createTime)
        };
      });
      
      this.setData({
        overview,
        categories: categoriesWithData,
        mostUsedAssets,
        recentlyAddedAssets: recentWithTime,
        loading: false
      });
    }, 500);
  },
  
  // 前往资产详情页
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },
  
  // 格式化金额
  formatMoney: function(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
  onPullDownRefresh: function() {
    this.loadStatisticsData();
    wx.stopPullDownRefresh();
  }
}); 