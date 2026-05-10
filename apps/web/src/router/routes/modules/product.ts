import type { RouteRecordRaw } from 'vue-router';

const productRoutes: RouteRecordRaw[] = [
  {
    path: '/product',
    name: 'Product',
    redirect: '/product/online',
    meta: { title: 'OZON产品', icon: 'shopping-outlined' },
    children: [
      {
        path: 'online',
        name: 'ProductOnline',
        component: () => import('@/views/product/online/index.vue'),
        meta: { title: 'OZON在线产品' },
      },
      {
        path: 'publish',
        name: 'ProductPublish',
        component: () => import('@/views/product/publish/index.vue'),
        meta: { title: 'OZON产品刊登' },
      },
    ],
  },
];

export default productRoutes;
