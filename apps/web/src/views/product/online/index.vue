<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Tabs,
  TabPane,
  Button,
  Space,
  Table,
  Tag,
  Input,
  Badge,
  Image,
  Tooltip,
  message,
  Divider,
} from 'ant-design-vue';
import {
  SyncOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
} from '@ant-design/icons-vue';
import {
  getProductsApi,
  getStatusCountsApi,
  syncProductsApi,
  type Product,
  type StatusCounts,
  type ProductQuery,
} from '@/api/product/index';
import { useStoreAccountStore } from '@/store';
import dayjs from 'dayjs';

const storeAccountStore = useStoreAccountStore();

const activeTab = ref('ALL');
const searchText = ref('');
const loading = ref(false);
const syncLoading = ref(false);
const selectedRowKeys = ref<string[]>([]);
const dataSource = ref<Product[]>([]);
const pagination = ref({ current: 1, pageSize: 50, total: 0 });
const statusCounts = ref<StatusCounts>({
  total: 0, onSale: 0, outOfStock: 0, moderation: 0,
  moderationFailed: 0, removed: 0, archived: 0,
});

const statusTabs = computed(() => [
  { key: 'ALL', label: '全部', count: statusCounts.value.total },
  { key: 'ON_SALE', label: '在售', count: statusCounts.value.onSale, color: 'green' },
  { key: 'OUT_OF_STOCK', label: '缺货', count: statusCounts.value.outOfStock, color: 'orange' },
  { key: 'MODERATION', label: '审核中', count: statusCounts.value.moderation, color: 'blue' },
  { key: 'MODERATION_FAILED', label: '审核失败', count: statusCounts.value.moderationFailed, color: 'red' },
  { key: 'REMOVED', label: '已下架', count: statusCounts.value.removed, color: 'default' },
  { key: 'ARCHIVED', label: '归档', count: statusCounts.value.archived, color: 'default' },
]);

const columns = [
  {
    title: '主图',
    dataIndex: 'primaryImage',
    key: 'image',
    width: 70,
    fixed: 'left' as const,
  },
  {
    title: '标题 / ProductID / 店铺',
    key: 'info',
    width: 300,
    fixed: 'left' as const,
  },
  { title: '操作', key: 'action', width: 100 },
  { title: 'SKU', key: 'sku', width: 120 },
  { title: '售价', dataIndex: 'sellingPrice', key: 'sellingPrice', width: 80, align: 'right' as const },
  { title: '原价', dataIndex: 'originalPrice', key: 'originalPrice', width: 80, align: 'right' as const },
  { title: '最低价', dataIndex: 'lowestPrice', key: 'lowestPrice', width: 80, align: 'right' as const },
  { title: '成本', dataIndex: 'costPrice', key: 'costPrice', width: 80, align: 'right' as const },
  { title: '总库存', dataIndex: 'totalStock', key: 'totalStock', width: 70, align: 'center' as const },
  { title: '14天销量', dataIndex: 'sales14d', key: 'sales14d', width: 80, align: 'center' as const },
  { title: '毛重/体积', key: 'weight', width: 110 },
  { title: '刊登/更新/同步', key: 'timestamps', width: 160 },
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys.map(String);
  },
}));

function formatPrice(val: number | null): string {
  if (val === null || val === undefined) return '-';
  return Number(val).toFixed(2);
}

function formatDate(val: string | null): string {
  if (!val) return '-';
  return dayjs(val).format('MM-DD HH:mm');
}

function formatWeight(val: number | null, unit: string): string {
  if (val === null || val === undefined) return '';
  return `${Number(val)}${unit}`;
}

async function fetchProducts() {
  loading.value = true;
  try {
    const query: ProductQuery = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    if (storeAccountStore.activeStoreId) {
      query.storeAccountId = storeAccountStore.activeStoreId;
    }
    if (activeTab.value !== 'ALL') {
      query.status = activeTab.value;
    }
    if (searchText.value) {
      query.keyword = searchText.value;
    }

    const result = await getProductsApi(query);
    dataSource.value = result.items;
    pagination.value.total = result.total;
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false;
  }
}

async function fetchStatusCounts() {
  try {
    const storeId = storeAccountStore.activeStoreId || undefined;
    statusCounts.value = await getStatusCountsApi(storeId);
  } catch {
    // silent
  }
}

async function handleSync() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) {
    message.warning('请先选择店铺');
    return;
  }
  syncLoading.value = true;
  try {
    const result: any = await syncProductsApi(storeId);
    if (result.error) {
      message.warning(`同步部分完成：成功 ${result.synced} 个，失败 ${result.failed} 个。${result.error}`);
    } else {
      message.success(`同步完成：成功 ${result.synced} 个，失败 ${result.failed} 个`);
    }
    await Promise.all([fetchProducts(), fetchStatusCounts()]);
  } catch {
    message.error('同步请求失败，请稍后重试');
  } finally {
    syncLoading.value = false;
  }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchProducts();
}

function handleSearch() {
  pagination.value.current = 1;
  fetchProducts();
}

function handleReset() {
  searchText.value = '';
  activeTab.value = 'ALL';
  pagination.value.current = 1;
  fetchProducts();
  fetchStatusCounts();
}

watch(activeTab, () => {
  pagination.value.current = 1;
  fetchProducts();
});

onMounted(() => {
  fetchProducts();
  fetchStatusCounts();
});
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <h2 class="page-title">OZON在线产品</h2>
      <span class="page-total">共 {{ pagination.total }} 个产品</span>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <Space wrap :size="8">
          <Button type="primary" :loading="syncLoading" @click="handleSync">
            <template #icon><SyncOutlined /></template>
            同步产品
          </Button>
          <Divider type="vertical" />
          <Button :disabled="selectedRowKeys.length === 0">
            <template #icon><EditOutlined /></template>
            批量编辑
          </Button>
          <Button danger :disabled="selectedRowKeys.length === 0">
            <template #icon><DeleteOutlined /></template>
            批量归档
          </Button>
          <Divider type="vertical" />
          <Button>
            <template #icon><ImportOutlined /></template>
            导入
          </Button>
          <Button>
            <template #icon><ExportOutlined /></template>
            导出
          </Button>
        </Space>
      </div>
    </div>

    <!-- Status Tabs -->
    <Tabs v-model:activeKey="activeTab" class="status-tabs">
      <TabPane v-for="tab in statusTabs" :key="tab.key">
        <template #tab>
          {{ tab.label }}
          <Badge
            :count="tab.count"
            :numberStyle="{
              backgroundColor: tab.key === activeTab ? '#1890ff' : '#f0f0f0',
              color: tab.key === activeTab ? '#fff' : '#8c8c8c',
              fontSize: '11px',
              height: '18px',
              lineHeight: '18px',
              padding: '0 6px',
              minWidth: '18px',
            }"
            :offset="[6, -2]"
            :showZero="true"
          />
        </template>
      </TabPane>
    </Tabs>

    <!-- Search Bar -->
    <div class="search-bar">
      <Input
        v-model:value="searchText"
        placeholder="搜索产品名称 / ProductID / SKU"
        style="width: 300px"
        allowClear
        @pressEnter="handleSearch"
      >
        <template #prefix><SearchOutlined style="color: #bfbfbf" /></template>
      </Input>
      <Button type="primary" @click="handleSearch">搜索</Button>
      <Button @click="handleReset">
        <template #icon><ReloadOutlined /></template>
        重置
      </Button>
      <div style="flex: 1" />
      <span v-if="selectedRowKeys.length > 0" class="selection-info">
        已选 <strong>{{ selectedRowKeys.length }}</strong> 条
        <a style="margin-left: 8px" @click="selectedRowKeys = []">取消选择</a>
      </span>
    </div>

    <!-- Product Table -->
    <Table
      :columns="columns"
      :dataSource="dataSource"
      :loading="loading"
      :rowSelection="rowSelection"
      :scroll="{ x: 1600 }"
      rowKey="id"
      size="small"
      bordered
      :pagination="{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['20', '50', '100'],
        showTotal: (total: number) => `共 ${total} 行`,
      }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- Image -->
        <template v-if="column.key === 'image'">
          <Image
            v-if="record.primaryImage"
            :src="record.primaryImage"
            :width="50"
            :height="50"
            style="object-fit: cover; border-radius: 6px"
            :fallback="'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+'"
          />
          <div v-else class="img-placeholder" />
        </template>

        <!-- Info -->
        <template v-if="column.key === 'info'">
          <div style="line-height: 1.5">
            <Tooltip :title="record.name">
              <div class="product-name">{{ record.name }}</div>
            </Tooltip>
            <div class="product-id">
              ID: {{ record.ozonProductId }}
            </div>
            <div style="margin-top: 2px">
              <Tag v-if="record.storeAccount" color="blue" style="margin-right: 4px; font-size: 11px">
                {{ record.storeAccount.storeName }}
              </Tag>
              <Tag v-if="record.categoryName" style="font-size: 11px">
                {{ record.categoryName }}
              </Tag>
            </div>
          </div>
        </template>

        <!-- Action -->
        <template v-if="column.key === 'action'">
          <Space :size="0">
            <Button type="link" size="small">编辑</Button>
            <Button type="link" size="small">同步</Button>
          </Space>
        </template>

        <!-- SKU -->
        <template v-if="column.key === 'sku'">
          <div style="font-size: 12px">
            <div v-if="record.offerId" style="color: #1a1a1a">{{ record.offerId }}</div>
            <div v-for="sku in (record.skus || [])" :key="sku.ozonSku" style="color: #8c8c8c">
              {{ sku.ozonSku }}
            </div>
          </div>
        </template>

        <!-- Prices -->
        <template v-if="column.key === 'sellingPrice'">
          <span style="color: #52c41a; font-weight: 600">{{ formatPrice(record.sellingPrice) }}</span>
        </template>
        <template v-if="column.key === 'originalPrice'">
          <span style="color: #595959">{{ formatPrice(record.originalPrice) }}</span>
        </template>
        <template v-if="column.key === 'lowestPrice'">
          <span style="color: #1890ff">{{ formatPrice(record.lowestPrice) }}</span>
        </template>
        <template v-if="column.key === 'costPrice'">
          <span style="color: #8c8c8c">{{ formatPrice(record.costPrice) }}</span>
        </template>

        <!-- Stock -->
        <template v-if="column.key === 'totalStock'">
          <Tag :color="(record.totalStock ?? 0) > 0 ? 'green' : 'red'" style="margin: 0">
            {{ record.totalStock ?? 0 }}
          </Tag>
        </template>

        <!-- Sales -->
        <template v-if="column.key === 'sales14d'">
          <span :style="{ fontWeight: (record.sales14d ?? 0) > 0 ? '600' : '400', color: (record.sales14d ?? 0) > 0 ? '#1a1a1a' : '#d9d9d9' }">
            {{ record.sales14d ?? 0 }}
          </span>
        </template>

        <!-- Weight -->
        <template v-if="column.key === 'weight'">
          <div style="font-size: 12px; color: #8c8c8c; line-height: 1.6">
            <div v-if="record.weightGross">{{ formatWeight(record.weightGross, 'g') }}</div>
            <div v-if="record.dimensionLength">
              {{ Number(record.dimensionLength) }}×{{ Number(record.dimensionWidth) }}×{{ Number(record.dimensionHeight) }}mm
            </div>
            <span v-if="!record.weightGross && !record.dimensionLength" style="color: #d9d9d9">-</span>
          </div>
        </template>

        <!-- Timestamps -->
        <template v-if="column.key === 'timestamps'">
          <div style="font-size: 11px; color: #8c8c8c; line-height: 1.8">
            <div><span class="ts-label">刊</span> {{ formatDate(record.ozonCreatedAt) }}</div>
            <div><span class="ts-label">更</span> {{ formatDate(record.ozonUpdatedAt) }}</div>
            <div><span class="ts-label">同</span> {{ formatDate(record.lastSyncAt) }}</div>
          </div>
        </template>
      </template>
    </Table>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}
.page-total {
  font-size: 13px;
  color: #8c8c8c;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-tabs {
  margin-bottom: 12px;
}
.status-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.search-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.selection-info {
  font-size: 13px;
  color: #595959;
}

.product-name {
  color: #1890ff;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
  cursor: pointer;
}
.product-id {
  font-size: 12px;
  color: #8c8c8c;
}
.img-placeholder {
  width: 50px;
  height: 50px;
  background: #f5f5f5;
  border-radius: 6px;
  border: 1px dashed #e8e8e8;
}

.ts-label {
  display: inline-block;
  width: 14px;
  text-align: center;
  color: #bfbfbf;
}
</style>
