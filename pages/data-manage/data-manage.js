const app = getApp();
const { getTheme } = require('../../utils/theme');
const assetManager = require('../../utils/assetManager');
const cryptoUtil = require('../../utils/cryptoUtil');

Page({
  data: {
    theme: 'light',
    showClearConfirm: false,
    showPasswordDialog: false,
    dialogTitle: '',
    dialogDescription: '',
    dialogShowHint: true,
    exportAction: false, // true表示导出，false表示导入
    tempFilePath: '', // 临时文件路径，用于导入
    showDeleteConfirm: false, // 添加删除确认对话框标志
    deleteConfirmText: '', // 删除确认文本
  },

  onLoad: function () {
    this.setData({
      theme: getTheme()
    });
  },
  
  onShow: function () {
    this.setData({
      theme: getTheme()
    });
  },
  
  // 导出数据
  exportData: function() {
    this.setData({
      showPasswordDialog: true,
      dialogTitle: '设置加密密码',
      dialogDescription: '请输入用于导入/导出数据的密码',
      dialogShowHint: true,
      exportAction: true
    });
  },
  
  // 导入数据
  importData: function() {
    // 选择文件
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['wjbox'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFile = res.tempFiles[0];
          console.log('选择的文件:', tempFile);
          
          // 检查文件大小
          if (tempFile.size > 10 * 1024 * 1024) { // 10MB限制
            wx.showToast({
              title: '文件过大，请选择较小的文件',
              icon: 'none'
            });
            return;
          }
          
          // 保存临时文件路径
          this.setData({
            tempFilePath: tempFile.path,
            showPasswordDialog: true,
            dialogTitle: '输入解密密码',
            dialogDescription: '请输入导出时设置的加密密码',
            dialogShowHint: false,
            exportAction: false
          });
        }
      },
      fail: (err) => {
        console.error('选择文件失败:', err);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 显示清除数据确认
  showClearDataConfirm: function() {
    this.setData({
      showDeleteConfirm: true,
      deleteConfirmText: ''
    });
  },
  
  // 隐藏清除数据确认
  hideClearDataConfirm: function() {
    this.setData({
      showClearConfirm: false,
      showDeleteConfirm: false,
      deleteConfirmText: ''
    });
  },
  
  // 处理删除确认文本输入
  onDeleteConfirmInput: function(e) {
    this.setData({
      deleteConfirmText: e.detail.value
    });
  },
  
  // 确认删除操作
  confirmDelete: function() {
    if (this.data.deleteConfirmText !== '删除') {
      wx.showToast({
        title: '请输入"删除"以确认',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showDeleteConfirm: false
    });
    
    // 直接调用清除数据函数，不再显示第二个确认弹窗
    this.clearAllData();
  },
  
  // 阻止点击穿透
  preventTap: function(e) {
    // 阻止事件冒泡
    return;
  },
  
  // 清除所有数据
  clearAllData: function() {
    wx.showLoading({
      title: '正在清除...'
    });
    
    // 清除资产数据
    wx.removeStorageSync('assets');
    
    this.setData({
      showClearConfirm: false
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '数据已清除',
        icon: 'success'
      });
      
      // 通知首页刷新
      if (app.globalData) {
        app.globalData.needRefresh = true;
      }
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 800);
  },
  
  // 密码对话框确认
  onPasswordConfirm: function(e) {
    const password = e.detail.password;
    this.setData({ showPasswordDialog: false });
    
    if (this.data.exportAction) {
      // 执行导出操作
      this.performExport(password);
    } else {
      // 执行导入操作
      this.performImport(password);
    }
  },
  
  // 密码对话框取消
  onPasswordCancel: function() {
    this.setData({
      showPasswordDialog: false,
      tempFilePath: ''
    });
  },
  
  // 执行导出操作
  performExport: function(password) {
    wx.showLoading({
      title: '正在导出...',
      mask: true
    });
    
    try {
      // 获取所有资产数据
      const assets = assetManager.getAllAssets();
      
      // 构建要加密的数据对象
      const dataToExport = {
        assets: assets,
        exportTime: new Date().toISOString(),
        appVersion: app.globalData.versionInfo.version || '1.0.0'
      };
      
      // 加密数据
      const encryptedContent = cryptoUtil.encryptData(dataToExport, password);
      
      // 生成临时文件名
      const now = new Date();
      const timestamp = now.getFullYear() + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0') + 
                      String(now.getHours()).padStart(2, '0') + 
                      String(now.getMinutes()).padStart(2, '0');
      const fileName = `物记盒子数据备份_${timestamp}.wjbox`;
      
      // 将加密内容写入临时文件
      const fs = wx.getFileSystemManager();
      const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      
      fs.writeFileSync(
        tempFilePath,
        encryptedContent,
        'utf8'
      );
      
      wx.hideLoading();
      
      // 显示分享选项
      wx.showModal({
        title: '导出成功',
        content: '文件已生成，是否分享到文件传输助手？',
        confirmText: '分享',
        cancelText: '关闭',
        success: (res) => {
          if (res.confirm) {
            // 直接分享到文件传输助手
            wx.shareFileMessage({
              filePath: tempFilePath,
              success: () => {
                wx.showToast({
                  title: '分享成功',
                  icon: 'success'
                });
              },
              fail: (err) => {
                console.error('分享文件失败:', err);
                // 尝试打开文件让用户手动分享
                wx.openDocument({
                  filePath: tempFilePath,
                  fileType: 'wjbox',
                  showMenu: true,
                  success: () => {
                    console.log('打开文档成功，请手动分享');
                    wx.showToast({
                      title: '请点击右上角分享到文件传输助手',
                      icon: 'none',
                      duration: 3000
                    });
                  },
                  fail: (err) => {
                    console.error('打开文件失败:', err);
                    let errorMsg = '无法打开文件，分享失败';
                    if (err && err.errMsg) {
                      errorMsg += '\n错误信息: ' + err.errMsg;
                    }
                    wx.showModal({
                      title: '分享失败',
                      content: errorMsg,
                      showCancel: false
                    });
                  }
                });
              }
            });
          }
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('导出失败:', error);
      wx.showModal({
        title: '导出失败',
        content: error.message || '未知错误',
        showCancel: false
      });
    }
  },
  
  // 执行导入操作
  performImport: function(password) {
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '未选择文件',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '正在导入...',
      mask: true
    });
    
    try {
      // 读取文件内容
      const fs = wx.getFileSystemManager();
      let fileContent;
      
      try {
        fileContent = fs.readFileSync(this.data.tempFilePath, 'utf8');
      } catch (readError) {
        console.error('读取文件失败:', readError);
        wx.hideLoading();
        wx.showModal({
          title: '读取文件失败',
          content: readError.errMsg || '未知错误',
          showCancel: false
        });
        return;
      }
      
      // 验证文件格式
      if (!cryptoUtil.validateEncryptedFile(fileContent)) {
        throw new Error('文件格式不正确或已损坏');
      }
      
      // 解密数据
      let decryptedData;
      try {
        decryptedData = cryptoUtil.decryptData(fileContent, password);
      } catch (decryptError) {
        console.error('解密失败:', decryptError);
        throw new Error(decryptError.message || '解密失败，请检查密码是否正确');
      }
      
      // 检查数据有效性
      if (!decryptedData || !decryptedData.assets || !Array.isArray(decryptedData.assets)) {
        throw new Error('导入的数据格式不正确或不完整');
      }
      
      // 显示确认对话框
      wx.hideLoading();
      wx.showModal({
        title: '增量导入确认',
        content: `将导入${decryptedData.assets.length}条资产记录，相同ID的资产将被更新，新资产将被添加，是否继续？`,
        success: (res) => {
          if (res.confirm) {
            // 确认导入
            this.confirmImport(decryptedData.assets);
          }
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('导入失败:', error);
      
      // 提供更详细的错误信息
      let errorMessage = '导入失败';
      if (error.message) {
        if (error.message.includes('JSON')) {
          errorMessage = '文件解析失败，可能已损坏或格式不兼容';
        } else if (error.message.includes('解密失败')) {
          errorMessage = '解密失败，请检查密码是否正确';
        } else {
          errorMessage = error.message;
        }
      }
      
      wx.showModal({
        title: '导入失败',
        content: errorMessage,
        showCancel: false
      });
    } finally {
      this.setData({
        tempFilePath: ''
      });
    }
  },
  
  // 确认导入数据
  confirmImport: function(importedAssets) {
    wx.showLoading({
      title: '正在合并数据...',
      mask: true
    });
    
    try {
      // 获取现有资产数据
      const existingAssets = assetManager.getAllAssets();
      
      // 创建ID到现有资产的映射，用于快速查找
      const existingAssetsMap = {};
      existingAssets.forEach(asset => {
        existingAssetsMap[asset.id] = asset;
      });
      
      // 计数器
      let addedCount = 0;
      let updatedCount = 0;
      
      // 处理导入的资产
      importedAssets.forEach(importedAsset => {
        if (existingAssetsMap[importedAsset.id]) {
          // 资产已存在，更新它
          delete existingAssetsMap[importedAsset.id]; // 从映射中移除，稍后会重新添加合并后的资产
          updatedCount++;
        } else {
          // 新资产，直接添加
          addedCount++;
        }
      });
      
      // 构建合并后的资产列表
      // 首先添加所有导入的资产（包括更新的和新增的）
      const mergedAssets = [...importedAssets];
      
      // 然后添加所有未被更新的现有资产
      Object.values(existingAssetsMap).forEach(asset => {
        mergedAssets.push(asset);
      });
      
      // 保存合并后的资产数据
      wx.setStorageSync('assets', mergedAssets);
      
      wx.hideLoading();
      wx.showToast({
        title: '导入成功',
        icon: 'success'
      });
      
      // 显示导入结果统计
      setTimeout(() => {
        wx.showModal({
          title: '导入完成',
          content: `成功合并数据：\n新增资产 ${addedCount} 条\n更新资产 ${updatedCount} 条`,
          showCancel: false,
          success: () => {
            // 更新首页显示
            if (app.globalData) {
              app.globalData.needRefresh = true;
            }
            
            // 返回上一页
            wx.navigateBack();
          }
        });
      }, 1000);
    } catch (error) {
      wx.hideLoading();
      console.error('合并数据失败:', error);
      wx.showModal({
        title: '导入失败',
        content: '合并数据时发生错误',
        showCancel: false
      });
    }
  }
}); 