/**
 * 获取资产统计信息
 * @returns {Object} 资产统计对象
 */
function getAssetStats() {
  try {
    // 获取所有资产
    const assets = wx.getStorageSync('assets') || [];
    
    if (assets.length === 0) {
      return {
        totalValue: 0,
        assetCount: 0,
        dailyAverage: 0,
        categories: {}
      };
    }
    
    // 计算总价值
    let totalValue = 0;
    const categories = {};
    const today = new Date();
    
    // 遍历所有资产
    assets.forEach(asset => {
      totalValue += parseFloat(asset.price) || 0;
      
      // 统计分类
      if (asset.category) {
        if (!categories[asset.category]) {
          categories[asset.category] = {
            count: 0,
            value: 0
          };
        }
        categories[asset.category].count += 1;
        categories[asset.category].value += parseFloat(asset.price) || 0;
      }
    });
    
    // 计算日均成本（假设资产使用3年）
    const dailyAverage = totalValue / (365 * 3);
    
    return {
      totalValue: totalValue,
      assetCount: assets.length,
      dailyAverage: dailyAverage,
      categories: categories
    };
    
  } catch (e) {
    console.error('获取资产统计失败', e);
    return {
      totalValue: 0,
      assetCount: 0,
      dailyAverage: 0,
      categories: {}
    };
  }
}

/**
 * 获取资产分类统计
 * @returns {Array} 分类统计数组
 */
function getCategoryStats() {
  try {
    const stats = getAssetStats();
    const categories = stats.categories;
    const totalValue = stats.totalValue;
    
    // 转换为数组格式
    const result = [];
    for (const category in categories) {
      result.push({
        name: category,
        count: categories[category].count,
        value: categories[category].value,
        percent: totalValue > 0 ? (categories[category].value / totalValue * 100).toFixed(1) : 0
      });
    }
    
    // 按价值排序
    result.sort((a, b) => b.value - a.value);
    
    return result;
  } catch (e) {
    console.error('获取资产分类统计失败', e);
    return [];
  }
}

/**
 * 获取最常用资产排行
 * @param {Number} limit 限制返回数量
 * @returns {Array} 资产排行数组
 */
function getMostUsedAssets(limit = 5) {
  try {
    const assets = wx.getStorageSync('assets') || [];
    
    // 按使用频率排序（示例使用，实际应用中可能需要记录使用次数）
    // 这里简单假设使用时间越长的资产越常用
    const sortedAssets = [...assets].sort((a, b) => {
      const aPurchaseDate = a.purchaseDate ? new Date(a.purchaseDate) : new Date();
      const bPurchaseDate = b.purchaseDate ? new Date(b.purchaseDate) : new Date();
      return aPurchaseDate - bPurchaseDate;
    });
    
    // 返回前N个资产
    return sortedAssets.slice(0, limit);
  } catch (e) {
    console.error('获取最常用资产失败', e);
    return [];
  }
}

/**
 * 获取最近添加的资产
 * @param {Number} limit 限制返回数量
 * @returns {Array} 资产数组
 */
function getRecentAssets(limit = 5) {
  try {
    const assets = wx.getStorageSync('assets') || [];
    
    // 按添加时间排序
    const sortedAssets = [...assets].sort((a, b) => {
      const aAddTime = a.addTime ? new Date(a.addTime) : new Date();
      const bAddTime = b.addTime ? new Date(b.addTime) : new Date();
      return bAddTime - aAddTime; // 降序，最新的在前面
    });
    
    // 返回前N个资产
    return sortedAssets.slice(0, limit);
  } catch (e) {
    console.error('获取最近添加资产失败', e);
    return [];
  }
}

/**
 * 获取资产类别颜色
 * @param {String} category 资产类别
 * @returns {String} 颜色代码
 */
function getCategoryColor(category) {
  const colorMap = {
    '电子': 'var(--card-electronic)',
    '家具': 'var(--card-furniture)',
    '交通': 'var(--card-transport)',
    '娱乐': 'var(--card-entertainment)',
    '其他': 'var(--card-other)'
  };
  
  return colorMap[category] || 'var(--card-other)';
}

/**
 * 格式化货币显示
 * @param {Number} amount 金额
 * @returns {String} 格式化后的金额字符串
 */
function formatCurrency(amount) {
  return parseFloat(amount).toFixed(2);
}

/**
 * 按类别获取资产
 * @param {String} category 资产类别
 * @returns {Array} 资产数组
 */
function getAssetsByCategory(category) {
  try {
    const assets = wx.getStorageSync('assets') || [];
    
    if (!category) return assets;
    
    return assets.filter(asset => asset.category === category);
  } catch (e) {
    console.error('按类别获取资产失败', e);
    return [];
  }
}

module.exports = {
  getAssetStats,
  getCategoryStats,
  getMostUsedAssets,
  getRecentAssets,
  getCategoryColor,
  formatCurrency,
  getAssetsByCategory
}; 