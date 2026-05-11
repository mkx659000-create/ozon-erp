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
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import { getDashboardOverviewApi, type DashboardOverview } from '@/api/dashboard';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const storeAccountStore = useStoreAccountStore();
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');

const loading = ref(false);
const overview = ref<DashboardOverview | null>(null);

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

const syncStatusConfig: Record<string, { color: string; label: string }> = {
  SUCCESS: { color: 'green', label: '成功' },
  RUNNING: { color: 'blue', label: '运行中' },
  FAILED: { color: 'red', label: '失败' },
  PARTIAL_FAILURE: { color: 'orange', label: '部分失败' },
};

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
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2 style="margin: 0">数据概览</h2>
      <Button @click="fetchOverview" :loading="loading">
        <template #icon><ReloadOutlined /></template>
        刷新
      </Button>
    </div>

    <Spin :spinning="loading">
      <!-- Stats Cards -->
      <Row :gutter="16" style="margin-bottom: 24px">
        <Col :span="6">
          <Card hoverable>
            <Statistic
              title="在线产品"
              :value="overview?.products?.onSale ?? 0"
              :valueStyle="{ color: '#1890ff' }"
            >
              <template #prefix><ShoppingOutlined /></template>
              <template #suffix>
                <span style="font-size: 13px; color: #888"> / {{ overview?.products?.total ?? 0 }}</span>
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card hoverable>
            <Statistic
              title="已参加促销"
              :value="overview?.promotions?.joined ?? 0"
              :valueStyle="{ color: '#52c41a' }"
            >
              <template #prefix><FireOutlined /></template>
              <template #suffix>
                <span style="font-size: 13px; color: #888"> / {{ overview?.promotions?.total ?? 0 }}</span>
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card hoverable>
            <Statistic
              title="待处理订单"
              :value="overview?.orders?.pending ?? 0"
              :valueStyle="{ color: '#faad14' }"
            >
              <template #prefix><ShoppingCartOutlined /></template>
              <template #suffix>
                <span style="font-size: 13px; color: #888"> / {{ overview?.orders?.total ?? 0 }}</span>
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card hoverable>
            <Statistic
              title="最后同步"
              :value="lastSyncText"
              :valueStyle="{ color: '#722ed1', fontSize: '20px' }"
            >
              <template #prefix><SyncOutlined /></template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <!-- Recent Sync Logs -->
      <Row :gutter="16">
        <Col :span="12">
          <Card title="最近同步记录" :bodyStyle="{ padding: '16px 24px' }">
            <Timeline v-if="overview?.recentSyncLogs?.length">
              <TimelineItem
                v-for="log in overview.recentSyncLogs"
                :key="log.id"
                :color="syncStatusConfig[log.status]?.color || 'gray'"
              >
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <div>
                    <span style="font-weight: 500">{{ syncTypeMap[log.syncType] || log.syncType }}</span>
                    <Tag
                      :color="syncStatusConfig[log.status]?.color"
                      style="margin-left: 8px"
                      size="small"
                    >
                      {{ syncStatusConfig[log.status]?.label || log.status }}
                    </Tag>
                  </div>
                  <span style="color: #888; font-size: 12px">
                    {{ dayjs(log.startedAt).format('MM-DD HH:mm') }}
                  </span>
                </div>
                <div v-if="log.itemsProcessed !== null" style="color: #888; font-size: 12px; margin-top: 4px">
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

        <Col :span="12">
          <Card title="快捷操作" :bodyStyle="{ padding: '24px' }">
            <Row :gutter="[16, 16]">
              <Col :span="12">
                <Button
                  type="primary"
                  block
                  size="large"
                  @click="$router.push({ name: 'ProductOnline' })"
                >
                  <template #icon><ShoppingOutlined /></template>
                  产品管理
                </Button>
              </Col>
              <Col :span="12">
                <Button
                  block
                  size="large"
                  style="background: #52c41a; color: #fff; border-color: #52c41a"
                  @click="$router.push({ name: 'PromotionActivities' })"
                >
                  <template #icon><FireOutlined /></template>
                  促销活动
                </Button>
              </Col>
              <Col :span="12">
                <Button
                  block
                  size="large"
                  style="background: #faad14; color: #fff; border-color: #faad14"
                  @click="$router.push({ name: 'OrderList' })"
                >
                  <template #icon><ShoppingCartOutlined /></template>
                  订单管理
                </Button>
              </Col>
              <Col :span="12">
                <Button
                  block
                  size="large"
                  style="background: #722ed1; color: #fff; border-color: #722ed1"
                  @click="$router.push({ name: 'Analytics' })"
                >
                  <template #icon><SyncOutlined /></template>
                  数据分析
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>
