// add.js
const app = getApp();
const assetManager = require('../../utils/assetManager');
const dateUtil = require('../../utils/dateUtil');

Page({
  data: {
    // 页面类型：add - 添加，edit - 编辑
    pageType: 'add',
    // 资产对象
    asset: {
      id: '',
      name: '',
      price: '',
      category: '',
      purchaseDate: dateUtil.formatDate(new Date()),
      warrantyDate: '',
      description: '',
      status: '使用中', // 默认状态
      expectedDailyCost: '',
      targetDate: '',
      additionalCost: '',
      usageCount: 0, // 使用次数
    },
    // 编辑前的资产对象（用于取消编辑时恢复）
    originalAsset: {},
    // 分类选项
    categories: [
      '电子产品', '家具', '交通工具', '娱乐', '服饰', 
      '厨房', '工具', '珠宝', '书籍', '其他'
    ],
    // 状态选项 - 简化为两个状态
    statusOptions: ['使用中', '停用'],
    // 状态开关 - true表示使用中，false表示停用
    statusActive: true,
    // 是否显示分类选择器
    showCategoryPicker: false,
    // 主题
    theme: 'light',
    // 是否需要刷新
    needRefresh: false,
    isEditing: false,
    // 资产信息
    id: null, // 编辑模式下的资产ID
    name: '', // 资产名称
    price: '', // 购买价格
    categoryId: '', // 分类ID
    categoryText: '', // 分类文本
    purchaseDate: '', // 购买日期
    warrantyDate: '', // 保修日期
    description: '', // 备注描述
    usageCount: 0, // 使用次数
    tempImagePaths: [], // 临时图片路径数组
    selectedIcon: '', // 选中的图标
    iconName: '', // 选中的图标名称
    // 选择器状态
    showIconPicker: false,
    // 分类列表
    categoryList: [
      { id: 1, name: '电子数码' },
      { id: 2, name: '家居家电' },
      { id: 3, name: '服装配饰' },
      { id: 4, name: '珠宝首饰' },
      { id: 5, name: '书籍文具' },
      { id: 6, name: '运动户外' },
      { id: 7, name: '交通工具' },
      { id: 8, name: '收藏品' },
      { id: 9, name: '其他' }
    ],
    // 编辑模式
    isEditMode: false,
    // 新增数据
    assetName: '',
    assetPrice: '',
    category: '',
    warranties: '',
    remark: '',
    iconClass: 'fa-cube',  // 默认图标
    statusText: '',
    tempFiles: [],
    imageList: [],
    currentCategory: 'electronic', // 默认图标分类
    selectedColor: 'blue',      // 默认图标颜色
    showIcons: false,
    iconAnimating: false,
  },

  onLoad: function(options) {
    // 设置主题
    this.setData({
      theme: app.getTheme()
    });
    
    // 判断是添加还是编辑
    if (options.id) {
      // 编辑模式
      this.setData({ pageType: 'edit' });
      
      // 获取资产数据
      const asset = assetManager.getAssetById(options.id);
      if (asset) {
        // 保存原始资产数据
        this.setData({
          asset: asset,
          originalAsset: { ...asset },
          isEditing: true,
          id: options.id,
          isEditMode: true
        });
        this.loadAssetData(options.id);
      } else {
        wx.showToast({
          title: '资产不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }else{
      // 设置默认日期为今天
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // 设置默认分类为"其他"
      const otherCategory = this.data.categoryList.find(c => c.name === '其他');
      
      this.setData({
        purchaseDate: formattedDate,
        categoryId: otherCategory.id,
        categoryText: otherCategory.name,
        statusActive: true // 默认状态为"使用中"
      });
    }
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.pageType === 'add' ? '添加资产' : '编辑资产'
    });

  },
  
  // 加载资产数据（编辑模式）
  loadAssetData: function(id) {
    const asset = assetManager.getAssetById(id);
    
    if (asset) {
      console.log('setData', asset);
      // 根据资产的iconClass确定图标类别
      let currentCategory = 'other';
      if (asset.iconClass) {
        if (asset.iconClass.includes('mobile') || asset.iconClass.includes('laptop') || 
            asset.iconClass.includes('desktop') || asset.iconClass.includes('tv') ||
            asset.iconClass.includes('camera') || asset.iconClass.includes('headphones') ||
            asset.iconClass.includes('keyboard') || asset.iconClass.includes('mouse') ||
            asset.iconClass.includes('tablet') || asset.iconClass.includes('watch')) {
          currentCategory = 'electronic';
        } else if (asset.iconClass.includes('couch') || asset.iconClass.includes('bed') ||
                  asset.iconClass.includes('chair') || asset.iconClass.includes('table') ||
                  asset.iconClass.includes('bath') || asset.iconClass.includes('lightbulb')) {
          currentCategory = 'furniture';
        } else if (asset.iconClass.includes('car') || asset.iconClass.includes('bicycle') ||
                  asset.iconClass.includes('motorcycle') || asset.iconClass.includes('bus') ||
                  asset.iconClass.includes('plane') || asset.iconClass.includes('train')) {
          currentCategory = 'transport';
        } else if (asset.iconClass.includes('gamepad') || asset.iconClass.includes('dice') ||
                  asset.iconClass.includes('chess') || asset.iconClass.includes('bowling')) {
          currentCategory = 'entertainment';
        } else if (asset.iconClass.includes('tshirt') || asset.iconClass.includes('hat') ||
                  asset.iconClass.includes('socks') || asset.iconClass.includes('shoe')) {
          currentCategory = 'clothing';
        } else if (asset.iconClass.includes('blender') || asset.iconClass.includes('coffee') ||
                  asset.iconClass.includes('mug') || asset.iconClass.includes('utensils')) {
          currentCategory = 'kitchen';
        }
      }

      // 确定状态开关状态
      let statusActive = asset.status === '使用中';
      
      // 确保使用次数是整数
      const usageCount = parseInt(asset.usageCount || 0);
      console.log('加载使用次数:', usageCount);

      this.setData({
        name: asset.name,
        price: asset.price,
        categoryId: asset.category || '',
        categoryText: asset.category || '',
        purchaseDate: asset.purchaseDate,
        warrantyDate: asset.warrantyDate || '',
        description: asset.description || '',
        'asset.name': asset.name,
        'asset.price': asset.price,
        'asset.category': asset.category,
        'asset.purchaseDate': asset.purchaseDate,
        'asset.warrantyDate': asset.warrantyDate,
        'asset.description': asset.description,
        'asset.status': asset.status || '使用中',
        'asset.targetDate': asset.targetDate || '',
        'asset.additionalCost': asset.additionalCost || '',
        'asset.id': asset.id,
        assetName: asset.name,
        assetPrice: asset.price,
        warranties: asset.warranty,
        remark: asset.remark,
        iconClass: asset.iconClass || 'fa-cube',
        selectedColor: asset.iconColor || 'blue',
        tempImagePaths: asset.imagePaths,
        statusText: asset.status,
        statusActive: statusActive,
        iconName: asset.iconName || '',
        currentCategory: currentCategory,
        usageCount: usageCount,
        'asset.usageCount': usageCount
      });
    }
  },
  
  // 页面卸载时设置全局数据，通知首页需要刷新
  onUnload: function() {
    if (this.data.needRefresh) {
      console.log('添加/编辑资产页面卸载，需要刷新首页');
      // 获取首页实例并刷新
      const pages = getCurrentPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.route === 'pages/index/index') {
          // 直接调用首页的loadAssets方法刷新数据
          page.loadAssets();
          console.log('已通知首页刷新');
          break;
        }
      }
    }
  },
  
  // 绑定输入框变化
  bindKeyInput: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    // 特殊处理使用次数字段，确保只能输入数字
    if (field === 'usageCount') {
      // 去除非数字字符
      const numericValue = value.replace(/[^\d]/g, '');
      // 转为数字，确保保存的是数字类型
      const numValue = numericValue === '' ? 0 : parseInt(numericValue);
      
      this.setData({
        usageCount: numValue,
        'asset.usageCount': numValue
      });
      return;
    }
    
    // 其他字段的常规处理
    this.setData({
      [field]: value
    });

    // 同时更新asset对象中对应的字段（如果需要）
    if (field === 'name' || field === 'price' || field === 'description') {
      this.setData({
        [`asset.${field}`]: value
      });
    }
  },
  
  // 输入框内容变化处理函数 - 这个函数可以删除，统一使用bindKeyInput
  onInputChange: function(e) {
    // 调用bindKeyInput来保持一致性
    this.bindKeyInput(e);
  },
  
  // 显示分类选择器
  showCategoryPicker: function() {
    this.setData({
      showCategoryPicker: true
    });
  },
  
  // 隐藏分类选择器
  hideCategoryPicker: function() {
    this.setData({
      showCategoryPicker: false
    });
  },
  
  // 选择分类
  selectCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    // 检查是否为资产分类对象
    if (category && category.id) {
      this.selectAssetCategory(e);
    } else {
      // 否则认为是图标分类
      this.selectIconCategory(e);
    }
  },
  
  // 切换资产状态（开关）
  toggleStatus: function(e) {
    const statusActive = e.detail.value;
    const status = statusActive ? '使用中' : '停用';
    
    this.setData({
      statusActive: statusActive,
      'asset.status': status
    });
  },
  
  // 选择购买日期
  onPurchaseDateChange: function(e) {
    this.setData({
      'asset.purchaseDate': e.detail.value
    });
  },
  
  // 选择保修到期日期
  onWarrantyDateChange: function(e) {
    this.setData({
      'asset.warrantyDate': e.detail.value
    });
  },
  
  // 增加使用次数
  increaseUsageCount: function() {
    let count = parseInt(this.data.usageCount || 0);
    count++;
    
    console.log('增加使用次数:', count);
    this.setData({
      usageCount: count,
      'asset.usageCount': count
    });
  },
  
  // 减少使用次数
  decreaseUsageCount: function() {
    let count = parseInt(this.data.usageCount || 0);
    if (count > 0) {
      count--;
      
      console.log('减少使用次数:', count);
      this.setData({
        usageCount: count,
        'asset.usageCount': count
      });
    }
  },
  
  // 选择图片
  chooseImage: function() {
    const currentCount = this.data.tempImagePaths ? this.data.tempImagePaths.length : 0;
    const remaining = 9 - currentCount;
    
    if (remaining <= 0) {
      wx.showToast({
        title: '最多只能上传9张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 合并已有图片和新选择的图片
        const newImagePaths = res.tempFilePaths;
        const allImagePaths = this.data.tempImagePaths ? [...this.data.tempImagePaths, ...newImagePaths] : [...newImagePaths];
        
        this.setData({
          tempImagePaths: allImagePaths
        });
      }
    });
  },
  
  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const tempImagePaths = this.data.tempImagePaths;
    
    // 从数组中移除指定索引的图片
    tempImagePaths.splice(index, 1);
    
    this.setData({
      tempImagePaths: tempImagePaths
    });
  },
  
  // 绑定日期选择器变化
  bindDateChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    // 更新字段值
    this.setData({
      [field]: value
    });
    
    // 同时更新asset对象中对应的字段
    this.setData({
      [`asset.${field}`]: value
    });
  },
  
  // 显示图标选择器
  showIconPicker: function() {
    this.setData({
      showIcons: true
    });
    // 禁用页面滚动
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
  },
  
  // 关闭图标选择器
  closeIconPicker: function() {
    this.setData({
      showIcons: false
    });
  },
  
  // 选择图标颜色
  selectColor: function(e) {
    const color = e.currentTarget.dataset.color;
    console.log('选择颜色:', color);
    this.setData({
      selectedColor: color
    });
  },
  
  // 选择图标
  selectIcon: function(e) {
    const icon = e.currentTarget.dataset.icon;
    // 获取图标名称
    let iconName = '';
    
    try {
      // 从页面元素中获取名称文本（使用数据集或视图ID）
      const currentView = e.currentTarget;
      // 由于无法直接获取文本内容，使用更可靠的查找方式 - 根据图标类型设定名称
      switch(icon) {
        case 'fa-mobile-alt': iconName = '手机'; break;
        case 'fa-laptop': iconName = '笔记本'; break;
        case 'fa-desktop': iconName = '台式机'; break;
        case 'fa-headphones': iconName = '耳机'; break;
        case 'fa-camera': iconName = '相机'; break;
        case 'fa-tv': iconName = '电视'; break;
        case 'fa-keyboard': iconName = '键盘'; break;
        case 'fa-mouse': iconName = '鼠标'; break;
        case 'fa-tablet-alt': iconName = '平板'; break;
        case 'fa-watch': iconName = '手表'; break;
        case 'fa-laptop-code': iconName = '开发本'; break;
        case 'fa-print': iconName = '打印机'; break;
        case 'fa-couch': iconName = '沙发'; break;
        case 'fa-bed': iconName = '床'; break;
        case 'fa-chair': iconName = '椅子'; break;
        case 'fa-table': iconName = '桌子'; break;
        case 'fa-bath': iconName = '浴缸'; break;
        case 'fa-lightbulb': iconName = '灯泡'; break;
        case 'fa-toilet': iconName = '马桶'; break;
        case 'fa-shower': iconName = '淋浴'; break;
        case 'fa-sink': iconName = '水槽'; break;
        case 'fa-door-open': iconName = '门'; break;
        case 'fa-fan': iconName = '风扇'; break;
        case 'fa-box': iconName = '盒子'; break;
        case 'fa-car': iconName = '汽车'; break;
        case 'fa-bicycle': iconName = '自行车'; break;
        case 'fa-motorcycle': iconName = '摩托车'; break;
        case 'fa-bus': iconName = '公交车'; break;
        case 'fa-subway': iconName = '地铁'; break;
        case 'fa-train': iconName = '火车'; break;
        case 'fa-plane': iconName = '飞机'; break;
        case 'fa-ship': iconName = '轮船'; break;
        case 'fa-truck': iconName = '卡车'; break;
        case 'fa-rocket': iconName = '火箭'; break;
        case 'fa-helicopter': iconName = '直升机'; break;
        case 'fa-tractor': iconName = '拖拉机'; break;
        case 'fa-blender': iconName = '搅拌机'; break;
        case 'fa-coffee': iconName = '咖啡机'; break;
        case 'fa-mug-hot': iconName = '热饮杯'; break;
        case 'fa-utensils': iconName = '餐具'; break;
        case 'fa-pizza-slice': iconName = '披萨'; break;
        case 'fa-wine-glass': iconName = '酒杯'; break;
        case 'fa-hamburger': iconName = '汉堡'; break;
        case 'fa-blender-phone': iconName = '搅拌器'; break;
        case 'fa-pepper-hot': iconName = '辣椒'; break;
        case 'fa-carrot': iconName = '胡萝卜'; break;
        case 'fa-ice-cream': iconName = '冰淇淋'; break;
        case 'fa-cookie': iconName = '饼干'; break;
        case 'fa-gamepad': iconName = '游戏手柄'; break;
        case 'fa-dice': iconName = '骰子'; break;
        case 'fa-chess': iconName = '国际象棋'; break;
        case 'fa-bowling-ball': iconName = '保龄球'; break;
        case 'fa-guitar': iconName = '吉他'; break;
        case 'fa-drum': iconName = '鼓'; break;
        case 'fa-headset': iconName = '游戏耳机'; break;
        case 'fa-football-ball': iconName = '橄榄球'; break;
        case 'fa-basketball-ball': iconName = '篮球'; break;
        case 'fa-baseball-ball': iconName = '棒球'; break;
        case 'fa-golf-ball': iconName = '高尔夫球'; break;
        case 'fa-table-tennis': iconName = '乒乓球'; break;
        case 'fa-tshirt': iconName = 'T恤'; break;
        case 'fa-hat-cowboy': iconName = '牛仔帽'; break;
        case 'fa-socks': iconName = '袜子'; break;
        case 'fa-shoe-prints': iconName = '鞋子'; break;
        case 'fa-user-tie': iconName = '西装'; break;
        case 'fa-glasses': iconName = '眼镜'; break;
        case 'fa-crown': iconName = '皇冠'; break;
        case 'fa-hat-wizard': iconName = '巫师帽'; break;
        case 'fa-mitten': iconName = '手套'; break;
        case 'fa-vest': iconName = '马甲'; break;
        case 'fa-graduation-cap': iconName = '学士帽'; break;
        case 'fa-mask': iconName = '面具'; break;
        case 'fa-book': iconName = '书籍'; break;
        case 'fa-gift': iconName = '礼物'; break;
        case 'fa-gem': iconName = '宝石'; break;
        case 'fa-tools': iconName = '工具'; break;
        case 'fa-briefcase': iconName = '公文包'; break;
        case 'fa-umbrella': iconName = '雨伞'; break;
        case 'fa-paint-brush': iconName = '画笔'; break;
        case 'fa-pen': iconName = '钢笔'; break;
        case 'fa-coins': iconName = '硬币'; break;
        case 'fa-medal': iconName = '奖牌'; break;
        case 'fa-trophy': iconName = '奖杯'; break;
        case 'fa-heart': iconName = '爱心'; break;
        case 'fa-cube': iconName = '其他'; break;
        default: iconName = '自定义图标'; break;
      }
    } catch (error) {
      console.error('获取图标名称失败:', error);
      iconName = '自定义图标';
    }

    console.log('选择图标:', icon, '颜色:', this.data.selectedColor, '名称:', iconName);
    this.setData({
      iconClass: icon,
      iconName: iconName,
      showIcons: false,
      iconAnimating: true
    });
    
    // 2秒后取消动画效果
    setTimeout(() => {
      this.setData({
        iconAnimating: false
      });
    }, 2000);
  },
  
  // 验证表单
  validateForm: function() {
    // 验证资产名称
    if (!this.data.name || this.data.name.trim() === '') {
      wx.showToast({
        title: '请输入资产名称',
        icon: 'none'
      });
      return false;
    }
    
    // 验证购买价格
    if (!this.data.price || isNaN(parseFloat(this.data.price))) {
      wx.showToast({
        title: '请输入有效的购买价格',
        icon: 'none'
      });
      return false;
    }
    
    // 验证购买日期
    if (!this.data.purchaseDate) {
      wx.showToast({
        title: '请选择购买日期',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },
  
  // 保存资产
  saveAsset: function() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }
    
    // 确保使用次数是数字类型
    const usageCount = parseInt(this.data.usageCount || 0);
    console.log('保存使用次数:', usageCount);

    // 准备保存的资产数据
    const assetData = {
      id: this.data.id || '', // 使用 assetManager 自动生成 ID
      name: this.data.name.trim(),
      price: parseFloat(this.data.price),
      categoryId: this.data.categoryId,
      category: this.data.categoryText,
      purchaseDate: this.data.purchaseDate,
      warrantyDate: this.data.warrantyDate || '',
      description: this.data.description || '',
      imagePaths: this.data.tempImagePaths || [],
      icon: this.data.iconClass || 'fa-cube', // 默认图标
      iconClass: this.data.iconClass || 'fa-cube', // 默认图标
      iconName: this.data.iconName || '', // 保存图标名称
      status: this.data.statusActive ? '使用中' : '停用',
      targetDate: this.data.targetDate || '', // 由于targetDate可能不存在，直接使用实例变量
      iconColor: this.data.selectedColor || 'blue',
      usageCount: usageCount, // 确保使用整数
    };
    
    let result = false;
    
    // 保存资产数据
    if (this.data.isEditMode) {
      // 编辑模式
      result = assetManager.updateAsset(assetData);
    } else {
      // 添加模式
      result = assetManager.addAsset(assetData);
    }
    
    if (result) {
      // 标记需要刷新
      this.setData({
        needRefresh: true
      });
      
      // 显示成功提示
      wx.showToast({
        title: this.data.isEditMode ? '资产已更新' : '资产已添加',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 获取页面栈
          const pages = getCurrentPages();
          // 找到首页的索引
          let indexPageIndex = -1;
          for (let i = 0; i < pages.length; i++) {
            if (pages[i].route === 'pages/index/index') {
              indexPageIndex = i;
              break;
            }
          }
          
          if (indexPageIndex !== -1) {
            // 返回到首页
            wx.navigateBack({
              delta: pages.length - indexPageIndex - 1
            });
          } else {
            // 如果找不到首页，则重定向到首页
            wx.redirectTo({
              url: '/pages/index/index'
            });
          }
        }
      });
    } else {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },
  
  // 取消添加/编辑
  cancelAdd: function() {
    wx.navigateBack();
  },
  
  // 图片预览功能
  previewImage: function(e) {
    const src = e.currentTarget.dataset.src;
    const urls = this.data.tempImagePaths;
    
    wx.previewImage({
      current: src,
      urls: urls
    });
  },
  
  // 选择分类（资产分类）
  selectAssetCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    console.log('选择资产分类:', category);
    
    this.setData({
      categoryId: category.id,
      categoryText: category.name,
      showCategoryPicker: false
    });
  },
  
  // 选择图标分类
  selectIconCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    console.log('选择图标分类:', category);
    this.setData({
      currentCategory: category
    });
  },
}); 