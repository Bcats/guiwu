Page({
  data: {
    card: {
      name: '',
      type: '',
      description: '',
      useCount: 0
    },
    types: ['类型1', '类型2', '类型3'],
    typeIndex: 0,
    typeColors: {
      '类型1': '#ff6b6b',
      '类型2': '#4ecdc4',
      '类型3': '#45b7d1'
    }
  },
  onLoad: function(options) {
    if (options.id) {
      // 编辑模式
      const card = wx.getStorageSync('cards').find(c => c.id === options.id);
      if (card) {
        const typeIndex = this.data.types.indexOf(card.type);
        this.setData({ 
          card,
          typeIndex: typeIndex > -1 ? typeIndex : 0
        });
      }
    }
  },
  onTypeChange: function(e) {
    const typeIndex = e.detail.value;
    const type = this.data.types[typeIndex];
    this.setData({
      typeIndex,
      'card.type': type
    });
  },
  onNameInput: function(e) {
    this.setData({
      'card.name': e.detail.value
    });
  },
  onDescriptionInput: function(e) {
    this.setData({
      'card.description': e.detail.value
    });
  },
  onUseCountInput: function(e) {
    this.setData({
      'card.useCount': parseInt(e.detail.value) || 0
    });
  },
  onSave: function() {
    const { card } = this.data;
    if (!card.name || !card.type) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    const cards = wx.getStorageSync('cards') || [];
    if (card.id) {
      // 更新
      const index = cards.findIndex(c => c.id === card.id);
      if (index > -1) {
        cards[index] = card;
      }
    } else {
      // 新增
      card.id = Date.now().toString();
      cards.push(card);
    }
    wx.setStorageSync('cards', cards);
    wx.navigateBack();
  }
});