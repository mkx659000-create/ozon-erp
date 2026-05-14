<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Select,
  SelectOption,
  Input,
  Row,
  Col,
  Statistic,
  message,
  Empty,
} from 'ant-design-vue';
import {
  SyncOutlined,
  RollbackOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import { getReturnsApi, getReturnStatsApi, syncReturnsApi } from '@/api/returns';
import type { ReturnItem, ReturnStats } from '@/api/returns';

const storeAccountStore = useStoreAccountStore();

const returns = ref<ReturnItem[]>([]);
const stats = ref<ReturnStats | null>(null);
const loading = ref(false);
const syncing = ref(false);
const total = ref(0);

const query = reactive({
  returnType: undefined as string | undefined,
  status: undefined as string | undefined,
  keyword: '',
  page: 1,
  pageSize: 20,
});

const columns = [
  { title: '发货单号', dataIndex: 'postingNumber', width: 180, ellipsis: true },
  { title: '商品名称', dataIndex: 'productName', ellipsis: true },
  { title: '类型', dataIndex: 'returnType', width: 80 },
  { title: '状态', dataIndex: 'status', width: 140 },
  { title: '数量', dataIndex: 'quantity', width: 60, align: 'center' as const },
  { title: '退款金额', dataIndex: 'returnAmount', width: 110, align: 'right' as const },
  { title: '佣金', dataIndex: 'commission', width: 100, align: 'right' as const },
  { title: '退货原因', dataIndex: 'returnReason', width: 180, ellipsis: true },
  { title: '退货时间', dataIndex: 'returnedAt', width: 160 },
];

const statusColors: Record<string, string> = {
  ReturnedToOzon: 'orange',
  Returned: 'green',
  Cancelled: 'default',
  Waiting: 'blue',
  Accepted: 'cyan',
  Rejected: 'red',
};

function formatDate(val: string | null) {
  if (!val) return '-';
  return new Date(val).toLocaleString('zh-CN');
}

function formatMoney(val: number | null) {
  if (val == null) return '-';
  return `¥${Number(val).toFixed(2)}`;
}

async function loadReturns() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  loading.value = true;
  try {
    const result = await getReturnsApi({
      storeAccountId: storeId,
      returnType: query.returnType,
      status: query.status,
      keyword: query.keyword || undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
    returns.value = result.items;
    total.value = result.total;
  } catch {
    message.error('加载退货数据失败');
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  try {
    stats.value = await getReturnStatsApi(storeId);
  } catch {
    // non-critical
  }
}

async function handleSync() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  syncing.value = true;
  try {
    const result = await syncReturnsApi(storeId);
    message.success(`同步完成：${result.synced} 条退货记录`);
    await Promise.all([loadReturns(), loadStats()]);
  } catch {
    message.error('同步退货数据失败');
  } finally {
    syncing.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadReturns();
}

function handleReset() {
  query.returnType = undefined;
  query.status = undefined;
  query.keyword = '';
  query.page = 1;
  loadReturns();
}

function handleTableChange(pagination: any) {
  query.page = pagination.current;
  query.pageSize = pagination.pageSize;
  loadReturns();
}

watch(() => storeAccountStore.activeStoreId, () => {
  query.page = 1;
  loadReturns();
  loadStats();
});

onMounted(() => {
  loadReturns();
  loadStats();
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0; font-size: 20px">
        <RollbackOutlined style="margin-right: 8px" />
        退货管理
      </h2>
      <Button type="primary" :loading="syncing" @click="handleSync" :disabled="!storeAccountStore.activeStoreId">
        <SyncOutlined />
        同步退货
      </Button>
    </div>

    <Card v-if="!storeAccountStore.activeStoreId">
      <Empty description="请先选择店铺" />
    </Card>

    <template v-else>
      <!-- Stats -->
      <Row :gutter="16" style="margin-bottom: 16px" v-if="stats">
        <Col :span="6">
          <Card size="small">
            <Statistic title="退货总数" :value="stats.total" />
          </Card>
        </Col>
        <Col :span="6" v-for="item in stats.byType" :key="item.type">
          <Card size="small">
            <Statistic :title="item.type" :value="item.count" />
          </Card>
        </Col>
      </Row>

      <!-- Filters -->
      <Card size="small" style="margin-bottom: 16px">
        <Space :size="12" wrap>
          <Select
            v-model:value="query.returnType"
            placeholder="退货类型"
            style="width: 120px"
            allowClear
            @change="handleSearch"
          >
            <SelectOption value="FBO">FBO</SelectOption>
            <SelectOption value="FBS">FBS</SelectOption>
          </Select>
          <Select
            v-model:value="query.status"
            placeholder="状态"
            style="width: 160px"
            allowClear
            @change="handleSearch"
          >
            <SelectOption value="ReturnedToOzon">已退回Ozon</SelectOption>
            <SelectOption value="Returned">已退货</SelectOption>
            <SelectOption value="Waiting">等待中</SelectOption>
            <SelectOption value="Accepted">已接受</SelectOption>
            <SelectOption value="Rejected">已拒绝</SelectOption>
            <SelectOption value="Cancelled">已取消</SelectOption>
          </Select>
          <Input
            v-model:value="query.keyword"
            placeholder="搜索发货单号/商品名"
            style="width: 220px"
            allowClear
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </Input>
          <Button @click="handleSearch" type="primary">查询</Button>
          <Button @click="handleReset"><ReloadOutlined /> 重置</Button>
        </Space>
      </Card>

      <!-- Table -->
      <Table
        :columns="columns"
        :dataSource="returns"
        :loading="loading"
        rowKey="id"
        size="middle"
        :pagination="{
          current: query.page,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'returnType'">
            <Tag :color="record.returnType === 'FBO' ? 'blue' : 'green'">
              {{ record.returnType }}
            </Tag>
          </template>
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="statusColors[record.status] || 'default'">
              {{ record.status }}
            </Tag>
          </template>
          <template v-if="column.dataIndex === 'returnAmount'">
            <span :style="{ color: record.returnAmount > 0 ? '#cf1322' : '#999' }">
              {{ formatMoney(record.returnAmount) }}
            </span>
          </template>
          <template v-if="column.dataIndex === 'commission'">
            {{ formatMoney(record.commission) }}
          </template>
          <template v-if="column.dataIndex === 'returnedAt'">
            {{ formatDate(record.returnedAt) }}
          </template>
        </template>
      </Table>
    </template>
  </div>
</template>
