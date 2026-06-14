import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { airportZhMapping, cityZhMapping, countryFlagMapping } from './airport_zh_mapping.js';

// 中国机场三字码-中文名映射表
const chinaAirportsMap = {
  "HAK": { city: "海口", name: "海口美兰国际机场" },
  "SHE": { city: "沈阳", name: "沈阳桃仙国际机场" },
  "PEK": { city: "北京", name: "北京首都国际机场" },
  "PKX": { city: "北京", name: "北京大兴国际机场" },
  "PVG": { city: "上海", name: "上海浦东国际机场" },
  "SHA": { city: "上海", name: "上海虹桥国际机场" },
  "CAN": { city: "广州", name: "广州白云国际机场" },
  "SZX": { city: "深圳", name: "深圳宝安国际机场" },
  "CTU": { city: "成都", name: "成都双流国际机场" },
  "TFU": { city: "成都", name: "成都天府国际机场" },
  "KMG": { city: "昆明", name: "昆明长水国际机场" },
  "HGH": { city: "杭州", name: "杭州萧山国际机场" },
  "XIY": { city: "西安", name: "西安咸阳国际机场" },
  "CKG": { city: "重庆", name: "重庆江北国际机场" },
  "WUH": { city: "武汉", name: "武汉天河国际机场" },
  "NKG": { city: "南京", name: "南京禄口国际机场" },
  "XMN": { city: "厦门", name: "厦门高崎国际机场" },
  "FOC": { city: "福州", name: "福州长乐国际机场" },
  "CSX": { city: "长沙", name: "长沙黄花国际机场" },
  "HFE": { city: "合肥", name: "合肥新桥国际机场" },
  "NNG": { city: "南宁", name: "南宁吴圩国际机场" },
  "CGO": { city: "郑州", name: "郑州新郑国际机场" },
  "TSN": { city: "天津", name: "天津滨海国际机场" },
  "DLC": { city: "大连", name: "大连周水子国际机场" },
  "TAO": { city: "青岛", name: "青岛流亭国际机场" },
  "HRB": { city: "哈尔滨", name: "哈尔滨太平国际机场" },
  "CGQ": { city: "长春", name: "长春龙嘉国际机场" },
  "SJW": { city: "石家庄", name: "石家庄正定国际机场" },
  "LHW": { city: "兰州", name: "兰州中川国际机场" },
  "URC": { city: "乌鲁木齐", name: "乌鲁木齐地窝堡国际机场" },
  "KHN": { city: "南昌", name: "南昌昌北国际机场" },
  "KOW": { city: "赣州", name: "赣州黄金国际机场" },
  "WXN": { city: "温州", name: "温州龙湾国际机场" },
  "HUN": { city: "黄岩", name: "台州黄岩机场" },
  "NGB": { city: "宁波", name: "宁波栎社国际机场" },
  "WNZ": { city: "温州", name: "温州龙湾国际机场" },
  "FUK": { city: "福冈", name: "福冈机场" },
  "OKA": { city: "那霸", name: "那霸机场" },
  "NGO": { city: "名古屋", name: "名古屋中部国际机场" },
  "HIJ": { city: "广岛", name: "广岛机场" },
  "SDJ": { city: "仙台", name: "仙台机场" },
  "KOJ": { city: "鹿儿岛", name: "鹿儿岛机场" },
  "KMJ": { city: "熊本", name: "熊本机场" },
  "NGS": { city: "长崎", name: "长崎机场" },
  "OIT": { city: "大分", name: "大分机场" },
  "MYJ": { city: "松山", name: "松山机场" },
  "TAK": { city: "高松", name: "高松机场" },
  "AOJ": { city: "青森", name: "青森机场" },
  "AKJ": { city: "旭川", name: "旭川机场" },
  "OKJ": { city: "冈山", name: "冈山机场" },
  "FKS": { city: "福岛", name: "福岛机场" },
  "KMI": { city: "宫崎", name: "宫崎机场" },
  "ICN": { city: "首尔", name: "首尔仁川国际机场" },
  "GMP": { city: "首尔", name: "首尔金浦国际机场" },
  "PUS": { city: "釜山", name: "釜山金海国际机场" },
  "CJU": { city: "济州岛", name: "济州国际机场" },
  "TAE": { city: "大邱", name: "大邱国际机场" },
  "CJJ": { city: "清州", name: "清州国际机场" },
  "KWJ": { city: "光州", name: "光州机场" },
  "DXB": { city: "迪拜", name: "迪拜国际机场" },
  "AUH": { city: "阿布扎比", name: "阿布扎比扎耶德国际机场" },
  "DOH": { city: "多哈", name: "多哈哈马德国际机场" },
  "RUH": { city: "利雅得", name: "利雅得哈立德国王国际机场" },
  "JED": { city: "吉达", name: "吉达阿卜杜勒-阿齐兹国王国际机场" },
  "MCT": { city: "马斯喀特", name: "马斯喀特国际机场" },
  "KWI": { city: "科威特城", name: "科威特国际机场" },
  "BAH": { city: "麦纳麦", name: "巴林国际机场" },
  "CAI": { city: "开罗", name: "开罗国际机场" },
  "CMN": { city: "卡萨布兰卡", name: "卡萨布兰卡穆罕默德五世国际机场" },
  "RAK": { city: "马拉喀什", name: "马拉喀什梅纳拉机场" },
  "TUN": { city: "突尼斯", name: "突尼斯迦太基国际机场" },
  "ALG": { city: "阿尔及尔", name: "阿尔及尔胡阿里·布迈丁机场" },
  "LHR": { city: "伦敦", name: "伦敦希思罗国际机场" },
  "CDG": { city: "巴黎", name: "巴黎戴高乐国际机场" },
  "FRA": { city: "法兰克福", name: "法兰克福国际机场" },
  "AMS": { city: "阿姆斯特丹", name: "阿姆斯特丹史基浦机场" },
  "MAD": { city: "马德里", name: "马德里巴拉哈斯机场" },
  "FCO": { city: "罗马", name: "罗马菲乌米奇诺机场" },
  "IST": { city: "伊斯坦布尔", name: "伊斯坦布尔国际机场" },
  "VIE": { city: "维也纳", name: "维也纳国际机场" },
  "ZRH": { city: "苏黎世", name: "苏黎世国际机场" },
  "CPH": { city: "哥本哈根", name: "哥本哈根卡斯特鲁普机场" },
  "ARN": { city: "斯德哥尔摩", name: "斯德哥尔摩阿兰达机场" },
  "OSL": { city: "奥斯陆", name: "奥斯陆加勒穆恩机场" },
  "HEL": { city: "赫尔辛基", name: "赫尔辛基万塔机场" },
  "DUB": { city: "都柏林", name: "都柏林机场" },
  "ATH": { city: "雅典", name: "雅典埃莱夫塞里奥斯·韦尼泽洛斯国际机场" },
  "LIS": { city: "里斯本", name: "里斯本波尔特拉机场" },
  "WAW": { city: "华沙", name: "华沙肖邦机场" },
  "PRG": { city: "布拉格", name: "布拉格瓦茨拉夫·哈维尔机场" },
  "BUD": { city: "布达佩斯", name: "布达佩斯费伦茨·李斯特国际机场" },
  "SVO": { city: "莫斯科", name: "莫斯科谢列梅捷沃国际机场" },
  "LED": { city: "圣彼得堡", name: "圣彼得堡普尔科沃机场" },
  "BAR": { city: "琼海", name: "琼海博鳌机场" },
  "MFM": { city: "澳门", name: "澳门国际机场" },
  "HKG": { city: "香港", name: "香港国际机场" },
  "BKK": { city: "曼谷", name: "曼谷素万那普国际机场" },
  "DMK": { city: "曼谷", name: "曼谷廊曼国际机场" },
  "KUL": { city: "吉隆坡", name: "吉隆坡国际机场" },
  "SZB": { city: "吉隆坡", name: "吉隆坡梳邦机场" },
  "BKI": { city: "哥打基纳巴卢(亚庇)", name: "哥打基纳巴卢国际机场" },
  "KCH": { city: "古晋", name: "古晋国际机场" },
  "LGK": { city: "兰卡威", name: "兰卡威国际机场" },
  "PEN": { city: "槟城", name: "槟城国际机场" },
  "BWN": { city: "斯里巴加湾市", name: "文莱国际机场" },
  "MNL": { city: "马尼拉", name: "马尼拉尼诺伊·阿基诺国际机场" },
  "CEB": { city: "宿务", name: "宿务麦克坦国际机场" },
  "CGK": { city: "雅加达", name: "雅加达苏加诺-哈达国际机场" },
  "DPS": { city: "巴厘岛", name: "巴厘岛登巴萨国际机场" },
  "SGN": { city: "胡志明市", name: "胡志明市新山一国际机场" },
  "HAN": { city: "河内", name: "河内内排国际机场" },
  "DAD": { city: "岘港", name: "岘港国际机场" },
  "CXR": { city: "芽庄", name: "芽庄金兰国际机场" },
  "PQC": { city: "富国", name: "富国国际机场" },
  "BKK": { city: "曼谷", name: "曼谷素万那普国际机场" },
  "DMK": { city: "曼谷", name: "曼谷廊曼国际机场" },
  "CNX": { city: "清迈", name: "清迈国际机场" },
  "HKT": { city: "普吉", name: "普吉国际机场" },
  "REP": { city: "暹粒", name: "暹粒吴哥国际机场" },
  "PNH": { city: "金边", name: "金边国际机场" },
  "VTE": { city: "万象", name: "万象瓦岱国际机场" },
  "LPQ": { city: "琅勃拉邦", name: "琅勃拉邦国际机场" },
  "RGN": { city: "仰光", name: "仰光国际机场" },
  "MDL": { city: "曼德勒", name: "曼德勒国际机场" },
  "MFM": { city: "澳门", name: "澳门国际机场" },
  "HKG": { city: "香港", name: "香港国际机场" }
};

// 中国城市拼音-中文映射表
const chinaCityMap = {
  // 直辖市
  "Beijing": "北京", "Shanghai": "上海", "Tianjin": "天津", "Chongqing": "重庆",
  
  // 省会城市
  "Guangzhou": "广州", "Shenzhen": "深圳", "Chengdu": "成都", "Hangzhou": "杭州",
  "Xi'an": "西安", "Wuhan": "武汉", "Nanjing": "南京", "Xiamen": "厦门",
  "Fuzhou": "福州", "Changsha": "长沙", "Hefei": "合肥", "Nanning": "南宁",
  "Zhengzhou": "郑州", "Dalian": "大连", "Qingdao": "青岛", "Harbin": "哈尔滨",
  "Changchun": "长春", "Shijiazhuang": "石家庄", "Lanzhou": "兰州", "Urumqi": "乌鲁木齐",
  "Nanchang": "南昌", "Kunming": "昆明", "Guiyang": "贵阳", "Lhasa": "拉萨",
  "Taipei": "台北", "Hong Kong": "香港", "Macau": "澳门",
  "Seoul": "首尔", "Busan": "釜山", "Jeju": "济州岛", "Daegu": "大邱", "Cheongju": "清州", "Gwangju": "光州",
  "Tokyo": "东京", "Osaka": "大阪", "Sapporo": "札幌", "Fukuoka": "福冈", "Naha": "那霸", "Nagoya": "名古屋",
  "Hiroshima": "广岛", "Sendai": "仙台", "Kagoshima": "鹿儿岛", "Kumamoto": "熊本", "Nagasaki": "长崎",
  "Oita": "大分", "Matsuyama": "松山", "Takamatsu": "高松", "Aomori": "青森", "Asahikawa": "旭川",
  "Okayama": "冈山", "Fukushima": "福岛", "Miyazaki": "宫崎", "Tottori": "鸟取", "Obihiro": "带广",
  "Saga": "佐贺", "Shirahama": "白滨",
  "Dubai": "迪拜", "Abu Dhabi": "阿布扎比", "Doha": "多哈", "Riyadh": "利雅得", "Jeddah": "吉达",
  "Muscat": "马斯喀特", "Kuwait City": "科威特城", "Manama": "麦纳麦",
  "Cairo": "开罗", "Casablanca": "卡萨布兰卡", "Marrakech": "马拉喀什", "Tunis": "突尼斯", "Algiers": "阿尔及尔",
  "London": "伦敦", "Paris": "巴黎", "Frankfurt": "法兰克福", "Amsterdam": "阿姆斯特丹",
  "Madrid": "马德里", "Rome": "罗马", "Istanbul": "伊斯坦布尔", "Vienna": "维也纳", "Zurich": "苏黎世",
  "Copenhagen": "哥本哈根", "Stockholm": "斯德哥尔摩", "Oslo": "奥斯陆", "Helsinki": "赫尔辛基",
  "Dublin": "都柏林", "Athens": "雅典", "Lisbon": "里斯本", "Warsaw": "华沙", "Prague": "布拉格",
  "Budapest": "布达佩斯", "Moscow": "莫斯科", "Saint Petersburg": "圣彼得堡",
  
  // 其他主要城市
  "Haikou": "海口", "Sanya": "三亚", "Guilin": "桂林", "Ganzhou": "赣州",
  "Wenzhou": "温州", "Huangyan": "黄岩", "Ningbo": "宁波", "Xuzhou": "徐州",
  "Suzhou": "苏州", "Wuxi": "无锡", "Changzhou": "常州", "Yangzhou": "扬州",
  "Nantong": "南通", "Jinan": "济南", "Qingdao": "青岛", "Yantai": "烟台",
  "Weifang": "潍坊", "Zibo": "淄博", "Xian": "西安", "Baoji": "宝鸡",
  "Hanzhong": "汉中", "Ankang": "安康", "Shangluo": "商洛", "Yan'an": "延安",
  "Yulin": "榆林", "Taiyuan": "太原", "Datong": "大同", "Changzhi": "长治",
  "Jincheng": "晋城", "Shuozhou": "朔州", "Yuncheng": "运城", "Xinzhou": "忻州",
  "Linfen": "临汾", "Jiaozuo": "焦作", "Luoyang": "洛阳", "Kaifeng": "开封",
  "Pingdingshan": "平顶山", "Anyang": "安阳", "Hebi": "鹤壁", "Xinxiang": "新乡",
  "Jiaozuo": "焦作", "Puyang": "濮阳", "Xuchang": "许昌", "Luohe": "漯河",
  "Sanmenxia": "三门峡", "Nanyang": "南阳", "Shangqiu": "商丘", "Xinyang": "信阳",
  "Zhoukou": "周口", "Zhumadian": "驻马店", "Hefei": "合肥", "Wuhu": "芜湖",
  "Bengbu": "蚌埠", "Huainan": "淮南", "Maanshan": "马鞍山", "Huaibei": "淮北",
  "Tongling": "铜陵", "Anqing": "安庆", "Huangshan": "黄山", "Chuzhou": "滁州",
  "Fuyang": "阜阳", "Suzhou": "宿州", "Lu'an": "六安", "Bozhou": "亳州",
  "Chizhou": "池州", "Xuancheng": "宣城", "Nanjing": "南京", "Wuxi": "无锡",
  "Xuzhou": "徐州", "Changzhou": "常州", "Suzhou": "苏州", "Nantong": "南通",
  "Lianyungang": "连云港", "Huai'an": "淮安", "Yancheng": "盐城", "Yangzhou": "扬州",
  "Zhenjiang": "镇江", "Taizhou": "泰州", "Suqian": "宿迁", "Hangzhou": "杭州",
  "Ningbo": "宁波", "Wenzhou": "温州", "Jiaxing": "嘉兴", "Huzhou": "湖州",
  "Shaoxing": "绍兴", "Jinhua": "金华", "Quzhou": "衢州", "Zhoushan": "舟山",
  "Taizhou": "台州", "Lishui": "丽水", "Fuzhou": "福州", "Xiamen": "厦门",
  "Putian": "莆田", "Sanming": "三明", "Quanzhou": "泉州", "Zhangzhou": "漳州",
  "Nanping": "南平", "Longyan": "龙岩", "Pingtan": "平潭", "Nanchang": "南昌",
  "Jiujiang": "九江", "Ganzhou": "赣州", "Yingtan": "鹰潭", "Shangrao": "上饶",
  "Fuzhou": "抚州", "Ji'an": "吉安", "Xinyu": "新余", "Pingxiang": "萍乡",
  "Yichun": "宜春", "Wuhan": "武汉", "Huangshi": "黄石", "Shiyan": "十堰",
  "Yichang": "宜昌", "Xiangyang": "襄阳", "Ezhou": "鄂州", "Jingmen": "荆门",
  "Xiaogan": "孝感", "Huanggang": "黄冈", "Suizhou": "随州", "Enshi": "恩施",
  "Changsha": "长沙", "Zhuzhou": "株洲", "Xiangtan": "湘潭", "Hengyang": "衡阳",
  "Shaoyang": "邵阳", "Yueyang": "岳阳", "Changde": "常德", "Zhangjiajie": "张家界",
  "Yiyang": "益阳", "Chenzhou": "郴州", "Yongzhou": "永州", "Huaihua": "怀化",
  "Loudi": "娄底", "Guangzhou": "广州", "Shenzhen": "深圳", "Zhuhai": "珠海",
  "Shantou": "汕头", "Shaoguan": "韶关", "Foshan": "佛山", "Jiangmen": "江门",
  "Zhanjiang": "湛江", "Maoming": "茂名", "Zhaoqing": "肇庆", "Huizhou": "惠州",
  "Meizhou": "梅州", "Shanwei": "汕尾", "Yangjiang": "阳江", "Qingyuan": "清远",
  "Dongguan": "东莞", "Zhongshan": "中山", "Chaozhou": "潮州", "Jieyang": "揭阳",
  "Yunfu": "云浮", "Nanning": "南宁", "Liuzhou": "柳州", "Guilin": "桂林",
  "Wuzhou": "梧州", "Beihai": "北海", "Fangchenggang": "防城港", "Qinzhou": "钦州",
  "Guigang": "贵港", "Yulin": "玉林", "Baise": "百色", "Hechi": "河池",
  "Laibin": "来宾", "崇左": "崇左", "Haikou": "海口", "Sanya": "三亚",
  "Sansha": "三沙", "Danzhou": "儋州", "Chengdu": "成都", "Mianyang": "绵阳",
  "Deyang": "德阳", "Leshan": "乐山", "Nanchong": "南充", "Zigong": "自贡",
  "Panzhihua": "攀枝花", "Luzhou": "泸州", "Suining": "遂宁", "Neijiang": "内江",
  "Baoding": "保定", "Langfang": "廊坊", "Tangshan": "唐山", "Qinhuangdao": "秦皇岛",
  "Handan": "邯郸", "Xingtai": "邢台", "Zhangjiakou": "张家口", "Chengde": "承德",
  "Cangzhou": "沧州", "Hengshui": "衡水", "Harbin": "哈尔滨", "Qiqihar": "齐齐哈尔",
  "Jiamusi": "佳木斯", "Daqing": "大庆", "Mudanjiang": "牡丹江", "Yichun": "伊春",
  "Jixi": "鸡西", "Qitaihe": "七台河", "Heihe": "黑河", "Suihua": "绥化",
  "Changchun": "长春", "Jilin": "吉林", "Siping": "四平", "Liaoyuan": "辽源",
  "Tonghua": "通化", "Baishan": "白山", "Songyuan": "松原", "Baicheng": "白城",
  "Dalian": "大连", "Dandong": "丹东", "Jinzhou": "锦州", "Yingkou": "营口",
  "Fushun": "抚顺", "Anshan": "鞍山", "Benxi": "本溪", "Panjin": "盘锦",
  "Tieling": "铁岭", "Chaoyang": "朝阳", "Huludao": "葫芦岛", "Lanzhou": "兰州",
  "Jiayuguan": "嘉峪关", "Jinchang": "金昌", "Baiyin": "白银", "Tianshui": "天水",
  "Wuwei": "武威", "Zhangye": "张掖", "Pingliang": "平凉", "Jiuquan": "酒泉",
  "Qingyang": "庆阳", "Dingxi": "定西", "Longnan": "陇南", "临夏": "临夏",
  "Gannan": "甘南", "Xining": "西宁", "Haidong": "海东", "Haibei": "海北",
  "Huangnan": "黄南", "Hainan": "海南", "Guoluo": "果洛", "Yushu": "玉树",
  "Haixi": "海西", "Ningxia": "宁夏", "Yinchuan": "银川", "Shizuishan": "石嘴山",
  "Wuzhong": "吴忠", "Guyuan": "固原", "Zhongwei": "中卫", "Urumqi": "乌鲁木齐",
  "Karamay": "克拉玛依", "Turpan": "吐鲁番", "Hami": "哈密", "Changji": "昌吉",
  "Bortala": "博尔塔拉", "Bayingolin": "巴音郭楞", "Aksu": "阿克苏", "Kashgar": "喀什",
  "Hotan": "和田", "Ili": "伊犁", "Tacheng": "塔城", "Altay": "阿勒泰",
  "Kunming": "昆明", "Qujing": "曲靖", "Yuxi": "玉溪", "Baoshan": "保山",
  "Zhaotong": "昭通", "Lijiang": "丽江", "Pu'er": "普洱", "Lincang": "临沧",
  "Chuxiong": "楚雄", "Honghe": "红河", "Wenshan": "文山", "Simao": "思茅",
  "Dali": "大理", "Dehong": "德宏", "Nujiang": "怒江", "Diqing": "迪庆",
  "Guiyang": "贵阳", "Zunyi": "遵义", "Liupanshui": "六盘水", "Anshun": "安顺",
  "Bijie": "毕节", "Tongren": "铜仁", "Qiannan": "黔南", "Qianxinan": "黔西南",
  "Qiandongnan": "黔东南", "Lhasa": "拉萨", "Shigatse": "日喀则", "Qamdo": "昌都",
  "Nyingchi": "林芝", "Shannan": "山南", "Ngari": "阿里", "Naqu": "那曲"
};

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前目录路径
const __dirname = path.dirname(__filename);

// CSV 文件路径
const csvFilePath = path.join(__dirname, 'airports.csv');
// 输出文件路径
const outputFilePath = path.join(__dirname, 'airports.json');

// 读取 CSV 文件
fs.readFile(csvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading CSV file:', err);
    return;
  }

  // 辅助函数：解析 CSV 行
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  // 解析 CSV 数据
  const lines = data.split('\n');
  
  // 解析表头
  const headersLine = lines[0];
  const headers = parseCSVLine(headersLine);
  
  // 找到需要的字段索引
  const fieldIndices = {
    iata_code: headers.indexOf('iata_code'),
    municipality: headers.indexOf('municipality'),
    name: headers.indexOf('name'),
    latitude_deg: headers.indexOf('latitude_deg'),
    longitude_deg: headers.indexOf('longitude_deg'),
    iso_country: headers.indexOf('iso_country'),
    type: headers.indexOf('type')
  };

  // 初始化结果对象
  const airports = {};
  const searchArray = [];

  // 处理每一行数据
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    
    // 提取需要的字段
    const iata_code = values[fieldIndices.iata_code]?.replace(/"/g, '').trim() || '';
    const municipality = values[fieldIndices.municipality]?.replace(/"/g, '').trim() || '';
    const name = values[fieldIndices.name]?.replace(/"/g, '').trim() || '';
    const latitude_deg = parseFloat(values[fieldIndices.latitude_deg]?.replace(/"/g, ''));
    const longitude_deg = parseFloat(values[fieldIndices.longitude_deg]?.replace(/"/g, ''));
    const iso_country = values[fieldIndices.iso_country]?.replace(/"/g, '').trim() || '';
    const type = values[fieldIndices.type]?.replace(/"/g, '').trim() || '';

    // 数据过滤
    if (!iata_code || type === 'heliport' || type === 'closed') {
      continue;
    }

    // 构建机场对象
    let processedMunicipality = municipality;
    let processedName = name;
    
    // 对于中国机场的特殊处理（包括香港和澳门）
    if (iso_country === 'CN' || iso_country === 'HK' || iso_country === 'MO') {
      // 1. 尝试通过机场三字码获取中文城市名和机场名
      if (chinaAirportsMap[iata_code]) {
        processedMunicipality = chinaAirportsMap[iata_code].city;
        processedName = chinaAirportsMap[iata_code].name;
      }
      // 2. 尝试通过拼音城市名获取中文城市名
      else if (chinaCityMap[municipality]) {
        processedMunicipality = chinaCityMap[municipality];
        // 将机场名称中的 'Airport' 替换为 '机场'
        processedName = name.replace(/Airport/g, '机场');
      }
      // 3. 默认处理
      else {
        // 将机场名称中的 'Airport' 替换为 '机场'
        processedName = name.replace(/Airport/g, '机场');
      }
    }
    
    const airport = {
      iata_code,
      municipality: processedMunicipality,
      name: processedName,
      latitude_deg,
      longitude_deg,
      iso_country,
      type
    };

    // 添加中文名称和国旗
    // 1. 首先检查机场三字码是否在映射表中
    if (airportZhMapping[iata_code]) {
      if (airportZhMapping[iata_code].city_zh) {
        airport.city_zh = airportZhMapping[iata_code].city_zh;
      }
      if (airportZhMapping[iata_code].name_zh) {
        airport.name_zh = airportZhMapping[iata_code].name_zh;
      }
    }
    // 2. 检查机场名称是否在映射表中
    else if (airportZhMapping[processedName]) {
      if (airportZhMapping[processedName].name_zh) {
        airport.name_zh = airportZhMapping[processedName].name_zh;
      }
    }
    // 3. 检查城市名称是否在映射表中
    if (!airport.city_zh && cityZhMapping[processedMunicipality]) {
      airport.city_zh = cityZhMapping[processedMunicipality];
    }
    // 4. 对于中国机场，确保城市名是中文
    if (iso_country === 'CN' && !airport.city_zh) {
      airport.city_zh = processedMunicipality;
    }
    // 5. 对于中国机场，确保机场名是中文
    if (iso_country === 'CN' && !airport.name_zh) {
      airport.name_zh = processedName;
    }
    // 6. 添加国旗
    if (countryFlagMapping[iso_country]) {
      airport.flag = countryFlagMapping[iso_country];
    }

    // 添加到结果对象
    airports[iata_code] = airport;
    
    // 添加到搜索数组
    searchArray.push({
      iata_code,
      name: airport.name_zh || name,
      city: airport.city_zh || municipality,
      country: iso_country
    });
  }

  // 生成最终结果
  const result = {
    airports,
    searchArray
  };

  // 写入输出文件
  fs.writeFile(outputFilePath, JSON.stringify(result, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
      return;
    }
    console.log(`Successfully processed airports data. Output saved to ${outputFilePath}`);
    console.log(`Total airports: ${Object.keys(airports).length}`);
    console.log(`Total search items: ${searchArray.length}`);
  });
});
