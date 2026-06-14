const HISTORY_TRIPS_KEY = 'flight_system_history_trips'
import { getCurrentUser } from './userStore'

export const getHistoryTrips = () => {
  const user = getCurrentUser()
  if (!user) return []
  
  const data = localStorage.getItem(`${HISTORY_TRIPS_KEY}_${user.username}`)
  return data ? JSON.parse(data) : []
}

export const saveHistoryTrips = (trips) => {
  const user = getCurrentUser()
  if (!user) return
  
  localStorage.setItem(`${HISTORY_TRIPS_KEY}_${user.username}`, JSON.stringify(trips))
}

export const addHistoryTrip = (trip) => {
  const user = getCurrentUser()
  if (!user) return
  
  let trips = getHistoryTrips()
  
  trips.unshift({
    ...trip,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  })
  
  saveHistoryTrips(trips)
  return trips
}

export const deleteHistoryTrip = (tripId) => {
  let trips = getHistoryTrips()
  trips = trips.filter(t => t.id !== tripId)
  saveHistoryTrips(trips)
  return trips
}

export const clearHistoryTrips = () => {
  const user = getCurrentUser()
  if (!user) return
  
  localStorage.removeItem(`${HISTORY_TRIPS_KEY}_${user.username}`)
}

export const updateHistoryTrip = (tripId, updates) => {
  let trips = getHistoryTrips()
  const index = trips.findIndex(t => t.id === tripId)
  
  if (index !== -1) {
    trips[index] = { ...trips[index], ...updates, updatedAt: new Date().toISOString() }
    saveHistoryTrips(trips)
  }
  
  return trips
}
