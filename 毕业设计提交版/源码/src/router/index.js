import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import FlightDetail from '../views/FlightDetail.vue'
import AirportMap from '../views/AirportMap.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import HistoryTrip from '../views/HistoryTrip.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/history-trips',
    name: 'HistoryTrip',
    component: HistoryTrip
  },
  {
    path: '/flight/:flightNumber?',
    name: 'FlightDetail',
    component: FlightDetail,
    props: true
  },
  {
    path: '/flightdetail',
    name: 'FlightDetailQuery',
    component: FlightDetail
  },
  {
    path: '/airports',
    name: 'AirportMap',
    component: AirportMap
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router