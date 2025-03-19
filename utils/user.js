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
  return !!getUserInfo();
}

/**
 * 获取用户头像
 * @returns {string} 用户头像URL，未登录时返回默认头像
 */
function getUserAvatar() {
  const userInfo = getUserInfo();
  return userInfo && userInfo.avatarUrl ? userInfo.avatarUrl : '/static/default-avatar.png';
}

/**
 * 获取用户昵称
 * @returns {string} 用户昵称，未登录时返回默认值
 */
function getUserNickname() {
  const userInfo = getUserInfo();
  return userInfo && userInfo.nickName ? userInfo.nickName : '未登录用户';
}

module.exports = {
  getUserInfo,
  saveUserInfo,
  userLogout,
  isUserLoggedIn,
  getUserAvatar,
  getUserNickname
}; 