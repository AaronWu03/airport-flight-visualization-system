// Airline logo mapping dictionary
// Supports: IATA 2-letter codes, ICAO 3-letter codes, Chinese full names, short names, English names
// Maps to filename in /assets/airline-logos/ directory (without extension)

export const airlineLogoMap = {
  // ==================== 中国大陆航空公司 ====================
  // 中国国航
  'ca': 'ca', 'cca': 'ca', '中国国际航空': 'ca', '中国国航': 'ca', '中国国际航空股份有限公司': 'ca', 'Air China': 'ca',
  // 中国东航
  'mu': 'mu', 'ces': 'mu', '中国东方航空': 'mu', '东方航空': 'mu', '中国东方航空股份有限公司': 'mu', 'China Eastern': 'mu',
  // 中国南航
  'cz': 'cz', 'csn': 'cz', '中国南方航空': 'cz', '南方航空': 'cz', '中国南方航空股份有限公司': 'cz', 'China Southern': 'cz',
  // 海南航空
  'hu': 'hu', 'chh': 'hu', '海南航空': 'hu', '海南航空股份有限公司': 'hu', 'Hainan Airlines': 'hu',
  // 春秋航空
  '9c': '9c', 'cqh': '9c', '春秋航空': '9c', '春秋航空股份有限公司': '9c', 'Spring Airlines': '9c',
  // 厦门航空
  'mf': 'mf', 'cxa': 'mf', '厦门航空': 'mf', '厦门航空有限公司': 'mf', 'XiamenAir': 'mf',
  // 深圳航空
  'zh': 'zh', 'csz': 'zh', '深圳航空': 'zh', '深圳航空有限责任公司': 'zh', 'Shenzhen Airlines': 'zh',
  // 四川航空
  '3u': '3u', 'csc': '3u', '四川航空': '3u', '四川航空股份有限公司': '3u', 'Sichuan Airlines': '3u',
  // 山东航空
  'sc': 'sc', 'cdg': 'sc', '山东航空': 'sc', '山东航空股份有限公司': 'sc', 'Shandong Airlines': 'sc',
  // 天津航空
  'gs': 'gs', 'gcr': 'gs', '天津航空': 'gs', '天津航空有限责任公司': 'gs', 'Tianjin Airlines': 'gs',
  // 首都航空
  'jd': 'jd', 'cbj': 'jd', '首都航空': 'jd', '北京首都航空有限公司': 'jd', 'Capital Airlines': 'jd',
  // 上海航空
  'fm': 'fm', 'csf': 'fm', '上海航空': 'fm', '上海航空有限公司': 'fm', 'Shanghai Airlines': 'fm',
  // 吉祥航空
  'ho': 'ho', 'dkh': 'ho', '吉祥航空': 'ho', '上海吉祥航空股份有限公司': 'ho', 'Juneyao Airlines': 'ho',
  // 华夏航空
  'g5': 'g5', 'hxa': 'g5', '华夏航空': 'g5', '华夏航空股份有限公司': 'g5', 'China Express': 'g5',
  // 中国联合航空
  'kn': 'kn', 'cua': 'kn', '中国联合航空': 'kn', '中国联合航空有限公司': 'kn', 'China United Airlines': 'kn',
  // 成都航空
  'eu': 'eu', 'uea': 'eu', '成都航空': 'eu', '成都航空有限公司': 'eu', 'Chengdu Airlines': 'eu',
  // 西藏航空
  'tv': 'tv', 'tba': 'tv', '西藏航空': 'tv', '西藏航空有限公司': 'tv', 'Tibet Airlines': 'tv',
  // 长安航空
  '9h': '9h', 'cgz': '9h', '长安航空': '9h', '长安航空有限责任公司': '9h', 'Air Changan': '9h',
  // 青岛航空 (IATA: QW, ICAO: QDA)
  'qw': 'qr', 'qda': 'qr', '青岛航空': 'qr', '青岛航空股份有限公司': 'qr', 'Qingdao Airlines': 'qr',
  // 奥凯航空
  'bk': 'bk', 'okl': 'bk', '奥凯航空': 'bk', '奥凯航空有限公司': 'bk', 'Okay Airways': 'bk',
  // 幸福航空 (IATA: JR, ICAO: JHR)
  'jr': 'jy', 'jhr': 'jy', '幸福航空': 'jy', '幸福航空有限责任公司': 'jy', 'Joy Air': 'jy',
  // 北部湾航空
  'gx': 'gx', 'cbg': 'gx', '北部湾航空': 'gx', '广西北部湾航空有限责任公司': 'gx', 'GX Airlines': 'gx',
  // 东海航空
  'dz': 'dz', 'epa': 'dz', '东海航空': 'dz', '东海航空有限公司': 'dz', 'Donghai Airlines': 'dz',
  // 福州航空
  'fu': 'fu', 'fza': 'fu', '福州航空': 'fu', '福州航空有限责任公司': 'fu', 'Fuzhou Airlines': 'fu',
  // 金鹏航空
  'y8': 'y8', 'psi': 'y8', '金鹏航空': 'y8', '金鹏航空股份有限公司': 'y8', 'Suparna Airlines': 'y8',
  // 瑞丽航空
  'dr': 'dr', 'rlh': 'dr', '瑞丽航空': 'dr', '瑞丽航空有限公司': 'dr', 'Ruili Airlines': 'dr',
  // 多彩贵州航空
  'gy': 'gy', 'cga': 'gy', '多彩贵州航空': 'gy', '多彩贵州航空有限责任公司': 'gy', 'Colorful Guizhou Airlines': 'gy',
  // 九元航空
  'aq': 'aq', 'jyu': 'aq', '九元航空': 'aq', '九元航空有限公司': 'aq', '9 Air': 'aq',
  // 昆明航空
  'ky': 'ky', 'kna': 'ky', '昆明航空': 'ky', '昆明航空有限公司': 'ky', 'Kunming Airlines': 'ky',
  // 长龙航空
  'gj': 'gj', 'cdc': 'gj', '长龙航空': 'gj', '浙江长龙航空有限公司': 'gj', 'Loong Air': 'gj',
  // 祥鹏航空
  '8l': '8l', 'lke': '8l', '祥鹏航空': '8l', '云南祥鹏航空有限责任公司': '8l', 'Lucky Air': '8l',
  // 大新华航空
  'cn': 'cn', 'gdc': 'cn', '大新华航空': 'cn', '大新华航空有限公司': 'cn', 'Grand China Air': 'cn',
  // 西部航空
  'pn': 'pn', 'chb': 'pn', '西部航空': 'pn', '西部航空有限责任公司': 'pn', 'West Air': 'pn',
  // 乌鲁木齐航空
  'uq': 'uq', 'cuq': 'uq', '乌鲁木齐航空': 'uq', '乌鲁木齐航空有限责任公司': 'uq', 'Urumqi Air': 'uq',
  // 重庆航空
  'oq': 'oq', 'cqn': 'oq', '重庆航空': 'oq', '重庆航空有限责任公司': 'oq', 'Chongqing Airlines': 'oq',
  // 河北航空
  'ns': 'ns', 'hbh': 'ns', '河北航空': 'ns', '河北航空有限公司': 'ns', 'Hebei Airlines': 'ns',
  // 湖南航空
  'a6': 'a6', 'hkt': 'a6', '湖南航空': 'a6', '湖南航空股份有限公司': 'a6', 'Air Travel': 'a6',
  // 顺丰航空
  'o3': 'o3', 'css': 'o3', '顺丰航空': 'o3', '顺丰航空有限公司': 'o3', 'SF Airlines': 'o3',
  // 桂林航空
  'gt': 'gt', 'cgt': 'gt', '桂林航空': 'gt', '桂林航空有限公司': 'gt', 'Air Guilin': 'gt',
  // 澳门航空
  'nx': 'nx', 'amu': 'nx', '澳门航空': 'nx', '澳门航空股份有限公司': 'nx', 'Air Macau': 'nx',
  // 大连航空
  'gm': 'gm', 'ccr': 'gm', '大连航空': 'gm', '大连航空有限责任公司': 'gm', 'Dalian Airlines': 'gm',
  // 天骄航空
  'jt': 'jt', 'gkn': 'jt', '天骄航空': 'jt', '天骄航空有限公司': 'jt', 'Genghis Khan Airlines': 'jt',
  // 大湾区航空
  'hb': 'hb', 'hkg': 'hb', '大湾区航空': 'hb', '大湾区航空有限公司': 'hb', 'Greater Bay Airlines': 'hb',
  // 香港快运
  'hx': 'hx', 'hke': 'hx', '香港快运': 'hx', '香港快运航空有限公司': 'hx', 'HK Express': 'hx',
  // 香港航空
  'hx_hk': 'hx_hk', 'crk': 'hx_hk', '香港航空': 'hx_hk', '香港航空有限公司': 'hx_hk', 'Hong Kong Airlines': 'hx_hk',
  // 澜湄航空
  'lq': 'lq', 'lka': 'lq', '澜湄航空': 'lq', '澜湄航空(柬埔寨)股份有限公司': 'lq', 'Lanmei Airlines': 'lq',
  // 华信航空
  'ae': 'ae', 'mda': 'ae', '华信航空': 'ae', '华信航空股份有限公司': 'ae', 'Mandarin Airlines': 'ae',
  // 立荣航空
  'b7': 'b7', 'uia': 'b7', '立荣航空': 'b7', '立荣航空股份有限公司': 'b7', 'UNI Air': 'b7',
  // 星宇航空
  'jx': 'jx', 'sjx': 'jx', '星宇航空': 'jx', '星宇航空股份有限公司': 'jx', 'StarLux Airlines': 'jx',
  // 台湾虎航
  'it': 'it', 'ttw': 'it', '台湾虎航': 'it', '台湾虎航股份有限公司': 'it', 'Tigerair Taiwan': 'it',
  // 中国国际货运航空
  'ck': 'ck', 'ca0': 'ck', '中国货运航空': 'ck', '中国国际货运航空有限公司': 'ck', 'Air China Cargo': 'ck',

  // ==================== 香港/台湾航空公司 ====================
  'cx': 'cx', 'cpa': 'cx', '国泰航空': 'cx', '国泰航空有限公司': 'cx', 'Cathay Pacific': 'cx',
  'br': 'br', 'eva': 'br', '长荣航空': 'br', '长荣航空股份有限公司': 'br', 'EVA Air': 'br',
  'ci': 'ci', 'cal': 'ci', '中华航空': 'ci', '中华航空股份有限公司': 'ci', 'China Airlines': 'ci',

  // ==================== 日本航空公司 ====================
  'jl': 'jl', 'jal': 'jl', '日本航空': 'jl', '日本航空株式会社': 'jl', 'JAL': 'jl',
  'nh': 'nh', 'ana': 'nh', '全日空': 'nh', '全日本空输': 'nh', 'ANA': 'nh',

  // 韩国航空公司
  'ke': 'ke', 'kal': 'ke', '大韩航空': 'ke', '大韩航空株式会社': 'ke', 'Korean Air': 'ke',
  'oz': 'oz', 'aas': 'oz', '韩亚航空': 'oz', '韩亚航空株式会社': 'oz', 'Asiana': 'oz',
  '7c': '7c', 'jja': '7c', '济州航空': '7c', '济州航空株式会社': '7c', 'Jeju Air': '7c',
  'tw': 'tw', 'twb': 'tw', '德威航空': 'tw', 'Tway Air': 'tw', '德威': 'tw', '德威航空公司': '7c',
  'lj': 'lj', 'jnl': 'lj', '真航空': 'lj', 'Jin Air': 'lj',
  'bx': 'bx', 'abl': 'bx', '釜山航空': 'bx', '釜山航空株式会社': 'bx', 'Air Busan': 'bx',

  // ==================== 东南亚航空公司 ====================
  'sq': 'sq', 'sia': 'sq', '新加坡航空': 'sq', '新加坡航空有限公司': 'sq', 'Singapore Airlines': 'sq',
  'tr': 'tr', 'tgw': 'tr', '酷航': 'tr', '新加坡酷航航空公司': 'tr', 'Scoot': 'tr',
  'tg': 'tg', 'tha': 'tg', '泰国航空': 'tg', '泰国国际航空': 'tg', 'Thai Airways': 'tg',
  'vn': 'vn', 'hvn': 'vn', '越南航空': 'vn', '越南国家航空': 'vn', 'Vietnam Airlines': 'vn',
  'pg': 'pg', 'bkp': 'pg', '曼谷航空': 'pg', '曼谷航空公共有限公司': 'pg', 'Bangkok Airways': 'pg',

  // ==================== 中东航空公司 ====================
  // 阿联酋航空 (IATA: EK, ICAO: UAE) - 只有三字码PNG
  'ek': 'uae', 'uae': 'uae', '阿联酋航空': 'uae', 'Emirates': 'uae',
  // 卡塔尔航空 (IATA: QR, ICAO: QTR) - 有二字码SVG
  'qatar': 'qr', 'qtr': 'qr', '卡塔尔航空': 'qr', 'Qatar Airways': 'qr',
  // 阿提哈德航空 (IATA: EY, ICAO: ETD) - 只有三字码PNG
  'ey': 'etd', 'etd': 'etd', '阿提哈德航空': 'etd', 'Etihad Airways': 'etd',
  // 阿拉伯航空 (IATA: G9, ICAO: ABY)
  'g9': 'aby', 'aby': 'aby', '阿拉伯航空': 'aby', 'Air Arabia': 'aby',
  // 沙姆航空 (IATA: FZ, ICAO: FDB)
  'fz': 'fdb', 'fdb': 'fdb', '迪拜航空': 'fdb', 'flydubai': 'fdb',
  // 科威特航空 (IATA: KU, ICAO: KAC)
  'ku': 'kac', 'kac': 'kac', '科威特航空': 'kac', 'Kuwait Airways': 'kac',
  // 巴林海湾航空 (IATA: GF, ICAO: GBA)
  'gf': 'gba', 'gba': 'gba', '海湾航空': 'gba', 'Gulf Air': 'gba',
  // 阿曼航空 (IATA: WY, ICAO: OMA)
  'wy': 'oma', 'oma': 'oma', '阿曼航空': 'oma', 'Oman Air': 'oma',
  // 埃及航空 (IATA: MS, ICAO: MSR)
  'ms': 'msr', 'msr': 'msr', '埃及航空': 'msr', 'EgyptAir': 'msr',
  // 摩洛哥皇家航空 (IATA: AT, ICAO: RAM)
  'at': 'ram', 'ram': 'ram', '摩洛哥皇家航空': 'ram', 'Royal Air Maroc': 'ram',
  // 埃塞俄比亚航空 (IATA: ET, ICAO: ETH)
  'et_et': 'eth', 'eth': 'eth', '埃塞俄比亚航空': 'eth', 'Ethiopian Airlines': 'eth',
  // 肯尼亚航空 (IATA: KQ, ICAO: KQA)
  'kq': 'kqa', 'kqa': 'kqa', '肯尼亚航空': 'kqa', 'Kenya Airways': 'kqa',
  // 南非航空 (IATA: SA, ICAO: SAA)
  'sa': 'saa', 'saa': 'saa', '南非航空': 'saa', 'South African Airways': 'saa',
  
  // ==================== 南美航空公司 ====================
  // 拉塔姆航空 (IATA: LA, ICAO: LAN)
  'la': 'lan', 'lan': 'lan', '拉塔姆航空': 'lan', 'LATAM Airlines': 'lan',
  // 戈尔航空 (IATA: G3, ICAO: GLO)
  'g3': 'glo', 'glo': 'glo', '戈尔航空': 'glo', 'GOL Linhas Aereas': 'glo',
  // 阿兹尔航空 (IATA: AD, ICAO: AZU)
  'ad': 'azu', 'azu': 'azu', '阿兹尔航空': 'azu', 'Azul Brazilian Airlines': 'azu',
  // 哥伦比亚航空 (IATA: AV, ICAO: AVA)
  'av': 'ava', 'ava': 'ava', '哥伦比亚航空': 'ava', 'Avianca': 'ava',
  // 巴拿马航空 (IATA: CM, ICAO: CMP)
  'cm': 'cmp', 'cmp': 'cmp', '巴拿马航空': 'cmp', 'Copa Airlines': 'cmp',
  // 智利航空 (IATA: H2, ICAO: SKU)
  'h2': 'sku', 'sku': 'sku', '智利南美航空': 'sku', 'Sky Airline': 'sku',
  // 阿根廷航空 (IATA: AR, ICAO: ARG)
  'ar': 'arg', 'arg': 'arg', '阿根廷航空': 'arg', 'Aerolineas Argentinas': 'arg',
  // 秘鲁航空 (IATA: LP, ICAO: LPE)
  'lp': 'lpe', 'lpe': 'lpe', '秘鲁南美航空': 'lpe', 'LATAM Peru': 'lpe',
  
  // ==================== 东南亚其他航空公司 ====================
  // 菲律宾航空 (IATA: PR, ICAO: PAL)
  'pr': 'pal', 'pal': 'pal', '菲律宾航空': 'pal', 'Philippine Airlines': 'pal',
  // 宿务太平洋航空 (IATA: 5J, ICAO: CEB)
  '5j': 'ceb', 'ceb': 'ceb', '宿务太平洋航空': 'ceb', 'Cebu Pacific': 'ceb',
  // 亚洲航空 (IATA: AK/QZ, ICAO: AXM/AWQ)
  'ak': 'axm', 'axm': 'axm', '亚洲航空': 'axm', 'AirAsia': 'axm',
  'qz': 'awq', 'awq': 'awq', '印尼亚洲航空': 'awq', 'Indonesia AirAsia': 'awq',
  'fd': 'aiq', 'aiq': 'aiq', '泰国亚洲航空': 'aiq', 'Thai AirAsia': 'aiq',
  'z2': 'apz', 'apz': 'apz', '菲律宾亚洲航空': 'apz', 'AirAsia Philippines': 'apz',
  // 印尼亚鹰航空 (IATA: GA, ICAO: GIA)
  'ga': 'gia', 'gia': 'gia', '印尼鹰航': 'gia', 'Garuda Indonesia': 'gia',
  // 马来西亚航空 (IATA: MH, ICAO: MAS)
  'mh': 'mas', 'mas': 'mas', '马来西亚航空': 'mas', 'Malaysia Airlines': 'mas',
  // 文莱皇家航空 (IATA: BI, ICAO: RBA)
  'bi': 'rba', 'rba': 'rba', '文莱皇家航空': 'rba', 'Royal Brunei Airlines': 'rba',
  // 缅甸国际航空 (IATA: 8M, ICAO: MUB)
  '8m': 'mub', 'mub': 'mub', '缅甸航空': 'mub', 'Myanmar Airways': 'mub',
  // 柬埔寨航空 (IATA: K6, ICAO: KHV)
  'k6': 'khv', 'khv': 'khv', '柬埔寨航空': 'khv', 'Cambodia Angkor Air': 'khv',
  // 老挝航空 (IATA: QV, ICAO: LAO)
  'qv': 'lao', 'lao': 'lao', '老挝航空': 'lao', 'Lao Airlines': 'lao',
  // 菲律宾宿翱航空 (IATA: DG, ICAO: SRQ)
  'dg': 'srq', 'srq': 'srq', '宿翱航空': 'srq', 'Cebgo': 'srq',
  
  // ==================== 其他欧洲航空公司 ====================
  // 北欧航空 (IATA: SK, ICAO: SAS)
  'sk': 'sas', 'sas': 'sas', '北欧航空': 'sas', 'SAS Scandinavian Airlines': 'sas',
  // 芬兰航空 (IATA: AY, ICAO: FIN)
  'ay': 'fin', 'fin': 'fin', '芬兰航空': 'fin', 'Finnair': 'fin',
  // 爱尔兰航空 (IATA: EI, ICAO: EIN)
  'ei': 'ein', 'ein': 'ein', '爱尔兰航空': 'ein', 'Aer Lingus': 'ein',
  // 伊比利亚航空 (IATA: IB, ICAO: IBE)
  'ib': 'ibe', 'ibe': 'ibe', '伊比利亚航空': 'ibe', 'Iberia': 'ibe',
  // 葡萄牙航空 (IATA: TP, ICAO: TAP)
  'tp': 'tap', 'tap': 'tap', '葡萄牙航空': 'tap', 'TAP Air Portugal': 'tap',
  // 瑞士国际航空 (IATA: LX, ICAO: SWR)
  'lx': 'swr', 'swr': 'swr', '瑞士航空': 'swr', 'Swiss International Air Lines': 'swr',
  // 奥地利航空 (IATA: OS, ICAO: AUA)
  'os': 'aua', 'aua': 'aua', '奥地利航空': 'aua', 'Austrian Airlines': 'aua',
  // 布鲁塞尔航空 (IATA: SN, ICAO: BEL)
  'sn': 'bel', 'bel': 'bel', '布鲁塞尔航空': 'bel', 'Brussels Airlines': 'bel',
  // 捷克航空 (IATA: OK, ICAO: CSA)
  'ok': 'csa', 'csa': 'csa', '捷克航空': 'csa', 'Czech Airlines': 'csa',
  // 波兰航空 (IATA: LO, ICAO: LOT)
  'lo': 'lot', 'lot': 'lot', '波兰航空': 'lot', 'LOT Polish Airlines': 'lot',
  // 希腊爱琴海航空 (IATA: A3, ICAO: AEE)
  'a3': 'aee', 'aee': 'aee', '爱琴海航空': 'aee', 'Aegean Airlines': 'aee',
  // 罗马尼亚航空 (IATA: RO, ICAO: ROT)
  'ro': 'rot', 'rot': 'rot', '罗马尼亚航空': 'rot', 'Tarom': 'rot',
  // 克罗地亚航空 (IATA: OU, ICAO: CTN)
  'ou': 'ctn', 'ctn': 'ctn', '克罗地亚航空': 'ctn', 'Croatia Airlines': 'ctn',
  // 塞尔维亚航空 (IATA: JU, ICAO: ASL)
  'ju': 'asl', 'asl': 'asl', '塞尔维亚航空': 'asl', 'Air Serbia': 'asl',
  // 冰岛航空 (IATA: FI, ICAO: ICE)
  'fi': 'ice', 'ice': 'ice', '冰岛航空': 'ice', 'Icelandair': 'ice',
  // 维珍航空 (IATA: VS, ICAO: VIR)
  'vs': 'vir', 'vir': 'vir', '维珍航空': 'vir', 'Virgin Atlantic': 'vir',
  // 易捷航空 (IATA: U2, ICAO: EZY)
  'u2': 'ezy', 'ezy': 'ezy', '易捷航空': 'ezy', 'easyJet': 'ezy',
  // 瑞安航空 (IATA: FR, ICAO: RYR)
  'fr': 'ryr', 'ryr': 'ryr', '瑞安航空': 'ryr', 'Ryanair': 'ryr',
  // 挪威航空 (IATA: DY, ICAO: NAX)
  'dy': 'nax', 'nax': 'nax', '挪威航空': 'nax', 'Norwegian Air Shuttle': 'nax',
  // 途易航空 (IATA: X3, ICAO: TUI)
  'x3': 'tui', 'tui': 'tui', '途易航空': 'tui', 'TUIfly': 'tui',
  // 威兹航空 (IATA: W6, ICAO: WZZ)
  'w6': 'wzz', 'wzz': 'wzz', '威兹航空': 'wzz', 'Wizz Air': 'wzz',
  
  // ==================== 其他美国航空公司 ====================
  // 精神航空 (IATA: NK, ICAO: NKS)
  'nk': 'nks', 'nks': 'nks', '精神航空': 'nks', 'Spirit Airlines': 'nks',
  // 忠实航空 (IATA: G4, ICAO: AAY)
  'g4': 'aay', 'aay': 'aay', '忠实航空': 'aay', 'Allegiant Air': 'aay',
  // 太阳城航空 (IATA: SY, ICAO: SCX)
  'sy': 'scx', 'scx': 'scx', '太阳城航空': 'scx', 'Sun Country Airlines': 'scx',
  // 夏威夷航空 (IATA: HA, ICAO: HAL)
  'ha': 'hal', 'hal': 'hal', '夏威夷航空': 'hal', 'Hawaiian Airlines': 'hal',
  // 阿拉斯加航空 (IATA: AS, ICAO: ASA)
  'as': 'asa', 'asa': 'asa', '阿拉斯加航空': 'asa', 'Alaska Airlines': 'asa',
  
  // ==================== 其他航空公司 ====================
  // 斐济航空 (IATA: FJ, ICAO: FJI)
  'fj': 'fji', 'fji': 'fji', '斐济航空': 'fji', 'Fiji Airways': 'fji',
  // 新西兰航空 (IATA: NZ, ICAO: ANZ)
  'nz': 'anz', 'anz': 'anz', '新西兰航空': 'anz', 'Air New Zealand': 'anz',
  // 大溪地航空 (IATA: VT, ICAO: VTA)
  'vt': 'vta', 'vta': 'vta', '大溪地航空': 'vta', 'Air Tahiti Nui': 'vta',
  // 以色列航空 (IATA: LY, ICAO: ELY)
  'ly': 'ely', 'ely': 'ely', '以色列航空': 'ely', 'El Al': 'ely',
  // 南非商务航空 (IATA: 4Z, ICAO: LNK)
  '4z': 'lnk', 'lnk': 'lnk', '南非商务航空': 'lnk', 'Airlink': 'lnk',
  // 印度快运 (IATA: IX, ICAO: AXB)
  'ix': 'axb', 'axb': 'axb', '印度快运': 'axb', 'Air India Express': 'axb',
  // 靛蓝航空 (IATA: 6E, ICAO: IGO)
  '6e': 'igo', 'igo': 'igo', '靛蓝航空': 'igo', 'IndiGo': 'igo',
  // 斯里兰卡航空 (IATA: UL, ICAO: ALK)
  'ul': 'alk', 'alk': 'alk', '斯里兰卡航空': 'alk', 'SriLankan Airlines': 'alk',
  // 尼泊尔航空 (IATA: RA, ICAO: RNA)
  'ra': 'rna', 'rna': 'rna', '尼泊尔航空': 'rna', 'Nepal Airlines': 'rna',
  // 马尔代夫航空 (IATA: Q2, ICAO: DQA)
  'q2': 'dqa', 'dqa': 'dqa', '马尔代夫航空': 'dqa', 'Maldivian': 'dqa',
  // 巴基斯坦国际航空 (IATA: PK, ICAO: PIA)
  'pk': 'pia', 'pia': 'pia', '巴基斯坦国际航空': 'pia', 'PIA': 'pia',
  // 孟加拉航空 (IATA: BG, ICAO: BBC)
  'bg': 'bbc', 'bbc': 'bbc', '孟加拉航空': 'bbc', 'Biman Bangladesh Airlines': 'bbc',
  // 印度航空 (IATA: AI, ICAO: AIC)
  'ai': 'aic', 'aic': 'aic', '印度航空': 'aic', 'Air India': 'aic',
  // 香料航空 (IATA: SG, ICAO: SEJ)
  'sg': 'sej', 'sej': 'sej', '香料航空': 'sej', 'SpiceJet': 'sej',
}

// 航空公司简称关键字 -> logo code 的模糊匹配
const keywordMap = [
  ['国航', 'ca'], ['东方', 'mu'], ['南方', 'cz'], ['海南', 'hu'], ['春秋', '9c'],
  ['厦门', 'mf'], ['深圳', 'zh'], ['四川', '3u'], ['山东', 'sc'], ['天津', 'gs'],
  ['首都', 'jd'], ['上海', 'fm'], ['吉祥', 'ho'], ['华夏', 'g5'], ['联合', 'kn'],
  ['成都', 'eu'], ['西藏', 'tv'], ['长安', '9h'], ['青岛', 'qr'], ['奥凯', 'bk'],
  ['幸福', 'jy'], ['北部湾', 'gx'], ['东海', 'dz'], ['福州', 'fu'], ['金鹏', 'y8'],
  ['瑞丽', 'dr'], ['贵州', 'gy'], ['多彩', 'gy'], ['九元', 'aq'], ['昆明', 'ky'],
  ['长龙', 'gj'], ['祥鹏', '8l'], ['新华', 'cn'], ['西部', 'pn'], ['乌鲁木齐', 'uq'],
  ['重庆', 'oq'], ['河北', 'ns'], ['湖南', 'a6'], ['顺丰', 'o3'], ['桂林', 'gt'],
  ['澳门', 'nx'], ['大连', 'gm'], ['天骄', 'jt'], ['大湾区', 'hb'], ['快运', 'hx'],
  ['香港航空', 'hx_hk'], ['澜湄', 'lq'], ['华信', 'ae'], ['立荣', 'b7'], ['星宇', 'jx'],
  ['虎航', 'it'], ['货运', 'ck'],
  ['国泰', 'cx'], ['长荣', 'br'], ['中华航空', 'ci'],
  ['日本航空', 'jl'], ['全日空', 'nh'], ['大韩', 'ke'], ['韩亚', 'oz'],
  ['济州', '7c'], ['真航空', 'lj'], ['釜山', 'bx'], ['德威', 'tw'],
  ['酷航', 'tr'], ['新加坡', 'sq'], ['泰国', 'tg'], ['越南', 'vn'], ['曼谷', 'pg'],
  ['阿联酋', 'uae'], ['卡塔尔', 'qr'], ['阿提哈德', 'etd'],
  ['美联', 'ual'], ['达美', 'dal'], ['美国航空', 'aal'], ['英国', 'baw'],
  ['汉莎', 'dlh'], ['法航', 'afr'], ['荷航', 'klm'], ['维珍澳洲', 'va'],
  ['澳洲', 'qfa'], ['加拿大', 'aca'], ['土耳其', 'thy'], ['夏威夷', 'hal'],
  ['西南', 'swa'], ['阿拉斯加', 'asa'], ['捷蓝', 'jbu'], ['边疆', 'fft'],
  ['阿拉伯', 'aby'],
  ['俄航', 'afl'], ['俄罗斯', 'afl'], ['Aeroflot', 'afl'],
  ['西伯利亚', 'sbi'], ['S7', 'sbi'],
  ['胜利', 'pbd'], ['Pobeda', 'pbd'],
  ['皇家航空', 'rra'], ['Rossiya', 'rra'],
  ['UT航空', 'tua'], ['UTair', 'tua'],
  ['亚马尔', 'tym'], ['Yamal', 'tym'],
  ['红翼', 'wzk'], ['Red Wings', 'wzk'],
  ['拉塔姆', 'lan'], ['LATAM', 'lan'],
  ['戈尔', 'glo'], ['GOL', 'glo'],
  ['阿兹尔', 'azu'], ['Azul', 'azu'],
  ['哥伦比亚航空', 'ava'], ['Avianca', 'ava'],
  ['巴拿马航空', 'cmp'], ['Copa', 'cmp'],
  ['阿根廷航空', 'arg'], ['Aerolineas', 'arg'],
  ['菲律宾航空', 'pal'], ['Philippine', 'pal'],
  ['宿务', 'ceb'], ['Cebu', 'ceb'],
  ['亚洲航空', 'axm'], ['AirAsia', 'axm'],
  ['印尼亚洲', 'awq'], ['Indonesia AirAsia', 'awq'],
  ['泰国亚洲', 'aiq'], ['Thai AirAsia', 'aiq'],
  ['菲律宾亚洲', 'apz'], ['AirAsia Philippines', 'apz'],
  ['印尼鹰航', 'gia'], ['Garuda', 'gia'],
  ['马来西亚航空', 'mas'], ['Malaysia Airlines', 'mas'],
  ['文莱皇家', 'rba'], ['Royal Brunei', 'rba'],
  ['缅甸航空', 'mub'], ['Myanmar', 'mub'],
  ['柬埔寨航空', 'khv'], ['Cambodia Angkor', 'khv'],
  ['老挝航空', 'lao'], ['Lao Airlines', 'lao'],
  ['宿翱', 'srq'], ['Cebgo', 'srq'],
  ['北欧', 'sas'], ['SAS', 'sas'],
  ['芬兰', 'fin'], ['Finnair', 'fin'],
  ['爱尔兰', 'ein'], ['Aer Lingus', 'ein'],
  ['伊比利亚', 'ibe'], ['Iberia', 'ibe'],
  ['葡萄牙', 'tap'], ['TAP', 'tap'],
  ['瑞士', 'swr'], ['Swiss', 'swr'],
  ['奥地利', 'aua'], ['Austrian', 'aua'],
  ['布鲁塞尔', 'bel'], ['Brussels', 'bel'],
  ['捷克', 'csa'], ['Czech', 'csa'],
  ['波兰', 'lot'], ['LOT', 'lot'],
  ['爱琴海', 'aee'], ['Aegean', 'aee'],
  ['罗马尼亚', 'rot'], ['Tarom', 'rot'],
  ['克罗地亚', 'ctn'], ['Croatia', 'ctn'],
  ['塞尔维亚', 'asl'], ['Air Serbia', 'asl'],
  ['冰岛', 'ice'], ['Icelandair', 'ice'],
  ['维珍', 'vir'], ['Virgin Atlantic', 'vir'],
  ['易捷', 'ezy'], ['easyJet', 'ezy'],
  ['瑞安', 'ryr'], ['Ryanair', 'ryr'],
  ['挪威', 'nax'], ['Norwegian', 'nax'],
  ['途易', 'tui'], ['TUIfly', 'tui'],
  ['威兹', 'wzz'], ['Wizz', 'wzz'],
  ['精神', 'nks'], ['Spirit', 'nks'],
  ['忠实', 'aay'], ['Allegiant', 'aay'],
  ['太阳城', 'scx'], ['Sun Country', 'scx'],
  ['斐济', 'fji'], ['Fiji', 'fji'],
  ['新西兰', 'anz'], ['Air New Zealand', 'anz'],
  ['大溪地', 'vta'], ['Air Tahiti', 'vta'],
  ['以色列', 'ely'], ['El Al', 'ely'],
  ['南非商务', 'lnk'], ['Airlink', 'lnk'],
  ['印度快运', 'axb'], ['Air India Express', 'axb'],
  ['靛蓝', 'igo'], ['IndiGo', 'igo'],
  ['斯里兰卡', 'alk'], ['SriLankan', 'alk'],
  ['尼泊尔', 'rna'], ['Nepal', 'rna'],
  ['马尔代夫', 'dqa'], ['Maldivian', 'dqa'],
  ['巴基斯坦', 'pia'], ['PIA', 'pia'],
  ['孟加拉', 'bbc'], ['Biman', 'bbc'],
  ['埃及', 'msr'], ['EgyptAir', 'msr'],
  ['摩洛哥', 'ram'], ['Royal Air Maroc', 'ram'],
  ['埃塞俄比亚', 'eth'], ['Ethiopian', 'eth'],
  ['肯尼亚', 'kqa'], ['Kenya', 'kqa'],
  ['南非航空', 'saa'], ['South African', 'saa'],
  ['迪拜航空', 'fdb'], ['flydubai', 'fdb'],
  ['科威特', 'kac'], ['Kuwait', 'kac'],
  ['海湾', 'gba'], ['Gulf Air', 'gba'],
  ['阿曼', 'oma'], ['Oman', 'oma'],
]

// 从航班号提取航司二字码 (e.g., "CA1234" -> "ca")
export function extractIataFromFlightNo(flightNo) {
  if (!flightNo) return null
  const match = flightNo.match(/^([A-Z0-9]{2})/i)
  return match ? match[1].toLowerCase() : null
}

// 主函数: 根据航班信息获取logo文件名 (without extension)
export function getAirlineLogoCode(airlineCode, airlineName, flightNo) {
  // 1. 优先从航班号提取二字码 (最可靠)
  if (flightNo) {
    const iata = extractIataFromFlightNo(flightNo)
    if (iata && airlineLogoMap[iata]) return airlineLogoMap[iata]
  }

  // 2. 尝试 airlineCode 精确匹配
  if (airlineCode) {
    const code = airlineCode.replace(/\s+/g, '').toLowerCase()
    if (airlineLogoMap[code]) return airlineLogoMap[code]
  }

  // 3. 尝试 airlineName 精确匹配
  if (airlineName) {
    const name = airlineName.trim()
    if (airlineLogoMap[name]) return airlineLogoMap[name]
  }

  // 4. 模糊匹配: 用关键字在 airlineName 中查找
  if (airlineName) {
    const name = airlineName.trim()
    for (const [keyword, code] of keywordMap) {
      if (name.includes(keyword)) return code
    }
  }

  return null
}

// 获取logo图片URL (tries .svg first, then .png, then ICAO 3-letter code)
export function getAirlineLogoSrc(airlineCode, airlineName, flightNo) {
  const code = getAirlineLogoCode(airlineCode, airlineName, flightNo)
  if (!code) return '/assets/airline-logos/default.svg'
  
  // Try SVG first (usually 2-letter IATA)
  return `/assets/airline-logos/${code}.svg`
}

// 已知存在的logo文件名集合（用于判断用二字码还是三字码）
// 二字码PNG存在列表（有对应图片的IATA代码）
const existingIataPngs = new Set([
  'ca', 'mu', 'cz', 'hu', '9c', 'mf', 'zh', '3u', 'sc', 'gs', 'jd', 'fm', 'ho',
  'g5', 'kn', 'eu', 'tv', '9h', 'qr', 'bk', 'jy', 'gx', 'dz', 'fu', 'y8', 'dr',
  'gy', 'aq', 'ky', 'gj', '8l', 'cn', 'pn', 'uq', 'oq', 'ns', 'a6', 'o3', 'gt',
  'nx', 'gm', 'jt', 'hb', 'hx', 'lq', 'ae', 'b7', 'jx', 'it', 'ck', 'cx', 'br',
  'ci', 'jl', 'nh', 'ke', 'oz', '7c', 'lj', 'bx', 'sq', 'tg', 'vn', 'pg',
  'tr', 'tw'
])

// 获取PNG回退URL - 先尝试2字母码，再尝试3字母ICAO码
export function getAirlineLogoPngSrc(airlineCode, airlineName, flightNo) {
  // 1. 先尝试从主函数获取目标logo代码
  const targetCode = getAirlineLogoCode(airlineCode, airlineName, flightNo)
  if (!targetCode) {
    // 没有匹配到任何航空公司，尝试直接用三字码
    if (flightNo) {
      const iata = extractIataFromFlightNo(flightNo)
      if (iata) {
        // 查找该IATA对应的ICAO代码
        for (const [key, value] of Object.entries(airlineLogoMap)) {
          if (key.length === 3 && /^[a-z]{3}$/.test(key) && key !== value) {
            if (value === iata || airlineLogoMap[iata] === value) {
              return `/assets/airline-logos/${key}.png`
            }
          }
        }
      }
    }
    return '/assets/airline-logos/default.png'
  }
  
  // 2. 如果目标代码是2字母IATA码且不存在对应PNG文件，查找三字码ICAO
  if (targetCode.length === 2 && !existingIataPngs.has(targetCode)) {
    // 查找该IATA对应的ICAO代码
    for (const [key, value] of Object.entries(airlineLogoMap)) {
      if (key.length === 3 && /^[a-z]{3}$/.test(key) && key !== value && value === targetCode) {
        return `/assets/airline-logos/${key}.png`
      }
    }
  }
  
  // 3. 目标代码有对应的PNG文件，直接返回
  return `/assets/airline-logos/${targetCode}.png`
}
