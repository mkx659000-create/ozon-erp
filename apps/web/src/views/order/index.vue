<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  DatePicker,
  Tabs,
  TabPane,
  Badge,
  Drawer,
  Descriptions,
  DescriptionsItem,
  message,
  Timeline,
  TimelineItem,
} from 'ant-design-vue';
import {
  SyncOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import {
  getOrdersApi,
  getOrderStatusCountsApi,
  syncOrdersApi,
  getOrderByIdApi,
  type Order,
  type OrderStatusCounts,
} from '@/api/order';
import dayjs from 'dayjs';

const storeAccountStore = useStoreAccountStore();
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');

/* ---- state ---- */
const loading = ref(false);
const syncLoading = ref(false);
const dataSource = ref<Order[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const activeTab = ref('ALL');
const statusCounts = ref<OrderStatusCounts>({ total: 0, statuses: [] });

/* ---- drawer ---- */
const drawerVisible = ref(false);
const drawerOrder = ref<Order | null>(null);
const drawerLoading = ref(false);

/* ---- status config ---- */
const statusConfig: Record<string, { label: string; color: string }> = {
  AWAITING_PACKAGING: { label: '待打包', color: 'orange' },
  AWAITING_DELIVER: { label: '待发货', color: 'blue' },
  DELIVERING: { label: '配送中', color: 'cyan' },
  DELIVERED: { label: '已送达', color: 'green' },
  CANCELLED: { label: '已取消', color: 'red' },
  RETURNED: { label: '已退回', color: 'volcano' },
};

const tabs = computed(() => {
  const all = { key: 'ALL', label: '全部', count: statusCounts.value.total };
  const others = statusCounts.value.statuses.map((s) => ({
    key: s.status,
    label: statusConfig[s.status]?.label || s.status,
    count: s.count,
  }));
  return [all, ...others];
});

/* ---- columns ---- */
const columns = [
  { title: '订单号', key: 'postingNumber', width: 200, fixed: 'left' as const },
  { title: '状态', key: 'status', width: 100 },
  { title: '商品', key: 'items', width: 300 },
  { title: '金额', key: 'amount', width: 120, align: 'right' as const },
  { title: '物流单号', dataIndex: 'trackingNumber', key: 'tracking', width: 180 },
  { title: '店铺', key: 'store', width: 120 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
];

/* ---- data fetching ---- */
async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    if (storeAccountId.value) params.storeAccountId = storeAccountId.value;
    if (activeTab.value !== 'ALL') params.status = activeTab.value;
    if (keyword.value) params.keyword = keyword.value;

    const res = await getOrdersApi(params);
    dataSource.value = res.items;
    total.value = res.total;
  } catch {
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function fetchCounts() {
  try {
    statusCounts.value = await getOrderStatusCountsApi(storeAccountId.value || undefined);
  } catch {
    statusCounts.value = { total: 0, statuses: [] };
  }
}

async function loadAll() {
  await Promise.all([fetchData(), fetchCounts()]);
}

async function handleSync() {
  if (!storeAccountId.value) {
    message.warning('请先选择店铺');
    return;
  }
  syncLoading.value = true;
  try {
    const res = await syncOrdersApi(storeAccountId.value);
    message.success(`同步完成：成功 ${res.synced}，失败 ${res.failed}`);
    await loadAll();
  } catch {
    message.error('同步失败');
  } finally {
    syncLoading.value = false;
  }
}

async function viewOrder(id: string) {
  drawerLoading.value = true;
  drawerVisible.value = true;
  try {
    drawerOrder.value = await getOrderByIdApi(id);
  } catch {
    message.error('加载订单详情失败');
  } finally {
    drawerLoading.value = false;
  }
}

function handleTabChange() {
  currentPage.value = 1;
  fetchData();
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handleTableChange(pagination: any) {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
  fetchData();
}

function formatDate(d: string | null) {
  if (!d) return '-';
  return dayjs(d).format('YYYY-MM-DD HH:mm');
}

function formatPrice(val: number | null | undefined) {
  if (val === null || val === undefined) return '-';
  return `₽ ${Number(val).toFixed(2)}`;
}

onMounted(() => loadAll());
watch(storeAccountId, () => {
  currentPage.value = 1;
  loadAll();
});
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">订单管理</h2>

    <!-- Toolbar -->
    <div style="margin-bottom: 16px">
      <Space>
        <Button type="primary" :loading="syncLoading" @click="handleSync">
          <template #icon><SyncOutlined /></template>
          同步订单
        </Button>
      </Space>
    </div>

    <!-- Tabs -->
    <Tabs v-model:activeKey="activeTab" @change="handleTabChange" style="margin-bottom: 16px">
      <TabPane v-for="tab in tabs" :key="tab.key">
        <template #tab>
          {{ tab.label }}
          <Badge
            :count="tab.count"
            :numberStyle="{ backgroundColor: tab.key === activeTab ? '#1890ff' : '#999' }"
            :offset="[6, -4]"
            :showZero="true"
          />
        </template>
      </TabPane>
    </Tabs>

    <!-- Search -->
    <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center">
      <Input
        v-model:value="keyword"
        placeholder="搜索订单号 / 物流单号"
        style="width: 250px"
        allowClear
        @pressEnter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">
        <template #icon><SearchOutlined /></template>
        搜索
      </Button>
    </div>

    <!-- Table -->
    <Table
      :columns="columns"
      :dataSource="dataSource"
      :loading="loading"
      :scroll="{ x: 1400 }"
      rowKey="id"
      size="small"
      bordered
      :pagination="{
        current: currentPage,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 条`,
        pageSizeOptions: ['20', '50', '100'],
      }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'postingNumber'">
          <div>
            <a style="font-weight: 500" @click="viewOrder(record.id)">
              {{ record.ozonPostingNumber }}
            </a>
          </div>
        </template>

        <template v-if="column.key === 'status'">
          <Tag :color="statusConfig[record.orderStatus]?.color || 'default'">
            {{ statusConfig[record.orderStatus]?.label || record.orderStatus }}
          </Tag>
        </template>

        <template v-if="column.key === 'items'">
          <div v-if="record.items?.length" style="font-size: 12px">
            <div v-for="(item, idx) in record.items.slice(0, 3)" :key="idx">
              {{ item.name?.substring(0, 40) }}{{ item.name?.length > 40 ? '...' : '' }}
              <span style="color: #888"> x{{ item.quantity }}</span>
            </div>
            <div v-if="record.items.length > 3" style="color: #888">
              ... 共 {{ record.items.length }} 件商品
            </div>
          </div>
          <span v-else style="color: #ccc">-</span>
        </template>

        <template v-if="column.key === 'amount'">
          <span style="font-weight: 500">{{ formatPrice(record.totalAmount) }}</span>
        </template>

        <template v-if="column.key === 'store'">
          {{ record.storeAccount?.storeName || '-' }}
        </template>

        <template v-if="column.key === 'createdAt'">
          {{ formatDate(record.ozonCreatedAt) }}
        </template>

        <template v-if="column.key === 'action'">
          <Button type="link" size="small" @click="viewOrder(record.id)">
            <template #icon><EyeOutlined /></template>
          </Button>
        </template>
      </template>
    </Table>

    <!-- Order Detail Drawer -->
    <Drawer
      v-model:open="drawerVisible"
      title="订单详情"
      width="600"
      :loading="drawerLoading"
    >
      <template v-if="drawerOrder">
        <Descriptions bordered size="small" :column="2">
          <DescriptionsItem label="订单号" :span="2">
            {{ drawerOrder.ozonPostingNumber }}
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag :color="statusConfig[drawerOrder.orderStatus]?.color">
              {{ statusConfig[drawerOrder.orderStatus]?.label || drawerOrder.orderStatus }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="金额">
            {{ formatPrice(drawerOrder.totalAmount) }}
          </DescriptionsItem>
          <DescriptionsItem label="物流单号">
            {{ drawerOrder.trackingNumber || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="店铺">
            {{ drawerOrder.storeAccount?.storeName || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="创建时间" :span="2">
            {{ formatDate(drawerOrder.ozonCreatedAt) }}
          </DescriptionsItem>
        </Descriptions>

        <h4 style="margin: 24px 0 12px">商品明细</h4>
        <Table
          :dataSource="drawerOrder.items"
          :columns="[
            { title: '商品名', dataIndex: 'name', key: 'name' },
            { title: '数量', dataIndex: 'quantity', key: 'qty', width: 70 },
            { title: '单价', key: 'price', width: 100 },
          ]"
          size="small"
          :pagination="false"
          rowKey="id"
        >
          <template #bodyCell="{ column, record: item }">
            <template v-if="column.key === 'price'">
              {{ formatPrice(item.price) }}
            </template>
          </template>
        </Table>
      </template>
    </Drawer>
  </div>
</template>
