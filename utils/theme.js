// utils/theme.js

// 默认主题
const DEFAULT_THEME = 'light';
// 主题色方案
const THEME_COLORS = {
  blue: '#4A90E2',
  green: '#4CD964',
  purple: '#AF52DE',
  orange: '#FF9500',
  red: '#FF3B30'
};

// 默认主题色
const DEFAULT_COLOR = 'green';

/**
 * 获取当前主题模式（亮色/暗色）
 * @returns {string} 主题模式，'light'或'dark'
 */
function getTheme() {
  try {
    const theme = wx.getStorageSync('theme');
    return theme || DEFAULT_THEME;
  } catch (e) {
    console.error('获取主题设置失败', e);
    return DEFAULT_THEME;
  }
}

/**
 * 设置主题模式（亮色/暗色）
 * @param {string} theme 主题模式，'light'或'dark'
 * @returns {boolean} 设置是否成功
 */
function setTheme(theme) {
  try {
    if (theme !== 'light' && theme !== 'dark') {
      theme = DEFAULT_THEME;
    }
    wx.setStorageSync('theme', theme);
    return true;
  } catch (e) {
    console.error('设置主题失败', e);
    return false;
  }
}

/**
 * 获取当前主题色
 * @returns {string} 主题色代码
 */
function getThemeColor() {
  try {
    const colorKey = wx.getStorageSync('themeColor');
    return THEME_COLORS[colorKey] || THEME_COLORS[DEFAULT_COLOR];
  } catch (e) {
    console.error('获取主题色失败', e);
    return THEME_COLORS[DEFAULT_COLOR];
  }
}

/**
 * 设置主题色
 * @param {string} colorKey 主题色键名
 * @returns {boolean} 设置是否成功
 */
function setThemeColor(colorKey) {
  try {
    if (!THEME_COLORS[colorKey]) {
      colorKey = DEFAULT_COLOR;
    }
    wx.setStorageSync('themeColor', colorKey);
    return true;
  } catch (e) {
    console.error('设置主题色失败', e);
    return false;
  }
}

/**
 * 获取所有可用主题色
 * @returns {Object} 主题色对象
 */
function getAllThemeColors() {
  return THEME_COLORS;
}

module.exports = {
  getTheme,
  setTheme,
  getThemeColor,
  setThemeColor,
  getAllThemeColors,
  DEFAULT_THEME,
  DEFAULT_COLOR,
  THEME_COLORS
}; 