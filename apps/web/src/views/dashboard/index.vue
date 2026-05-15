<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Row,
  Col,
  Spin,
  Button,
  Empty,
  Alert,
  Tag,
} from 'ant-design-vue';
import {
  ShoppingOutlined,
  FireOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  ShopOutlined,
  DollarOutlined,
  RollbackOutlined,
  InboxOutlined,
  StarOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore, useUserStore } from '@/store';
import { getDashboardOverviewApi, type DashboardOverview } from '@/api/dashboard';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const router = useRouter();
const userStore = useUserStore();
const storeAccountStore = useStoreAccountStore();
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');

const loading = ref(false);
const overview = ref<DashboardOverview | null>(null);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const userName = computed(() =>
  userStore.userInfo?.nickname || userStore.userInfo?.username || '用户',
);

const lastSyncText = computed(() => {
  if (!overview.value?.lastSync?.completedAt) return '--';
  return dayjs(overview.value.lastSync.completedAt).fromNow();
});

const syncTypeMap: Record<string, string> = {
  PRODUCT: '产品同步', PROMOTION: '促销同步', ORDER: '订单同步',
  STOCK: '库存同步', FINANCE: '财务同步', RETURNS: '退货同步',
  WAREHOUSE: '仓库同步', RATING: '评分同步', CATEGORY: '分类同步', ANALYTICS: '分析同步',
};

const syncStatusConfig: Record<string, { color: string; label: string }> = {
  SUCCESS: { color: 'green', label: '成功' },
  RUNNING: { color: 'blue', label: '运行中' },
  FAILED: { color: 'red', label: '失败' },
  PARTIAL_FAILURE: { color: 'orange', label: '部分失败' },
};

const hasStore = computed(() => storeAccountStore.stores.length > 0);

async function fetchOverview() {
  loading.value = true;
  try {
    overview.value = await getDashboardOverviewApi(storeAccountId.value || undefined);
  } catch {
    overview.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetchOverview());
watch(storeAccountId, () => fetchOverview());

interface QuickLink {
  title: string;
  desc: string;
  icon: any;
  route: string;
  gradient: string;
}

const quickLinks: QuickLink[] = [
  { title: '产品管理', desc: '管理在线产品', icon: ShoppingOutlined, route: 'ProductOnline', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { title: '促销活动', desc: '管理促销商品', icon: FireOutlined, route: 'PromotionActivities', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { title: '订单管理', desc: '查看处理订单', icon: ShoppingCartOutlined, route: 'OrderList', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { title: '数据分析', desc: '营收数据分析', icon: BarChartOutlined, route: 'Analytics', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  { title: '产品刊登', desc: '上架新产品', icon: ArrowUpOutlined, route: 'ProductPublish', gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf)' },
  { title: '店铺管理', desc: '管理 Ozon 店铺', icon: ShopOutlined, route: 'StoreAccounts', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
];
</script>

<template>
  <div>
    <!-- Welcome -->
    <div class="welcome-section">
      <div>
        <h2 class="welcome-title">{{ greeting }}，{{ userName }}</h2>
        <p class="welcome-desc">欢迎使用 Ozon ERP 卖家管理系统</p>
      </div>
      <Button @click="fetchOverview" :loading="loading" class="refresh-btn">
        <template #icon><ReloadOutlined /></template>
        刷新数据
      </Button>
    </div>

    <!-- No Store Alert -->
    <div v-if="!hasStore" class="alert-bar">
      <div class="alert-content">
        <ShopOutlined style="font-size: 18px; color: var(--color-warning)" />
        <span>您还没有添加店铺，请先添加 Ozon 店铺以开始使用。</span>
        <Button type="link" size="small" @click="router.push({ name: 'StoreAccounts' })">
          前往添加 <RightOutlined />
        </Button>
      </div>
    </div>

    <Spin :spinning="loading">
      <!-- Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card" @click="router.push({ name: 'ProductOnline' })">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, #6366f1, #818cf8)">
            <ShoppingOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">在线产品</span>
            <div class="stat-value-row">
              <span class="stat-value">{{ overview?.products?.onSale ?? 0 }}</span>
              <span class="stat-total">/ {{ overview?.products?.total ?? 0 }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card" @click="router.push({ name: 'PromotionActivities' })">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
            <FireOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">已参加促销</span>
            <div class="stat-value-row">
              <span class="stat-value">{{ overview?.promotions?.joined ?? 0 }}</span>
              <span class="stat-total">/ {{ overview?.promotions?.total ?? 0 }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card" @click="router.push({ name: 'OrderList' })">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
            <ShoppingCartOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">待处理订单</span>
            <div class="stat-value-row">
              <span class="stat-value">{{ overview?.orders?.pending ?? 0 }}</span>
              <span class="stat-total">/ {{ overview?.orders?.total ?? 0 }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, #8b5cf6, #a78bfa)">
            <SyncOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">最后同步</span>
            <span class="stat-value stat-value--sm">{{ lastSyncText }}</span>
          </div>
        </div>
      </div>

      <!-- Secondary Stats -->
      <div class="stat-grid stat-grid--secondary">
        <div class="stat-card stat-card--compact" @click="router.push({ name: 'Finance' })">
          <div class="stat-card-icon stat-card-icon--sm" style="background: rgba(239, 68, 68, 0.1); color: #ef4444">
            <DollarOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">财务管理</span>
            <span class="stat-desc">交易 & 利润分析</span>
          </div>
          <RightOutlined class="stat-arrow" />
        </div>

        <div class="stat-card stat-card--compact" @click="router.push({ name: 'Returns' })">
          <div class="stat-card-icon stat-card-icon--sm" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b">
            <RollbackOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">退货记录</span>
            <span class="stat-value stat-value--inline">{{ overview?.returns?.total ?? 0 }}</span>
          </div>
        </div>

        <div class="stat-card stat-card--compact" @click="router.push({ name: 'Warehouse' })">
          <div class="stat-card-icon stat-card-icon--sm" style="background: rgba(20, 184, 166, 0.1); color: #14b8a6">
            <InboxOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">仓库数量</span>
            <span class="stat-value stat-value--inline">{{ overview?.warehouses?.total ?? 0 }}</span>
          </div>
        </div>

        <div class="stat-card stat-card--compact" @click="router.push({ name: 'Rating' })">
          <div class="stat-card-icon stat-card-icon--sm" style="background: rgba(234, 179, 8, 0.1); color: #eab308">
            <StarOutlined />
          </div>
          <div class="stat-card-body">
            <span class="stat-label">卖家评分</span>
            <span class="stat-desc">查看评分详情</span>
          </div>
          <RightOutlined class="stat-arrow" />
        </div>
      </div>

      <!-- Bottom Grid -->
      <Row :gutter="20">
        <!-- Sync Logs -->
        <Col :xs="24" :lg="12">
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">最近同步记录</h3>
              <span v-if="overview?.recentSyncLogs?.length" class="section-badge">
                {{ overview.recentSyncLogs.length }} 条
              </span>
            </div>
            <div v-if="overview?.recentSyncLogs?.length" class="sync-list">
              <div
                v-for="log in overview.recentSyncLogs"
                :key="log.id"
                class="sync-item"
              >
                <div :class="['sync-dot', `sync-dot--${syncStatusConfig[log.status]?.color || 'gray'}`]" />
                <div class="sync-info">
                  <div class="sync-row">
                    <span class="sync-type">{{ syncTypeMap[log.syncType] || log.syncType }}</span>
                    <Tag
                      :color="syncStatusConfig[log.status]?.color"
                      style="margin: 0"
                    >
                      {{ syncStatusConfig[log.status]?.label || log.status }}
                    </Tag>
                  </div>
                  <div class="sync-meta">
                    <span>{{ dayjs(log.startedAt).format('MM-DD HH:mm') }}</span>
                    <span v-if="log.itemsProcessed !== null">
                      &middot; 处理 {{ log.itemsProcessed }} 项
                      <span v-if="log.itemsFailed" style="color: var(--color-error)">
                        ，失败 {{ log.itemsFailed }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <Empty description="暂无同步记录" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
            </div>
          </div>
        </Col>

        <!-- Quick Links -->
        <Col :xs="24" :lg="12">
          <div class="section-card">
            <div class="section-header">
              <h3 class="section-title">快捷操作</h3>
            </div>
            <div class="quick-grid">
              <button
                v-for="link in quickLinks"
                :key="link.route"
                class="quick-card"
                @click="router.push({ name: link.route })"
              >
                <div class="quick-icon" :style="{ background: link.gradient }">
                  <component :is="link.icon" />
                </div>
                <div class="quick-text">
                  <span class="quick-title">{{ link.title }}</span>
                  <span class="quick-desc">{{ link.desc }}</span>
                </div>
                <RightOutlined class="quick-arrow" />
              </button>
            </div>
          </div>
        </Col>
      </Row>
    </Spin>
  </div>
</template>

<style scoped>
/* ─── Welcome ─── */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}
.welcome-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
  letter-spacing: -0.02em;
}
.welcome-desc {
  margin: 0;
  color: var(--color-text-3);
  font-size: 14px;
}
.refresh-btn {
  border: 1px solid var(--color-border) !important;
}

/* ─── Alert ─── */
.alert-bar {
  background: var(--color-warning-bg);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  margin-bottom: 24px;
}
.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-2);
}

/* ─── Stat Grid ─── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-grid--secondary {
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-bg-container);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: var(--color-border);
}
.stat-card--compact {
  padding: 14px 16px;
  align-items: center;
}

.stat-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}
.stat-card-icon--sm {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 16px;
}

.stat-card-body {
  flex: 1;
  min-width: 0;
}
.stat-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-3);
  margin-bottom: 4px;
}
.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-1);
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.stat-value--sm {
  font-size: 18px;
}
.stat-value--inline {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-1);
}
.stat-total {
  font-size: 14px;
  color: var(--color-text-4);
  font-weight: 400;
}
.stat-desc {
  font-size: 13px;
  color: var(--color-text-3);
}
.stat-arrow {
  color: var(--color-text-4);
  font-size: 11px;
  margin-left: auto;
}

/* ─── Section Card ─── */
.section-card {
  background: var(--color-bg-container);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  padding: 20px;
  height: 100%;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-light);
}
.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
}
.section-badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

/* ─── Sync List ─── */
.sync-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sync-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-light);
}
.sync-item:last-child {
  border-bottom: none;
}
.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.sync-dot--green { background: var(--color-success); }
.sync-dot--blue { background: var(--color-info); }
.sync-dot--red { background: var(--color-error); }
.sync-dot--orange { background: var(--color-warning); }
.sync-dot--gray { background: var(--color-text-4); }

.sync-info { flex: 1; min-width: 0; }
.sync-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sync-type {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
}
.sync-meta {
  font-size: 12px;
  color: var(--color-text-4);
  margin-top: 3px;
}
.empty-state {
  padding: 40px 0;
}

/* ─── Quick Grid ─── */
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  font-family: inherit;
}
.quick-card:hover {
  border-color: var(--color-primary-border);
  background: var(--color-primary-bg);
}
.quick-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
}
.quick-text {
  flex: 1;
  min-width: 0;
}
.quick-title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
}
.quick-desc {
  display: block;
  font-size: 12px;
  color: var(--color-text-4);
  margin-top: 1px;
}
.quick-arrow {
  color: var(--color-text-4);
  font-size: 10px;
  transition: transform var(--transition-fast);
}
.quick-card:hover .quick-arrow {
  transform: translateX(2px);
  color: var(--color-primary);
}

/* ─── Responsive ─── */
@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
