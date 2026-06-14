import json
import random

# 天气类型
weathers = ['晴天', '多云', '阴天', '雨天', '雪天', '雾天', '雷阵雨', '大风']

# 读取JSON文件，使用utf-8-sig处理BOM
with open('airports_summary.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# 为每个城市添加天气
for airport in data['airports']:
    airport['weather'] = random.choice(weathers)

# 写回JSON文件，确保正确编码
with open('airports_summary.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("已成功为每个城市添加天气信息")