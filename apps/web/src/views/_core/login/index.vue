<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Form,
  FormItem,
  Input,
  InputPassword,
  Button,
  Tabs,
  TabPane,
  message,
  Divider,
} from 'ant-design-vue';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons-vue';
import { useUserStore } from '@/store';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const activeTab = ref('login');

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
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  if (
    !registerForm.username ||
    !registerForm.email ||
    !registerForm.password ||
    !registerForm.nickname
  ) {
    message.warning('请填写所有字段');
    return;
  }
  loading.value = true;
  try {
    await userStore.register(registerForm);
    message.success('注册成功');
    router.push('/');
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <Card class="login-card" :bordered="false">
        <div class="login-header">
          <div class="login-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <rect width="40" height="40" rx="8" fill="#1890ff"/>
              <path d="M10 20C10 14.477 14.477 10 20 10C25.523 10 30 14.477 30 20C30 25.523 25.523 30 20 30C14.477 30 10 25.523 10 20Z" stroke="white" stroke-width="2.5"/>
              <path d="M15.5 20L18.5 23L24.5 17" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="login-title">Ozon ERP</h1>
          <p class="login-subtitle">跨境电商卖家管理系统</p>
        </div>

        <Tabs v-model:activeKey="activeTab" centered class="login-tabs">
          <TabPane key="login" tab="登录">
            <Form @submit.prevent="handleLogin" layout="vertical">
              <FormItem>
                <Input
                  v-model:value="loginForm.username"
                  placeholder="用户名"
                  size="large"
                  autocomplete="username"
                >
                  <template #prefix><UserOutlined style="color: #bfbfbf" /></template>
                </Input>
              </FormItem>
              <FormItem>
                <InputPassword
                  v-model:value="loginForm.password"
                  placeholder="密码"
                  size="large"
                  autocomplete="current-password"
                >
                  <template #prefix><LockOutlined style="color: #bfbfbf" /></template>
                </InputPassword>
              </FormItem>
              <FormItem style="margin-bottom: 12px">
                <Button
                  type="primary"
                  html-type="submit"
                  size="large"
                  block
                  :loading="loading"
                  class="login-btn"
                >
                  登录
                </Button>
              </FormItem>
            </Form>
          </TabPane>

          <TabPane key="register" tab="注册">
            <Form @submit.prevent="handleRegister" layout="vertical">
              <FormItem>
                <Input
                  v-model:value="registerForm.username"
                  placeholder="用户名"
                  size="large"
                  autocomplete="username"
                >
                  <template #prefix><UserOutlined style="color: #bfbfbf" /></template>
                </Input>
              </FormItem>
              <FormItem>
                <Input
                  v-model:value="registerForm.email"
                  placeholder="邮箱"
                  size="large"
                  autocomplete="email"
                >
                  <template #prefix><MailOutlined style="color: #bfbfbf" /></template>
                </Input>
              </FormItem>
              <FormItem>
                <Input
                  v-model:value="registerForm.nickname"
                  placeholder="昵称"
                  size="large"
                >
                  <template #prefix><UserOutlined style="color: #bfbfbf" /></template>
                </Input>
              </FormItem>
              <FormItem>
                <InputPassword
                  v-model:value="registerForm.password"
                  placeholder="密码（至少6位）"
                  size="large"
                  autocomplete="new-password"
                >
                  <template #prefix><LockOutlined style="color: #bfbfbf" /></template>
                </InputPassword>
              </FormItem>
              <FormItem style="margin-bottom: 12px">
                <Button
                  type="primary"
                  html-type="submit"
                  size="large"
                  block
                  :loading="loading"
                  class="login-btn"
                >
                  注册
                </Button>
              </FormItem>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
      <div class="login-footer">Ozon ERP &copy; 2024-2026</div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow: hidden;
}
.login-page::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(24, 144, 255, 0.15) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  border-radius: 50%;
}
.login-page::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(114, 46, 209, 0.12) 0%, transparent 70%);
  bottom: -80px;
  left: -80px;
  border-radius: 50%;
}

.login-container {
  position: relative;
  z-index: 1;
}

.login-card {
  width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 8px;
}
.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.login-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1890ff;
  letter-spacing: 1px;
}
.login-subtitle {
  margin: 4px 0 0;
  color: #999;
  font-size: 13px;
}

.login-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 20px;
}
.login-tabs :deep(.ant-tabs-tab) {
  font-size: 15px;
}

.login-btn {
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  margin-top: 24px;
}
</style>
