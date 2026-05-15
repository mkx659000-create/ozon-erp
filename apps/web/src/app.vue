<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ConfigProvider, theme } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

const themeConfig = {
  token: {
    colorPrimary: '#6366f1',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    controlHeight: 36,
    wireframe: false,
  },
  algorithm: theme.defaultAlgorithm,
};
</script>

<template>
  <ConfigProvider :locale="zhCN" :theme="themeConfig">
    <RouterView />
  </ConfigProvider>
</template>
