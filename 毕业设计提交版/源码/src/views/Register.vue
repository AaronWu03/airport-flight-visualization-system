<template>
  <div class="register-container">
    <div class="stars"></div>
    <div class="flight-paths">
      <div class="path p1"></div>
      <div class="path p2"></div>
    </div>

    <div class="register-card">
      <div class="register-header">
        <div class="pulse-icon"></div>
        <h2>注册</h2>
        <p>CREATE YOUR ACCOUNT</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
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

        <div class="input-group">
          <input 
            type="password" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码" 
            class="form-input"
            required
          />
          <label>确认密码 / CONFIRM PASSWORD</label>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          {{ success }}
        </div>

        <button type="submit" class="register-btn" :disabled="isLoading">
          {{ isLoading ? '注册中...' : '注册' }}
        </button>

        <div class="login-link">
          已有账号？<router-link to="/login">立即登录</router-link>
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
import { registerUser } from '../utils/userStore'

const router = useRouter()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const isLoading = ref(false)

const handleRegister = () => {
  if (!username.value || !password.value || !confirmPassword.value) {
    error.value = '请填写完整的注册信息'
    return
  }

  if (username.value.length < 3) {
    error.value = '用户名至少需要3个字符'
    return
  }

  if (password.value.length < 6) {
    error.value = '密码至少需要6个字符'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  isLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = registerUser(username.value, password.value)
    if (result.success) {
      success.value = '注册成功！正在跳转到登录页面...'
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      error.value = result.message
    }
  } catch (err) {
    error.value = '注册失败，请稍后重试'
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

.register-container {
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

.register-card {
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

.register-header {
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

.register-header h2 {
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

.register-header p {
  color: #64748b;
  font-size: 0.82rem;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.register-form {
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #fdd000;
  box-shadow: 0 0 15px rgba(253, 208, 0, 0.3);
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
  padding: 8px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.success-message {
  color: #27ae60;
  font-size: 0.9rem;
  text-align: center;
  padding: 8px;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(39, 174, 96, 0.3);
}

.register-btn {
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

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.login-link a {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  color: #fdd000;
  text-decoration: underline;
}

.back-home {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.back-home a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.3s ease;
}

.back-home a:hover {
  color: #38bdf8;
}
</style>
