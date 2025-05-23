/**
 * 统计工具类
 * 提供数据统计和分析功能
 */

// 为了避免循环引用，延迟导入assetManager
let assetManager = null;
const dateUtil = require('./dateUtil');

// 确保在使用时导入assetManager
function getAssetManager() {
  if (!assetManager) {
    assetManager = require('./assetManager');
  }
  return assetManager;
}

// 添加缓存变量
let _cachedAssets = null;
let _cacheTimestamp = 0;
// 缓存过期时间(毫秒)：5分钟
const CACHE_EXPIRE_TIME = 5 * 60 * 1000;

const statisticsUtil = {
  /**
   * 获取资产数据，优先使用缓存
   * @param {Boolean} forceRefresh 是否强制刷新缓存
   * @returns {Array} 资产列表
   */
  getAssets: function(forceRefresh = false) {
    const now = Date.now();
    
    // 如果缓存不存在、强制刷新或缓存过期，则重新获取数据
    if (forceRefresh || !_cachedAssets || now - _cacheTimestamp > CACHE_EXPIRE_TIME) {
      _cachedAssets = getAssetManager().getAllAssets();
      _cacheTimestamp = now;
    }
    
    return _cachedAssets;
  },
  
  /**
   * 清除缓存
   */
  clearCache: function() {
    _cachedAssets = null;
    _cacheTimestamp = 0;
  },
  
  /**
   * 从资产列表计算总价值
   * @param {Array} assets 资产列表
   * @returns {Number} 总价值
   */
  getTotalValueFromAssets: function(assets) {
    return assets.reduce((total, asset) => total + (Number(asset.price) || 0), 0);
  },
  
  /**
   * 获取资产概览数据
   * @param {Boolean} forceRefresh 是否强制刷新缓存
   * @returns {Object} 资产概览数据
   */
  getOverview: function(forceRefresh = false) {
    const assets = this.getAssets(forceRefresh);
    const totalValue = this.getTotalValueFromAssets(assets);
    const assetCount = assets.length;
    
    // 计算日均成本 - 每个资产的单独日均成本之和
    let dailyAverage = 0;
    // 计算次均成本 - 每个资产的单独次均成本之和
    let usageAverage = 0;
    
    assets.forEach(asset => {
      // 计算每个资产的使用天数
      const usageDays = dateUtil.daysBetween(asset.purchaseDate);
      // 确保使用天数至少为1天，避免除以0的错误
      const effectiveUsageDays = Math.max(1, usageDays);
      
      // 获取基础价格
      let totalCost = Number(asset.price) || 0;
      
      // 添加额外费用
      if (asset.additionalCosts && Array.isArray(asset.additionalCosts)) {
        asset.additionalCosts.forEach(cost => {
          totalCost += Number(cost.amount) || 0;
        });
      } else if (asset.additionalCost) {
        // 兼容旧版额外费用字段
        totalCost += Number(asset.additionalCost) || 0;
      }
      
      // 计算每个资产的日均成本
      const assetDailyCost = totalCost / effectiveUsageDays;
      // 累加所有资产的日均成本
      dailyAverage += assetDailyCost;
      
      // 计算每个资产的次均成本
      const usageCount = parseInt(asset.usageCount || 1);
      // 确保使用次数至少为1次，避免除以0的错误
      const effectiveUsageCount = Math.max(1, usageCount);
      // 计算每个资产的次均成本
      const assetUsageCost = totalCost / effectiveUsageCount;
      // 累加所有资产的次均成本
      usageAverage += assetUsageCost;
    });
    
    // 保留两位小数
    dailyAverage = Number(dailyAverage.toFixed(2));
    usageAverage = Number(usageAverage.toFixed(2));
    
    return {
      totalValue,
      assetCount: assetCount,
      totalCount: assetCount, // 添加totalCount属性以匹配index.js中的引用
      dailyAverage,
      usageAverage
    };
  },
  
  /**
   * 获取分类统计数据
   * @returns {Array} 分类统计数据
   */
  getCategoryStatistics: function() {
    const assets = this.getAssets();
    const totalValue = this.getTotalValueFromAssets(assets);
    const categoryMap = {};
    
    // 按分类汇总
    assets.forEach(asset => {
      const category = asset.category || '未分类';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          value: 0,
          count: 0
        };
      }
      
      categoryMap[category].value += Number(asset.price) || 0;
      categoryMap[category].count += 1;
    });
    
    // 转换为数组并计算百分比
    const result = Object.values(categoryMap);
    result.forEach(item => {
      item.percentage = totalValue > 0 
        ? Math.round((item.value / totalValue) * 100) 
        : 0;
    });
    
    // 按价值降序排序
    return result.sort((a, b) => b.value - a.value);
  },
  
  /**
   * 获取价值分布数据
   * @returns {Object} 价值分布数据
   */
  getValueDistribution: function() {
    const assets = this.getAssets();
    
    // 价格区间划分
    const ranges = {
      '1000以下': { min: 0, max: 1000, count: 0, value: 0 },
      '1000-5000': { min: 1000, max: 5000, count: 0, value: 0 },
      '5000-10000': { min: 5000, max: 10000, count: 0, value: 0 },
      '10000以上': { min: 10000, max: Infinity, count: 0, value: 0 }
    };
    
    assets.forEach(asset => {
      const price = Number(asset.price) || 0;
      
      for (const key in ranges) {
        const range = ranges[key];
        if (price > range.min && price <= range.max) {
          range.count += 1;
          range.value += price;
          break;
        }
      }
    });
    
    return ranges;
  },
  
  /**
   * 获取月度变化数据
   * @returns {Array} 月度变化数据
   */
  getMonthlyChange: function() {
    const assets = this.getAssets();
    const monthlyData = {};
    
    // 按月统计资产增加情况
    assets.forEach(asset => {
      // 优先使用 createTime，其次使用 purchaseDate，最后使用当前时间
      let dateStr = asset.createTime || asset.purchaseDate;
      if (!dateStr) {
        console.warn('资产无日期信息:', asset.name || asset.id);
        return; // 跳过没有日期的资产
      }
      
      let date;
      try {
        // 处理不同格式的日期字符串
        if (typeof dateStr === 'string') {
          // 替换日期格式中的连字符，确保兼容iOS
          date = new Date(dateStr.replace(/-/g, '/'));
          
          // 检查日期是否有效
          if (isNaN(date.getTime())) {
            console.warn('无效的日期格式:', dateStr);
            return; // 跳过无效日期
          }
        } else {
          date = new Date();
        }
        
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[yearMonth]) {
          monthlyData[yearMonth] = {
            month: yearMonth,
            count: 0,
            value: 0
          };
        }
        
        monthlyData[yearMonth].count += 1;
        monthlyData[yearMonth].value += Number(asset.price) || 0;
      } catch (error) {
        console.error('处理资产日期出错:', error);
      }
    });
    
    // 转换为数组并按时间排序
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  },
  
  /**
   * 获取最常使用的资产
   * @param {Number} limit 限制数量
   * @returns {Array} 最常使用的资产列表
   */
  getMostUsedAssets: function(limit = 5) {
    const assets = this.getAssets();
    
    return assets
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit)
      .map(asset => ({
        id: asset.id,
        name: asset.name,
        usageCount: asset.usageCount || 0,
        category: asset.category || '未分类',
        price: asset.price || 0
      }));
  },
  
  /**
   * 获取最近添加的资产
   * @param {Number} limit 限制数量
   * @returns {Array} 最近添加的资产列表
   */
  getRecentlyAddedAssets: function(limit = 5) {
    const assets = this.getAssets();
    
    return assets
      .sort((a, b) => {
        // 处理iOS兼容性问题
        let dateStrA = a.createTime || a.purchaseDate;
        let dateStrB = b.createTime || b.purchaseDate;
        
        let dateA, dateB;
        
        if (typeof dateStrA === 'string') {
          dateA = new Date(dateStrA.replace(/-/g, '/'));
        } else {
          dateA = new Date();
        }
        
        if (typeof dateStrB === 'string') {
          dateB = new Date(dateStrB.replace(/-/g, '/'));
        } else {
          dateB = new Date();
        }
        
        return dateB - dateA;
      })
      .slice(0, limit)
      .map(asset => ({
        id: asset.id,
        name: asset.name,
        category: asset.category || '未分类',
        price: asset.price || 0,
        createTime: asset.createTime || asset.purchaseDate
      }));
  }
};

module.exports = statisticsUtil; 