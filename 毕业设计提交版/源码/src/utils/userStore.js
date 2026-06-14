const USER_STORAGE_KEY = 'flight_system_users'
const CURRENT_USER_KEY = 'flight_system_current_user'
const RECENT_SEARCH_KEY = 'flight_system_recent_searches'

export const getStoredUsers = () => {
  const data = localStorage.getItem(USER_STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}

export const saveUsers = (users) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users))
}

export const registerUser = (username, password) => {
  const users = getStoredUsers()
  if (users[username]) {
    return { success: false, message: '用户名已存在' }
  }
  users[username] = { password, createdAt: new Date().toISOString() }
  saveUsers(users)
  return { success: true, message: '注册成功' }
}

export const loginUser = (username, password, rememberMe = false) => {
  const users = getStoredUsers()
  if (!users[username]) {
    return { success: false, message: '用户名不存在' }
  }
  if (users[username].password !== password) {
    return { success: false, message: '密码错误' }
  }
  
  const userData = { username, loginAt: new Date().toISOString() }
  if (rememberMe) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData))
  } else {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData))
  }
  
  return { success: true, message: '登录成功', user: userData }
}

export const getCurrentUser = () => {
  let data = localStorage.getItem(CURRENT_USER_KEY)
  if (!data) {
    data = sessionStorage.getItem(CURRENT_USER_KEY)
  }
  return data ? JSON.parse(data) : null
}

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY)
  sessionStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem(RECENT_SEARCH_KEY)
}

export const addRecentSearch = (search) => {
  const user = getCurrentUser()
  if (!user) return
  
  let searches = JSON.parse(localStorage.getItem(`${RECENT_SEARCH_KEY}_${user.username}`) || '[]')
  
  // 根据搜索类型生成唯一标识
  const getUniqueKey = (item) => {
    if (item.type === 'flightNumber') {
      return `flight_${item.flightNumber}_${item.date}`
    } else if (item.type === 'route') {
      return `route_${item.departure}_${item.arrival}_${item.date}`
    } else if (item.type === 'airport') {
      return `airport_${item.airportCode}_${item.date}`
    }
    return ''
  }
  
  const newKey = getUniqueKey(search)
  
  // 移除已存在的相同记录
  searches = searches.filter(item => getUniqueKey(item) !== newKey)
  
  // 将新记录添加到最前面
  searches.unshift({
    ...search,
    timestamp: new Date().toISOString()
  })
  
  // 限制最多显示10条
  searches = searches.slice(0, 10)
  localStorage.setItem(`${RECENT_SEARCH_KEY}_${user.username}`, JSON.stringify(searches))
}

export const getRecentSearches = () => {
  const user = getCurrentUser()
  if (!user) return []
  
  return JSON.parse(localStorage.getItem(`${RECENT_SEARCH_KEY}_${user.username}`) || '[]')
}

export const clearRecentSearches = () => {
  const user = getCurrentUser()
  if (!user) return
  
  localStorage.removeItem(`${RECENT_SEARCH_KEY}_${user.username}`)
}
