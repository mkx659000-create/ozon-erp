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
    <Card class="login-card" :bordered="false">
      <div class="login-title">
        <h1>Ozon ERP</h1>
        <p>卖家管理系统</p>
      </div>

      <Tabs v-model:activeKey="activeTab" centered>
        <TabPane key="login" tab="登录">
          <Form @submit.prevent="handleLogin" layout="vertical">
            <FormItem>
              <Input
                v-model:value="loginForm.username"
                placeholder="用户名"
                size="large"
              >
                <template #prefix><UserOutlined /></template>
              </Input>
            </FormItem>
            <FormItem>
              <InputPassword
                v-model:value="loginForm.password"
                placeholder="密码"
                size="large"
              >
                <template #prefix><LockOutlined /></template>
              </InputPassword>
            </FormItem>
            <FormItem>
              <Button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="loading"
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
              >
                <template #prefix><UserOutlined /></template>
              </Input>
            </FormItem>
            <FormItem>
              <Input
                v-model:value="registerForm.email"
                placeholder="邮箱"
                size="large"
              >
                <template #prefix><MailOutlined /></template>
              </Input>
            </FormItem>
            <FormItem>
              <Input
                v-model:value="registerForm.nickname"
                placeholder="昵称"
                size="large"
              >
                <template #prefix><UserOutlined /></template>
              </Input>
            </FormItem>
            <FormItem>
              <InputPassword
                v-model:value="registerForm.password"
                placeholder="密码（至少6位）"
                size="large"
              >
                <template #prefix><LockOutlined /></template>
              </InputPassword>
            </FormItem>
            <FormItem>
              <Button
                type="primary"
                html-type="submit"
                size="large"
                block
                :loading="loading"
              >
                注册
              </Button>
            </FormItem>
          </Form>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.login-title {
  text-align: center;
  margin-bottom: 24px;
}
.login-title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
}
.login-title p {
  margin: 4px 0 0;
  color: #999;
  font-size: 14px;
}
</style>
