/**
 * 日期工具类
 * 提供各种日期格式化和计算功能
 */

const dateUtil = {
  /**
   * 将日期字符串或Date对象转换为标准Date对象
   * @param {String|Date} date 日期对象或日期字符串
   * @returns {Date} 标准化的Date对象
   */
  parseDate: function(date) {
    if (!date) return null;
    
    let parsedDate;
    if (typeof date === 'string') {
      // 修复iOS兼容性问题，将'-'替换为'/'
      parsedDate = new Date(date.replace(/-/g, '/'));
    } else {
      parsedDate = date;
    }
    
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  },
  
  /**
   * 格式化日期
   * @param {String|Date} date 日期对象或日期字符串
   * @param {String} format 格式化模板，默认'YYYY-MM-DD'
   * @returns {String} 格式化后的日期字符串
   */
  formatDate: function(date, format = 'YYYY-MM-DD') {
    const d = this.parseDate(date);
    if (!d) return '';
    
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
   * 格式化日期字符串，适用于展示
   * @param {String} dateStr 日期字符串 
   * @returns {String} 格式化后的日期
   */
  formatDateString: function(dateStr) {
    return this.formatDate(dateStr, 'YYYY年MM月DD日');
  },
  
  /**
   * 计算两个日期之间的天数
   * @param {String|Date} startDate 开始日期
   * @param {String|Date} endDate 结束日期，默认为当前日期
   * @returns {Number} 天数差
   */
  daysBetween: function(startDate, endDate = new Date()) {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    
    if (!start || !end) return 0;
    
    // 将日期标准化为当天的0点，以确保当天内计算的天数相同
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    const diffTime = Math.abs(endDay - startDay);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    return diffDays;
  },
  
  /**
   * 计算使用时间的文本描述
   * @param {Date|String} purchaseDate 购买日期
   * @returns {String} 使用时间描述
   */
  getUsageDuration: function(purchaseDate) {
    const days = this.daysBetween(purchaseDate);
    if (!days) return '';
    
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
    const warranty = this.parseDate(warrantyDate);
    if (!warranty) {
      return { status: 'unknown', daysLeft: 0 };
    }
    
    const today = new Date();
    
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
    const start = this.parseDate(purchaseDate);
    const end = this.parseDate(warrantyExpire);
    
    if (!start || !end) return 0;
    
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
    const d = this.parseDate(date);
    if (!d) return '';
    
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
    const d = this.parseDate(date);
    if (!d) return '';
    
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