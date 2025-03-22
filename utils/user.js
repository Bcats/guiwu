/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象，未登录时返回null
 */
function getUserInfo() {
  try {
    const userInfo = wx.getStorageSync('userInfo');
    return userInfo || null;
  } catch (e) {
    console.error('获取用户信息失败', e);
    return null;
  }
}

/**
 * 保存用户信息
 * @param {Object} userInfo 用户信息对象
 * @returns {boolean} 保存是否成功
 */
function saveUserInfo(userInfo) {
  try {
    if (!userInfo) return false;
    wx.setStorageSync('userInfo', userInfo);
    return true;
  } catch (e) {
    console.error('保存用户信息失败', e);
    return false;
  }
}

/**
 * 用户退出登录
 * @returns {boolean} 退出登录是否成功
 */
function userLogout() {
  try {
    wx.removeStorageSync('userInfo');
    return true;
  } catch (e) {
    console.error('退出登录失败', e);
    return false;
  }
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function isUserLoggedIn() {
  const userInfo = getUserInfo();
  return !!userInfo && userInfo.nickName !== '游客' && userInfo.nickName !== '未登录';
}

/**
 * 获取用户头像
 * @returns {string} 用户头像URL，未登录时返回默认头像
 */
function getUserAvatar() {
  const userInfo = getUserInfo();
  return userInfo && userInfo.avatarUrl ? userInfo.avatarUrl : '/static/images/default-avatar.png';
}

/**
 * 获取用户昵称
 * @returns {string} 用户昵称，未登录时返回默认值
 */
function getUserNickname() {
  const userInfo = getUserInfo();
  return userInfo && userInfo.nickName ? userInfo.nickName : '未登录用户';
}

/**
 * 微信登录
 * @param {Object} options 登录选项
 * @param {string} options.desc 获取用户信息的目的描述
 * @param {Function} options.success 成功回调
 * @param {Function} options.fail 失败回调
 * @returns {Promise} 登录结果Promise
 */
function wxLogin(options = {}) {
  return new Promise((resolve, reject) => {
    // 使用微信提供的getUserProfile接口获取用户信息
    wx.getUserProfile({
      desc: options.desc || '用于完善会员资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        // 获取用户信息
        const userInfo = res.userInfo;
        
        // 生成随机用户ID
        const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
        const userId = `user_${randomSuffix}`;
        
        // 添加用户ID
        userInfo.userId = userId;
        
        // 保存到本地存储
        saveUserInfo(userInfo);
        
        // 执行成功回调
        if (typeof options.success === 'function') {
          options.success(userInfo);
        }
        
        resolve(userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        
        // 执行失败回调
        if (typeof options.fail === 'function') {
          options.fail(err);
        }
        
        reject(err);
      }
    });
  });
}

module.exports = {
  getUserInfo,
  saveUserInfo,
  userLogout,
  isUserLoggedIn,
  getUserAvatar,
  getUserNickname,
  wxLogin
}; 