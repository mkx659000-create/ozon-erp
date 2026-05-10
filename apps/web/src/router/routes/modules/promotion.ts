import type { RouteRecordRaw } from 'vue-router';

const promotionRoutes: RouteRecordRaw[] = [
  {
    path: '/promotion',
    name: 'Promotion',
    redirect: '/promotion/activities',
    meta: { title: 'OZON促销', icon: 'fire-outlined' },
    children: [
      {
        path: 'activities',
        name: 'PromotionActivities',
        component: () => import('@/views/promotion/index.vue'),
        meta: { title: 'OZON促销活动' },
      },
    ],
  },
];

export default promotionRoutes;
