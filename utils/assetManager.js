/**
 * 资产管理工具类
 * 提供资产的增删改查等功能
 */

// 避免循环引用
let statisticsUtil = null;

// 确保在使用时导入statisticsUtil
function getStatisticsUtil() {
  if (!statisticsUtil) {
    statisticsUtil = require('./statisticsUtil');
  }
  return statisticsUtil;
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  // 使用时间戳和随机数组合生成唯一ID
  return 'asset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

const assetManager = {
  /**
   * 获取所有资产列表
   * @returns {Array} 资产列表
   */
  getAllAssets: function() {
    try {
      console.log('assetManager.getAllAssets() 被调用');
      const assets = wx.getStorageSync('assets') || [];
      console.log('从存储获取到', assets.length, '个资产', assets);
      return assets;
    } catch (e) {
      console.error('获取资产数据失败:', e);
      return [];
    }
  },

  /**
   * 根据ID获取资产
   * @param {String} id 资产ID
   * @returns {Object|null} 资产对象或null
   */
  getAssetById: function(id) {
    try {
      const assets = this.getAllAssets();
      return assets.find(asset => asset.id === id) || null;
    } catch (error) {
      console.error('获取资产详情失败', error);
      return null;
    }
  },

  /**
   * 添加资产
   * @param {Object} asset 资产对象
   * @returns {Boolean} 是否添加成功
   */
  addAsset: function(asset) {
    try {
      console.log('保存资产:', asset);
      // 确保使用次数是数字类型
      asset.usageCount = parseInt(asset.usageCount || 0);
      
      const assets = this.getAllAssets();
      const index = assets.findIndex(item => item.id === asset.id);
      
      if (index > -1) {
        // 更新现有资产
        assets[index] = asset;
      } else {
        // 添加新资产，生成ID
        if (!asset.id) {
          asset.id = generateId();
        }
        // 添加创建时间字段，如果不存在
        if (!asset.createTime) {
          asset.createTime = new Date().toISOString();
        }
        assets.unshift(asset); // 添加到数组开头
      }
      
      wx.setStorageSync('assets', assets);
      console.log('资产保存成功，使用次数:', asset.usageCount);
      
      // 清除统计缓存
      const stats = getStatisticsUtil();
      if (stats) {
        stats.clearCache();
      }
      
      return true;
    } catch (e) {
      console.error('保存资产失败:', e);
      return false;
    }
  },

  /**
   * 更新资产
   * @param {Object} asset 更新后的资产对象
   * @returns {Boolean} 是否更新成功
   */
  updateAsset: function(asset) {
    try {
      const assets = this.getAllAssets();
      const index = assets.findIndex(item => item.id === asset.id);
      if (index !== -1) {
        // 只保留原有的创建时间
        asset.createTime = assets[index].createTime;
        // 确保使用次数是数字类型
        asset.usageCount = parseInt(asset.usageCount || 0);
        // 更新修改时间
        asset.updateTime = new Date().toISOString();
        assets[index] = asset;
        wx.setStorageSync('assets', assets);
        console.log('资产更新成功，使用次数:', asset.usageCount);
        
        // 清除统计缓存
        const stats = getStatisticsUtil();
        if (stats) {
          stats.clearCache();
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新资产失败', error);
      return false;
    }
  },

  /**
   * 删除资产
   * @param {String} id 资产ID
   * @returns {Boolean} 是否删除成功
   */
  deleteAsset: function(id) {
    try {
      const assets = this.getAllAssets();
      const newAssets = assets.filter(asset => asset.id !== id);
      if (newAssets.length !== assets.length) {
        wx.setStorageSync('assets', newAssets);
        
        // 清除统计缓存
        const stats = getStatisticsUtil();
        if (stats) {
          stats.clearCache();
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除资产失败', error);
      return false;
    }
  },

  /**
   * 更新资产使用次数
   * @param {String} id 资产ID
   * @returns {Boolean} 是否更新成功
   */
  incrementUsageCount: function(id) {
    try {
      const assets = this.getAllAssets();
      const index = assets.findIndex(asset => asset.id === id);
      if (index !== -1) {
        assets[index].usageCount = (assets[index].usageCount || 0) + 1;
        assets[index].lastUsageTime = new Date().toISOString();
        wx.setStorageSync('assets', assets);
        
        // 清除统计缓存
        const stats = getStatisticsUtil();
        if (stats) {
          stats.clearCache();
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新使用次数失败', error);
      return false;
    }
  },

  /**
   * 更新资产使用统计
   * @param {String} id 资产ID
   * @returns {Boolean} 是否更新成功
   */
  updateUsageCount: function(id) {
    return this.incrementUsageCount(id);
  },

  /**
   * 获取所有资产分类
   * @returns {Array} 分类列表
   */
  getCategories: function() {
    try {
      const assets = this.getAllAssets();
      // 从资产中提取所有分类
      const categories = [...new Set(assets.map(asset => asset.category || '未分类'))];
      console.log('获取到分类:', categories);
      return categories;
    } catch (e) {
      console.error('获取分类失败:', e);
      return ['未分类'];
    }
  },

  /**
   * 获取资产总价值
   * @returns {Number} 总价值
   */
  getTotalValue: function() {
    try {
      const assets = this.getAllAssets();
      return assets.reduce((total, asset) => total + (Number(asset.price) || 0), 0);
    } catch (error) {
      console.error('计算总价值失败', error);
      return 0;
    }
  },

  /**
   * 获取资产统计数据
   * @returns {Object} 统计数据对象，包含总数和总价值
   */
  getStats: function() {
    const assets = this.getAllAssets();
    let totalValue = 0;
    
    assets.forEach(asset => {
      totalValue += Number(asset.price) || 0;
    });
    
    return {
      totalCount: assets.length,
      totalValue: totalValue
    };
  },

  /**
   * 获取即将到期的资产列表
   * @param {Number} days 天数，默认为30天
   * @returns {Array} 即将到期的资产列表
   */
  getExpiringAssets: function(days = 30) {
    try {
      const assets = this.getAllAssets();
      const now = new Date();
      // 未来days天的日期
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);
      
      return assets.filter(asset => {
        if (!asset.warrantyExpire) return false;
        const expireDate = new Date(asset.warrantyExpire);
        return expireDate >= now && expireDate <= futureDate;
      });
    } catch (error) {
      console.error('获取即将到期资产失败', error);
      return [];
    }
  },

  /**
   * 清空所有资产数据
   * @returns {Boolean} 是否清空成功
   */
  clearAllAssets: function() {
    try {
      wx.setStorageSync('assets', []);
      return true;
    } catch (error) {
      console.error('清空资产数据失败', error);
      return false;
    }
  },

  /**
   * 导出资产数据为JSON字符串
   * @returns {String} JSON字符串
   */
  exportAssets: function() {
    try {
      const assets = this.getAllAssets();
      return JSON.stringify(assets);
    } catch (error) {
      console.error('导出资产数据失败', error);
      return '';
    }
  },

  /**
   * 导入资产数据
   * @param {String} jsonString JSON字符串
   * @returns {Boolean} 是否导入成功
   */
  importAssets: function(jsonString) {
    try {
      const assets = JSON.parse(jsonString);
      if (Array.isArray(assets)) {
        wx.setStorageSync('assets', assets);
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入资产数据失败', error);
      return false;
    }
  }
};

module.exports = assetManager; 