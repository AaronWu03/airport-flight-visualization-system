<template>
  <div class="login-container">
    <div class="stars"></div>
    <div class="flight-paths">
      <div class="path p1"></div>
      <div class="path p2"></div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <div class="pulse-icon"></div>
        <h2>登录</h2>
        <p>LOGIN TO YOUR ACCOUNT</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <input 
            type="text" 
            v-model="username" 
            placeholder="请输入用户名" 
            class="form-input"
            required
          />
          <label>用户名 / USERNAME</label>
        </div>

        <div class="input-group">
          <input 
            type="password" 
            v-model="password" 
            placeholder="请输入密码" 
            class="form-input"
            required
          />
          <label>密码 / PASSWORD</label>
        </div>

        <div class="remember-me">
          <input type="checkbox" id="rememberMe" v-model="rememberMe" />
          <label for="rememberMe">记住密码</label>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>

        <div class="register-link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </form>

      <div class="back-home">
        <router-link to="/">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser } from '../utils/userStore'

const router = useRouter()
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const error = ref('')
const isLoading = ref(false)

const handleLogin = () => {
  if (!username.value || !password.value) {
    error.value = '请填写完整的登录信息'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = loginUser(username.value, password.value, rememberMe.value)
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.message
    }
  } catch (err) {
    error.value = '登录失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8eef5 50%, #dce6f0 100%);
  overflow: hidden;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20% 30%, rgba(56, 189, 248, 0.2) 100%, transparent),
    radial-gradient(1.5px 1.5px at 40% 70%, rgba(56, 189, 248, 0.15) 100%, transparent),
    radial-gradient(2px 2px at 60% 40%, rgba(16, 185, 129, 0.15) 100%, transparent),
    radial-gradient(2.5px 2.5px at 80% 10%, rgba(253, 208, 0, 0.12) 100%, transparent),
    radial-gradient(1.5px 1.5px at 10% 90%, rgba(56, 189, 248, 0.18) 100%, transparent),
    radial-gradient(2px 2px at 90% 80%, rgba(16, 185, 129, 0.12) 100%, transparent);
  background-size: 300px 300px;
  opacity: 0.6;
  animation: starRotate 200s linear infinite;
}

.flight-paths {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.25;
}

.path {
  position: absolute;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 50%;
}

.p1 { width: 800px; height: 300px; top: 10%; left: -10%; transform: rotate(-15deg); }
.p2 { width: 600px; height: 200px; bottom: 20%; right: -5%; transform: rotate(10deg); }

@keyframes starRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.login-card {
  position: relative;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(56, 189, 248, 0.08);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.pulse-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px #38bdf8, 0 0 20px #38bdf8;
  animation: pulse 2s infinite;
  margin: 0 auto 15px;
}

@keyframes pulse {
  0% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
  50% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.7); }
  100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
}

.login-header h2 {
  font-size: 2rem;
  letter-spacing: 2px;
  font-weight: 700;
  background: linear-gradient(90deg, #1e3a5f 0%, #38bdf8 50%, #0ea5e9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
  margin-bottom: 8px;
}

.login-header p {
  color: #64748b;
  font-size: 0.82rem;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.8rem;
  color: #38bdf8;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.form-input {
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #1e293b;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 0.9rem;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.remember-me label {
  cursor: pointer;
}

.error-message {
  color: #b91c1c;
  font-size: 0.9rem;
  text-align: center;
  padding: 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  color: #475569;
  font-size: 0.9rem;
}

.register-link a {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  color: #0ea5e9;
  text-decoration: underline;
}

.back-home {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.back-home a {
  color: #64748b;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.3s ease;
}

.back-home a:hover {
  color: #38bdf8;
}
</style>
