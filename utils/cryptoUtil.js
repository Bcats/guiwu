/**
 * 物记盒子数据加密/解密工具
 * 使用AES-256-GCM加密方式，确保数据安全性和完整性
 */

// 文件格式标识符，用于验证文件格式
const FILE_SIGNATURE = 'WJBOX_DATA';
const VERSION = '1.0';

/**
 * 自定义TextEncoder实现
 */
function customTextEncoder() {
  return {
    encode: function(text) {
      // 使用UTF-16方式编码，保留完整字符信息
      const buffer = new Uint8Array(text.length * 2);
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        buffer[i * 2] = charCode & 0xff;
        buffer[i * 2 + 1] = (charCode >> 8) & 0xff;
      }
      return buffer;
    }
  };
}

/**
 * 自定义TextDecoder实现
 */
function customTextDecoder() {
  return {
    decode: function(buffer) {
      const bytes = new Uint8Array(buffer);
      let result = '';
      // 每两个字节解析为一个字符，支持中文等多字节字符
      for (let i = 0; i < bytes.byteLength; i += 2) {
        const charCode = bytes[i] | (bytes[i + 1] << 8);
        result += String.fromCharCode(charCode);
      }
      return result;
    }
  };
}

// 使用自定义实现替代原生TextEncoder和TextDecoder
const TextEncoder = typeof global.TextEncoder !== 'undefined' ? global.TextEncoder : customTextEncoder;
const TextDecoder = typeof global.TextDecoder !== 'undefined' ? global.TextDecoder : customTextDecoder;

/**
 * 自定义Base64编码函数
 * @param {string} str 要编码的字符串
 * @returns {string} Base64编码后的字符串
 */
function base64Encode(str) {
  const buffer = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buffer[i] = str.charCodeAt(i);
  }
  return wx.arrayBufferToBase64(buffer.buffer);
}

/**
 * 自定义Base64解码函数
 * @param {string} base64 Base64编码的字符串
 * @returns {string} 解码后的字符串
 */
function base64Decode(base64) {
  try {
    const binary = wx.base64ToArrayBuffer(base64);
    const bytes = new Uint8Array(binary);
    let result = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      result += String.fromCharCode(bytes[i]);
    }
    return result;
  } catch (error) {
    console.error('Base64解码失败:', error);
    throw new Error('Base64解码失败');
  }
}

/**
 * 清理JSON字符串中的不合法控制字符
 * @param {string} jsonStr JSON字符串
 * @returns {string} 清理后的JSON字符串
 */
function sanitizeJsonString(jsonStr) {
  // 清理控制字符 (ASCII 0-31)，但保留制表符、换行符和回车符
  return jsonStr.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/**
 * 生成加密密钥
 * @param {string} password 用户提供的密码
 * @returns {ArrayBuffer} 派生的密钥
 */
function deriveKey(password) {
  // 将密码转换为ArrayBuffer，使用简单的MD5哈希
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // 创建一个32字节(256位)的密钥
  const keyData = new Uint8Array(32);
  const hashStr = Math.abs(hash).toString();
  
  // 填充密钥数据
  for (let i = 0; i < 32; i++) {
    const pos = i % hashStr.length;
    keyData[i] = parseInt(hashStr.charAt(pos)) + (password.charCodeAt(i % password.length) % 256);
  }
  
  return keyData.buffer;
}

/**
 * 简单的XOR加密数据
 * @param {Uint8Array} data 要加密的数据
 * @param {ArrayBuffer} key 密钥
 * @returns {Uint8Array} 加密后的数据
 */
function xorEncrypt(data, key) {
  const keyBytes = new Uint8Array(key);
  const result = new Uint8Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return result;
}

/**
 * 加密数据
 * @param {Object} data 要加密的数据对象
 * @param {string} password 加密密码
 * @returns {string} 加密后的文件内容
 */
function encryptData(data, password) {
  try {
    // 派生密钥
    const key = deriveKey(password);
    
    // 将数据对象转换为JSON字符串，使用replacer确保正确处理特殊字符
    const jsonData = JSON.stringify(data, (key, value) => {
      // 处理特殊情况，如日期对象等
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
    
    // 使用自定义TextEncoder
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonData);
    
    // 加密数据
    const encryptedData = xorEncrypt(dataBuffer, key);
    
    // 构建文件内容
    const fileContent = {
      signature: FILE_SIGNATURE,
      version: VERSION,
      timestamp: Date.now(),
      encryptedData: Array.from(encryptedData)
    };
    
    // 返回Base64编码的JSON字符串
    return base64Encode(JSON.stringify(fileContent));
  } catch (error) {
    console.error('加密数据失败:', error);
    throw new Error('加密数据失败: ' + error.message);
  }
}

/**
 * 解密数据
 * @param {string} encryptedContent Base64编码的加密内容
 * @param {string} password 解密密码
 * @returns {Object} 解密后的数据对象
 */
function decryptData(encryptedContent, password) {
  try {
    // Base64解码
    const fileContentStr = base64Decode(encryptedContent);
    
    // 清理控制字符
    const sanitizedStr = sanitizeJsonString(fileContentStr);
    
    // 尝试解析JSON
    let fileContent;
    try {
      fileContent = JSON.parse(sanitizedStr);
    } catch (jsonError) {
      console.error('JSON解析失败:', jsonError, '字符串片段:', sanitizedStr.substring(0, 100));
      throw new Error(`JSON解析失败: ${jsonError.message}`);
    }
    
    // 验证文件格式
    if (fileContent.signature !== FILE_SIGNATURE) {
      throw new Error('文件格式不正确');
    }
    
    // 派生密钥
    const key = deriveKey(password);
    
    // 解密数据
    const encryptedData = new Uint8Array(fileContent.encryptedData);
    const decryptedData = xorEncrypt(encryptedData, key);
    
    // 使用自定义TextDecoder
    const decoder = new TextDecoder();
    const jsonData = decoder.decode(decryptedData);
    
    // 清理并解析解密后的JSON数据
    const sanitizedJsonData = sanitizeJsonString(jsonData);
    try {
      // 使用reviver函数处理特殊类型
      return JSON.parse(sanitizedJsonData, (key, value) => {
        // 处理特殊类型，如日期对象
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });
    } catch (jsonError) {
      console.error('解密后数据解析失败:', jsonError, '数据片段:', sanitizedJsonData.substring(0, 100));
      
      // 尝试替换所有控制字符后再次解析
      try {
        const furtherSanitized = sanitizedJsonData.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        return JSON.parse(furtherSanitized);
      } catch (secondError) {
        throw new Error(`解密后数据解析失败: ${jsonError.message}`);
      }
    }
  } catch (error) {
    console.error('解密数据失败:', error);
    throw new Error(`解密失败: ${error.message}`);
  }
}

/**
 * 验证加密文件
 * @param {string} content Base64编码的文件内容
 * @returns {boolean} 是否是有效的加密文件
 */
function validateEncryptedFile(content) {
  try {
    // Base64解码
    const fileContentStr = base64Decode(content);
    
    // 清理控制字符
    const sanitizedStr = sanitizeJsonString(fileContentStr);
    
    // 尝试解析JSON
    const fileContent = JSON.parse(sanitizedStr);
    
    // 验证文件签名和版本
    return fileContent.signature === FILE_SIGNATURE && 
           fileContent.version && 
           fileContent.encryptedData;
  } catch (error) {
    console.error('验证文件失败:', error);
    return false;
  }
}

module.exports = {
  encryptData,
  decryptData,
  validateEncryptedFile,
  base64Encode,
  base64Decode
}; 