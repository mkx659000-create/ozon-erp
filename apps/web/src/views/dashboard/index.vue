<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Row,
  Col,
  Card,
  Statistic,
  Tag,
  Timeline,
  TimelineItem,
  Spin,
  Button,
  Empty,
  Alert,
} from 'ant-design-vue';
import {
  ShoppingOutlined,
  FireOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  RightOutlined,
  ShopOutlined,
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
  PRODUCT: '产品同步',
  PROMOTION: '促销同步',
  ORDER: '订单同步',
  STOCK: '库存同步',
};

const syncStatusConfig: Record<string, { color: string; label: string; icon: any }> = {
  SUCCESS: { color: 'green', label: '成功', icon: CheckCircleOutlined },
  RUNNING: { color: 'blue', label: '运行中', icon: SyncOutlined },
  FAILED: { color: 'red', label: '失败', icon: CloseCircleOutlined },
  PARTIAL_FAILURE: { color: 'orange', label: '部分失败', icon: ExclamationCircleOutlined },
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
</script>

<template>
  <div>
    <!-- Welcome Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ greeting }}，{{ userName }}</h2>
        <p class="page-desc">欢迎使用 Ozon ERP 卖家管理系统</p>
      </div>
      <Button @click="fetchOverview" :loading="loading">
        <template #icon><ReloadOutlined /></template>
        刷新数据
      </Button>
    </div>

    <!-- No Store Alert -->
    <Alert
      v-if="!hasStore"
      type="warning"
      show-icon
      banner
      style="margin-bottom: 20px; border-radius: 8px"
    >
      <template #message>
        <span>您还没有添加店铺，请先添加 Ozon 店铺以开始使用系统。</span>
        <Button type="link" size="small" @click="router.push({ name: 'StoreAccounts' })">
          前往添加 <RightOutlined />
        </Button>
      </template>
    </Alert>

    <Spin :spinning="loading">
      <!-- Stats Cards -->
      <Row :gutter="[16, 16]" style="margin-bottom: 20px">
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card stat-card-blue" hoverable @click="router.push({ name: 'ProductOnline' })">
            <div class="stat-card-inner">
              <div class="stat-icon stat-icon-blue">
                <ShoppingOutlined />
              </div>
              <Statistic
                title="在线产品"
                :value="overview?.products?.onSale ?? 0"
                :valueStyle="{ color: '#1890ff', fontSize: '28px', fontWeight: 600 }"
              >
                <template #suffix>
                  <span class="stat-suffix">/ {{ overview?.products?.total ?? 0 }}</span>
                </template>
              </Statistic>
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card stat-card-green" hoverable @click="router.push({ name: 'PromotionActivities' })">
            <div class="stat-card-inner">
              <div class="stat-icon stat-icon-green">
                <FireOutlined />
              </div>
              <Statistic
                title="已参加促销"
                :value="overview?.promotions?.joined ?? 0"
                :valueStyle="{ color: '#52c41a', fontSize: '28px', fontWeight: 600 }"
              >
                <template #suffix>
                  <span class="stat-suffix">/ {{ overview?.promotions?.total ?? 0 }}</span>
                </template>
              </Statistic>
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card stat-card-orange" hoverable @click="router.push({ name: 'OrderList' })">
            <div class="stat-card-inner">
              <div class="stat-icon stat-icon-orange">
                <ShoppingCartOutlined />
              </div>
              <Statistic
                title="待处理订单"
                :value="overview?.orders?.pending ?? 0"
                :valueStyle="{ color: '#faad14', fontSize: '28px', fontWeight: 600 }"
              >
                <template #suffix>
                  <span class="stat-suffix">/ {{ overview?.orders?.total ?? 0 }}</span>
                </template>
              </Statistic>
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card stat-card-purple" hoverable>
            <div class="stat-card-inner">
              <div class="stat-icon stat-icon-purple">
                <SyncOutlined />
              </div>
              <Statistic
                title="最后同步"
                :value="lastSyncText"
                :valueStyle="{ color: '#722ed1', fontSize: '20px', fontWeight: 600 }"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <!-- Bottom Section -->
      <Row :gutter="[16, 16]">
        <Col :xs="24" :lg="12">
          <Card title="最近同步记录" class="section-card">
            <template #extra>
              <Tag v-if="overview?.recentSyncLogs?.length" color="blue">
                {{ overview.recentSyncLogs.length }} 条记录
              </Tag>
            </template>
            <Timeline v-if="overview?.recentSyncLogs?.length" style="margin-top: 8px">
              <TimelineItem
                v-for="log in overview.recentSyncLogs"
                :key="log.id"
                :color="syncStatusConfig[log.status]?.color || 'gray'"
              >
                <div class="sync-log-item">
                  <div class="sync-log-info">
                    <span class="sync-log-type">{{ syncTypeMap[log.syncType] || log.syncType }}</span>
                    <Tag
                      :color="syncStatusConfig[log.status]?.color"
                      style="margin-left: 8px"
                    >
                      {{ syncStatusConfig[log.status]?.label || log.status }}
                    </Tag>
                  </div>
                  <span class="sync-log-time">
                    {{ dayjs(log.startedAt).format('MM-DD HH:mm') }}
                  </span>
                </div>
                <div v-if="log.itemsProcessed !== null" class="sync-log-detail">
                  处理 {{ log.itemsProcessed }} 项
                  <span v-if="log.itemsFailed" style="color: #f5222d">
                    ，失败 {{ log.itemsFailed }} 项
                  </span>
                </div>
              </TimelineItem>
            </Timeline>
            <Empty v-else description="暂无同步记录" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
          </Card>
        </Col>

        <Col :xs="24" :lg="12">
          <Card title="快捷操作" class="section-card">
            <Row :gutter="[12, 12]">
              <Col :span="12">
                <div class="quick-action" @click="router.push({ name: 'ProductOnline' })">
                  <div class="quick-action-icon" style="background: #e6f7ff; color: #1890ff">
                    <ShoppingOutlined />
                  </div>
                  <div class="quick-action-text">
                    <span class="quick-action-title">产品管理</span>
                    <span class="quick-action-desc">管理在线产品</span>
                  </div>
                  <RightOutlined style="color: #d9d9d9" />
                </div>
              </Col>
              <Col :span="12">
                <div class="quick-action" @click="router.push({ name: 'PromotionActivities' })">
                  <div class="quick-action-icon" style="background: #f6ffed; color: #52c41a">
                    <FireOutlined />
                  </div>
                  <div class="quick-action-text">
                    <span class="quick-action-title">促销活动</span>
                    <span class="quick-action-desc">管理促销商品</span>
                  </div>
                  <RightOutlined style="color: #d9d9d9" />
                </div>
              </Col>
              <Col :span="12">
                <div class="quick-action" @click="router.push({ name: 'OrderList' })">
                  <div class="quick-action-icon" style="background: #fff7e6; color: #faad14">
                    <ShoppingCartOutlined />
                  </div>
                  <div class="quick-action-text">
                    <span class="quick-action-title">订单管理</span>
                    <span class="quick-action-desc">查看处理订单</span>
                  </div>
                  <RightOutlined style="color: #d9d9d9" />
                </div>
              </Col>
              <Col :span="12">
                <div class="quick-action" @click="router.push({ name: 'Analytics' })">
                  <div class="quick-action-icon" style="background: #f9f0ff; color: #722ed1">
                    <SyncOutlined />
                  </div>
                  <div class="quick-action-text">
                    <span class="quick-action-title">数据分析</span>
                    <span class="quick-action-desc">营收订单数据</span>
                  </div>
                  <RightOutlined style="color: #d9d9d9" />
                </div>
              </Col>
              <Col :span="12">
                <div class="quick-action" @click="router.push({ name: 'StoreAccounts' })">
                  <div class="quick-action-icon" style="background: #fff1f0; color: #f5222d">
                    <ShopOutlined />
                  </div>
                  <div class="quick-action-text">
                    <span class="quick-action-title">店铺管理</span>
                    <span class="quick-action-desc">管理Ozon店铺</span>
                  </div>
                  <RightOutlined style="color: #d9d9d9" />
                </div>
              </Col>
              <Col :span="12">
                <div class="quick-action" @click="router.push({ name: 'ProductPublish' })">
                  <div class="quick-action-icon" style="background: #e6fffb; color: #13c2c2">
                    <ArrowUpOutlined />
                  </div>
                  <div class="quick-action-text">
                    <span class="quick-action-title">产品刊登</span>
                    <span class="quick-action-desc">上架新产品</span>
                  </div>
                  <RightOutlined style="color: #d9d9d9" />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
}
.page-desc {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.stat-card {
  border-radius: 10px;
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
  cursor: pointer;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.stat-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-icon-blue { background: #e6f7ff; color: #1890ff; }
.stat-icon-green { background: #f6ffed; color: #52c41a; }
.stat-icon-orange { background: #fff7e6; color: #faad14; }
.stat-icon-purple { background: #f9f0ff; color: #722ed1; }

.stat-suffix {
  font-size: 14px;
  color: #bfbfbf;
  font-weight: 400;
}

.section-card {
  border-radius: 10px;
  height: 100%;
}
.section-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f5f5f5;
}

.sync-log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sync-log-info {
  display: flex;
  align-items: center;
}
.sync-log-type {
  font-weight: 500;
  font-size: 13px;
}
.sync-log-time {
  color: #8c8c8c;
  font-size: 12px;
}
.sync-log-detail {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
}
.quick-action:hover {
  border-color: #1890ff;
  background: #fafafa;
  transform: translateX(2px);
}
.quick-action-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.quick-action-text {
  flex: 1;
  min-width: 0;
}
.quick-action-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}
.quick-action-desc {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}
</style>
