import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const Layout = () => import('@/views/_core/layout/index.vue');

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/_core/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页' },
      },
      // Product routes
      {
        path: 'product/online',
        name: 'ProductOnline',
        component: () => import('@/views/product/online/index.vue'),
        meta: { title: 'OZON在线产品' },
      },
      {
        path: 'product/publish',
        name: 'ProductPublish',
        component: () => import('@/views/product/publish/index.vue'),
        meta: { title: 'OZON产品刊登' },
      },
      // Promotion routes
      {
        path: 'promotion/activities',
        name: 'PromotionActivities',
        component: () => import('@/views/promotion/index.vue'),
        meta: { title: 'OZON促销活动' },
      },
      // Order routes
      {
        path: 'order/list',
        name: 'OrderList',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单管理' },
      },
      // Analytics
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/index.vue'),
        meta: { title: '数据分析' },
      },
      // Store management
      {
        path: 'store-accounts',
        name: 'StoreAccounts',
        component: () => import('@/views/store-account/index.vue'),
        meta: { title: '店铺管理' },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token');
  if (to.meta.public || token) {
    next();
  } else {
    next('/login');
  }
});
