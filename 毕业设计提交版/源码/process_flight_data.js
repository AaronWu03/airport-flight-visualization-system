const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 读取Excel文件
const excelPath = path.join(process.cwd(), '国家航班数据表.xlsx');
const workbook = XLSX.readFile(excelPath);

// 获取第一个工作表
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// 转换为JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet);

// 优化数据处理
const optimizedData = jsonData.map(item => {
  // 移除空值
  const cleanedItem = {};
  for (const key in item) {
    if (item[key] !== null && item[key] !== undefined && item[key] !== '') {
      cleanedItem[key] = item[key];
    }
  }
  return cleanedItem;
}).filter(item => Object.keys(item).length > 0); // 过滤掉空对象

// 保存为JSON文件
const outputPath = path.join(process.cwd(), 'src/assets/flight_data.json');
fs.writeFileSync(outputPath, JSON.stringify(optimizedData, null, 2), 'utf8');

console.log(`数据处理完成！`);
console.log(`原始数据条数: ${jsonData.length}`);
console.log(`优化后数据条数: ${optimizedData.length}`);
console.log(`保存路径: ${outputPath}`);
