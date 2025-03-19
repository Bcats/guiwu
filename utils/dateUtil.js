/**
 * 日期工具类
 * 提供各种日期格式化和计算功能
 */

const dateUtil = {
  /**
   * 格式化日期
   * @param {String|Date} date 日期对象或日期字符串
   * @param {String} format 格式化模板，默认'YYYY-MM-DD'
   * @returns {String} 格式化后的日期字符串
   */
  formatDate: function(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    let d;
    if (typeof date === 'string') {
      // 修复iOS兼容性问题，将'-'替换为'/'
      d = new Date(date.replace(/-/g, '/'));
    } else {
      d = date;
    }
    
    if (isNaN(d.getTime())) {
      return '';
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },
  
  /**
   * 计算两个日期之间的天数
   * @param {String|Date} startDate 开始日期
   * @param {String|Date} endDate 结束日期，默认为当前日期
   * @returns {Number} 天数差
   */
  daysBetween: function(startDate, endDate = new Date()) {
    if (!startDate) return 0;
    
    let start, end;
    
    // 处理iOS兼容性问题
    if (typeof startDate === 'string') {
      // 将'-'替换为'/'以兼容iOS
      start = new Date(startDate.replace(/-/g, '/'));
    } else {
      start = startDate;
    }
    
    if (typeof endDate === 'string') {
      // 将'-'替换为'/'以兼容iOS
      end = new Date(endDate.replace(/-/g, '/'));
    } else {
      end = endDate;
    }
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    // 转换为无时间的日期
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    // 计算毫秒差并转换为天数
    const diffTime = Math.abs(endDateOnly - startDateOnly);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  },
  
  /**
   * 计算使用时间的文本描述
   * @param {Date|String} purchaseDate 购买日期
   * @returns {String} 使用时间描述
   */
  getUsageDuration: function(purchaseDate) {
    if (!purchaseDate) return '';
    
    const days = this.daysBetween(purchaseDate);
    
    // 小于一个月
    if (days < 30) {
      return `${days}天`;
    }
    // 小于一年
    else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainDays = days % 30;
      return remainDays > 0 ? `${months}个月${remainDays}天` : `${months}个月`;
    }
    // 大于等于一年
    else {
      const years = Math.floor(days / 365);
      const remainDays = days % 365;
      const months = Math.floor(remainDays / 30);
      
      if (months > 0) {
        return `${years}年${months}个月`;
      } else {
        return `${years}年`;
      }
    }
  },
  
  /**
   * 获取保修状态
   * @param {String} warrantyDate 保修截止日期
   * @returns {Object} 包含状态和剩余天数的对象
   */
  getWarrantyStatus: function(warrantyDate) {
    if (!warrantyDate) {
      return { status: 'unknown', daysLeft: 0 };
    }
    
    // 处理iOS兼容性问题
    let warranty;
    if (typeof warrantyDate === 'string') {
      warranty = new Date(warrantyDate.replace(/-/g, '/'));
    } else {
      warranty = warrantyDate;
    }
    
    const today = new Date();
    
    if (isNaN(warranty.getTime())) {
      return { status: 'unknown', daysLeft: 0 };
    }
    
    // 保修已过期
    if (warranty < today) {
      return { 
        status: 'expired', 
        daysLeft: 0,
        expiredDays: this.daysBetween(warranty, today)
      };
    }
    
    // 计算剩余天数
    const daysLeft = this.daysBetween(today, warranty);
    
    // 即将过期 (30天内)
    if (daysLeft <= 30) {
      return { status: 'expiring', daysLeft };
    }
    
    // 保修有效
    return { status: 'valid', daysLeft };
  },
  
  /**
   * 计算保修进度百分比
   * @param {Date|String} purchaseDate 购买日期
   * @param {Date|String} warrantyExpire 保修到期日期
   * @returns {Number} 保修进度百分比（0-100）
   */
  calculateWarrantyProgress: function(purchaseDate, warrantyExpire) {
    if (!purchaseDate || !warrantyExpire) return 0;
    
    // 处理iOS兼容性问题
    let start, end;
    if (typeof purchaseDate === 'string') {
      start = new Date(purchaseDate.replace(/-/g, '/'));
    } else {
      start = purchaseDate;
    }
    
    if (typeof warrantyExpire === 'string') {
      end = new Date(warrantyExpire.replace(/-/g, '/'));
    } else {
      end = warrantyExpire;
    }
    
    const now = new Date();
    
    // 总天数
    const totalDays = this.daysBetween(start, end);
    if (totalDays <= 0) return 0;
    
    // 已经过去的天数
    const passedDays = this.daysBetween(start, now);
    
    // 如果已超过保修期
    if (passedDays > totalDays) return 100;
    
    // 计算百分比
    return Math.floor((passedDays / totalDays) * 100);
  },
  
  /**
   * 获取相对时间描述
   * @param {String|Date} date 日期
   * @returns {String} 相对时间描述
   */
  getRelativeTimeDesc: function(date) {
    if (!date) return '';
    
    // 处理iOS兼容性问题
    let d;
    if (typeof date === 'string') {
      d = new Date(date.replace(/-/g, '/'));
    } else {
      d = date;
    }
    
    if (isNaN(d.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffDays = this.daysBetween(d, now);
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}周前`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)}个月前`;
    } else {
      return `${Math.floor(diffDays / 365)}年前`;
    }
  },
  
  /**
   * 获取时间期间描述
   * @param {String|Date} date 日期
   * @returns {String} 使用时间描述，如"3年2个月"
   */
  getUsagePeriod: function(date) {
    if (!date) return '';
    
    // 处理iOS兼容性问题
    let d;
    if (typeof date === 'string') {
      d = new Date(date.replace(/-/g, '/'));
    } else {
      d = date;
    }
    
    if (isNaN(d.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffDays = this.daysBetween(d, now);
    
    if (diffDays < 1) {
      return '今天';
    }
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let result = '';
    
    if (years > 0) {
      result += `${years}年`;
    }
    
    if (months > 0 || (years > 0 && days > 0)) {
      result += `${months}个月`;
    }
    
    if (years === 0 && months === 0) {
      result = `${days}天`;
    } else if (years === 0 && days > 0) {
      result += `${days}天`;
    }
    
    return result;
  }
};

module.exports = dateUtil; 