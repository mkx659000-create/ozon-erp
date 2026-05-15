<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Form,
  FormItem,
  Input,
  InputPassword,
  Button,
  message,
} from 'ant-design-vue';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons-vue';
import { useUserStore } from '@/store';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const mode = ref<'login' | 'register'>('login');

const loginForm = reactive({ username: '', password: '' });
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  nickname: '',
});

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    message.warning('请填写用户名和密码');
    return;
  }
  loading.value = true;
  try {
    await userStore.login(loginForm);
    message.success('登录成功');
    router.push('/');
  } catch { /* interceptor */ } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.nickname) {
    message.warning('请填写所有字段');
    return;
  }
  loading.value = true;
  try {
    await userStore.register(registerForm);
    message.success('注册成功');
    router.push('/');
  } catch { /* interceptor */ } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Animated background -->
    <div class="bg-grid" />
    <div class="bg-glow bg-glow--1" />
    <div class="bg-glow bg-glow--2" />
    <div class="bg-glow bg-glow--3" />

    <div class="login-container">
      <!-- Logo & Brand -->
      <div class="brand">
        <div class="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#6366f1"/>
            <path d="M2 17l10 5 10-5" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="brand-title">Ozon ERP</h1>
        <p class="brand-subtitle">跨境电商卖家管理系统</p>
      </div>

      <!-- Card -->
      <div class="login-card">
        <!-- Mode Toggle -->
        <div class="mode-toggle">
          <button
            :class="['mode-btn', { 'mode-btn--active': mode === 'login' }]"
            @click="mode = 'login'"
          >登录</button>
          <button
            :class="['mode-btn', { 'mode-btn--active': mode === 'register' }]"
            @click="mode = 'register'"
          >注册</button>
          <div
            class="mode-indicator"
            :style="{ transform: mode === 'register' ? 'translateX(100%)' : 'translateX(0)' }"
          />
        </div>

        <!-- Login Form -->
        <Form v-if="mode === 'login'" @submit.prevent="handleLogin" layout="vertical" class="login-form">
          <div class="form-field">
            <label class="field-label">用户名</label>
            <Input
              v-model:value="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              autocomplete="username"
              class="field-input"
            >
              <template #prefix><UserOutlined class="field-icon" /></template>
            </Input>
          </div>
          <div class="form-field">
            <label class="field-label">密码</label>
            <InputPassword
              v-model:value="loginForm.password"
              placeholder="请输入密码"
              size="large"
              autocomplete="current-password"
              class="field-input"
            >
              <template #prefix><LockOutlined class="field-icon" /></template>
            </InputPassword>
          </div>
          <Button
            type="primary"
            html-type="submit"
            size="large"
            block
            :loading="loading"
            class="submit-btn"
          >
            登录
          </Button>
        </Form>

        <!-- Register Form -->
        <Form v-else @submit.prevent="handleRegister" layout="vertical" class="login-form">
          <div class="form-field">
            <label class="field-label">用户名</label>
            <Input v-model:value="registerForm.username" placeholder="请输入用户名" size="large" autocomplete="username" class="field-input">
              <template #prefix><UserOutlined class="field-icon" /></template>
            </Input>
          </div>
          <div class="form-field">
            <label class="field-label">邮箱</label>
            <Input v-model:value="registerForm.email" placeholder="请输入邮箱" size="large" autocomplete="email" class="field-input">
              <template #prefix><MailOutlined class="field-icon" /></template>
            </Input>
          </div>
          <div class="form-field">
            <label class="field-label">昵称</label>
            <Input v-model:value="registerForm.nickname" placeholder="请输入昵称" size="large" class="field-input">
              <template #prefix><UserOutlined class="field-icon" /></template>
            </Input>
          </div>
          <div class="form-field">
            <label class="field-label">密码</label>
            <InputPassword v-model:value="registerForm.password" placeholder="至少6位密码" size="large" autocomplete="new-password" class="field-input">
              <template #prefix><LockOutlined class="field-icon" /></template>
            </InputPassword>
          </div>
          <Button
            type="primary"
            html-type="submit"
            size="large"
            block
            :loading="loading"
            class="submit-btn"
          >
            注册
          </Button>
        </Form>
      </div>

      <p class="footer-text">Ozon ERP &copy; 2024 - 2026</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #09090b;
  position: relative;
  overflow: hidden;
}

/* ─── Background Effects ─── */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: glow-float 20s ease-in-out infinite;
}
.bg-glow--1 {
  width: 500px;
  height: 500px;
  background: #6366f1;
  top: -15%;
  right: -10%;
  opacity: 0.15;
}
.bg-glow--2 {
  width: 400px;
  height: 400px;
  background: #8b5cf6;
  bottom: -10%;
  left: -8%;
  opacity: 0.12;
  animation-delay: -7s;
}
.bg-glow--3 {
  width: 300px;
  height: 300px;
  background: #3b82f6;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.06;
  animation-delay: -14s;
}

@keyframes glow-float {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(20px, -20px); }
  66% { transform: translate(-15px, 15px); }
}

/* ─── Container ─── */
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
}

/* ─── Brand ─── */
.brand {
  text-align: center;
  margin-bottom: 32px;
}
.brand-mark {
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
  border-radius: 14px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.03em;
}
.brand-subtitle {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-weight: 400;
}

/* ─── Card ─── */
.login-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* ─── Mode Toggle ─── */
.mode-toggle {
  display: flex;
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 24px;
}
.mode-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  z-index: 1;
  border-radius: 8px;
  transition: color 0.2s;
  font-family: inherit;
}
.mode-btn--active {
  color: #fff;
}
.mode-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  background: rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(99, 102, 241, 0.4);
}

/* ─── Form ─── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
}
.field-icon {
  color: rgba(255, 255, 255, 0.25) !important;
}
.field-input :deep(.ant-input),
.field-input :deep(.ant-input-affix-wrapper) {
  background: rgba(255, 255, 255, 0.04) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  height: 44px !important;
  border-radius: 10px !important;
}
.field-input :deep(.ant-input::placeholder) {
  color: rgba(255, 255, 255, 0.2) !important;
}
.field-input :deep(.ant-input:focus),
.field-input :deep(.ant-input-affix-wrapper:focus),
.field-input :deep(.ant-input-affix-wrapper-focused) {
  border-color: rgba(99, 102, 241, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15) !important;
}
.field-input :deep(.ant-input-password-icon) {
  color: rgba(255, 255, 255, 0.3) !important;
}

.submit-btn {
  height: 46px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  margin-top: 4px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
  transition: box-shadow 0.2s, transform 0.2s !important;
}
.submit-btn:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5) !important;
  transform: translateY(-1px);
}

/* ─── Footer ─── */
.footer-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.15);
  font-size: 12px;
  margin-top: 24px;
}
</style>
