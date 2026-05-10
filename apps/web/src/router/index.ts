import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import productRoutes from './routes/modules/product';
import promotionRoutes from './routes/modules/promotion';

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
      ...productRoutes.flatMap((r) => r.children || []),
      ...promotionRoutes.flatMap((r) => r.children || []),
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

export { productRoutes, promotionRoutes };
