// statistics.js
const app = getApp();
const statisticsUtil = require('../../utils/statisticsUtil');
const assetManager = require('../../utils/assetManager');
const dateUtil = require('../../utils/dateUtil');

// 圆环图参数
const RING_RADIUS = 120; // 环形图半径
const RING_WIDTH = 30;   // 环形宽度

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
      
      let totalValue = overview.totalValue || 1; // 防止除以零
      
      // 为分类添加颜色和百分比信息
      const categoriesWithData = categories.map((category, index) => {
        // 计算该分类所占比例
        const percentage = (category.value / totalValue) * 100;
        const roundedPercentage = Math.round(percentage);
        
        return {
          ...category,
          color: this.data.colors[index % this.data.colors.length],
          percentage: roundedPercentage
        };
      });
      
      // 如果没有分类数据，添加一个默认的空分类
      if (categoriesWithData.length === 0) {
        categoriesWithData.push({
          name: '未分类',
          value: 0,
          count: 0,
          color: '#E0E0E0',
          percentage: 100
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
      }, () => {
        // 数据加载完成后绘制图表
        this.drawPieChart();
      });
    }, 500);
  },
  
  // 绘制饼图
  drawPieChart: function() {
    // 创建canvas上下文
    const ctx = wx.createCanvasContext('pieCanvas');
    const categories = this.data.categories;
    
    // 确定画布中心点和半径
    const canvasW = 300;
    const canvasH = 300;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;
    
    // 开始绘制
    let startAngle = -Math.PI / 2; // 从12点钟方向开始
    
    // 绘制每个分类的扇形
    categories.forEach(category => {
      const angle = (category.percentage / 100) * Math.PI * 2; // 将百分比转换为弧度
      const endAngle = startAngle + angle;
      
      ctx.beginPath();
      // 外圆弧
      ctx.arc(centerX, centerY, RING_RADIUS, startAngle, endAngle);
      // 内圆弧
      ctx.arc(centerX, centerY, RING_RADIUS - RING_WIDTH, endAngle, startAngle, true);
      ctx.closePath();
      
      // 设置颜色并填充
      ctx.setFillStyle(category.color);
      ctx.fill();
      
      // 更新起始角度
      startAngle = endAngle;
    });
    
    // 绘制中心白色圆圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, RING_RADIUS - RING_WIDTH, 0, Math.PI * 2);
    ctx.setFillStyle('#ffffff');
    ctx.fill();
    
    // 绘制总资产文本
    ctx.setFontSize(16);
    ctx.setFillStyle('#333333');
    ctx.setTextAlign('center');
    ctx.fillText('总资产', centerX, centerY - 10);
    
    ctx.setFontSize(18);
    ctx.setFillStyle('#2C7EF8');
    ctx.setTextAlign('center');
    ctx.fillText('¥' + this.data.overview.totalValue, centerX, centerY + 20);
    
    // 执行绘制
    ctx.draw();
  },
  
  // 前往资产详情页
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    // 获取首页实例
    const pages = getCurrentPages();
    let indexPage = null;
    
    // 寻找首页实例
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].route === 'pages/index/index') {
        indexPage = pages[i];
        break;
      }
    }
    
    if (indexPage) {
      // 如果找到首页实例，直接跳转到首页并展示详情弹窗
      wx.switchTab({
        url: '/pages/index/index',
        success: function() {
          // 延迟调用是为了确保页面已经完成跳转
          setTimeout(function() {
            const currentPages = getCurrentPages();
            const currentPage = currentPages[currentPages.length - 1];
            if (currentPage.route === 'pages/index/index') {
              currentPage.showAssetDetail({
                currentTarget: {
                  dataset: { id: id }
                }
              });
            }
          }, 300);
        }
      });
    } else {
      // 如果找不到首页实例，直接跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },
  
  // 格式化金额
  formatMoney: function(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
  onPullDownRefresh: function() {
    console.log('统计页面下拉刷新触发');
    wx.showLoading({
      title: '刷新中...',
    });
    
    this.loadStatisticsData();
    
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