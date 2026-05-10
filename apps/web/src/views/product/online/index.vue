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
  Select,
  SelectOption,
  Badge,
  Image,
  Tooltip,
  message,
  Modal,
} from 'ant-design-vue';
import {
  SyncOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
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
  { key: 'ON_SALE', label: '在售', count: statusCounts.value.onSale },
  { key: 'OUT_OF_STOCK', label: '缺货', count: statusCounts.value.outOfStock },
  { key: 'MODERATION', label: '审核中', count: statusCounts.value.moderation },
  { key: 'MODERATION_FAILED', label: '审核失败', count: statusCounts.value.moderationFailed },
  { key: 'REMOVED', label: '已下架', count: statusCounts.value.removed },
  { key: 'ARCHIVED', label: '归档', count: statusCounts.value.archived },
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
    title: '标题/ProductID/店铺/分类/备注',
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
  { title: '刊登/更新/同步时间', key: 'timestamps', width: 170 },
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys.map(String);
  },
}));

function formatPrice(val: number | null): string {
  if (val === null || val === undefined) return '/';
  return Number(val).toFixed(2);
}

function formatDate(val: string | null): string {
  if (!val) return '/';
  return dayjs(val).format('YYYY-MM-DD HH:mm');
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
    const result = await syncProductsApi(storeId);
    message.success(`同步完成：成功 ${result.synced} 个，失败 ${result.failed} 个`);
    await Promise.all([fetchProducts(), fetchStatusCounts()]);
  } catch {
    // handled by interceptor
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
    <!-- Toolbar -->
    <div style="margin-bottom: 16px">
      <Space wrap>
        <Button type="primary" :loading="syncLoading" @click="handleSync">
          <template #icon><SyncOutlined /></template>
          同步产品
        </Button>
        <Button>数据搬家</Button>
        <Button>
          <template #icon><EditOutlined /></template>
          编辑
        </Button>
        <Button type="primary" ghost :disabled="selectedRowKeys.length === 0">
          批量编辑
        </Button>
        <Button>
          <template #icon><ImportOutlined /></template>
          导入更新
        </Button>
        <Button danger :disabled="selectedRowKeys.length === 0">
          <template #icon><DeleteOutlined /></template>
          批量归档
        </Button>
        <Button>
          <template #icon><ExportOutlined /></template>
          导出产品
        </Button>
        <Button>设置分类</Button>
        <Button type="primary" ghost>自动更新价格</Button>
      </Space>
    </div>

    <!-- Status Tabs -->
    <Tabs v-model:activeKey="activeTab" style="margin-bottom: 16px">
      <TabPane v-for="tab in statusTabs" :key="tab.key">
        <template #tab>
          {{ tab.label }} ({{ tab.count }})
        </template>
      </TabPane>
    </Tabs>

    <!-- Search Bar -->
    <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center">
      <Input
        v-model:value="searchText"
        placeholder="搜索产品名称/ProductId/SKU"
        style="width: 280px"
        allowClear
        @pressEnter="handleSearch"
      >
        <template #suffix><SearchOutlined /></template>
      </Input>
      <Button type="primary" @click="handleSearch">
        <template #icon><SearchOutlined /></template>
        搜索
      </Button>
      <Button @click="() => { searchText = ''; handleSearch(); }">
        <template #icon><ReloadOutlined /></template>
        重置
      </Button>
      <div style="flex: 1" />
      <span style="color: #999; font-size: 12px">
        共 {{ pagination.total }} 条
        <template v-if="selectedRowKeys.length > 0">
          ，已选 {{ selectedRowKeys.length }} 条
        </template>
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
            style="object-fit: cover; border-radius: 4px"
            :fallback="'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+'"
          />
          <div v-else style="width: 50px; height: 50px; background: #f0f0f0; border-radius: 4px" />
        </template>

        <!-- Info -->
        <template v-if="column.key === 'info'">
          <div style="line-height: 1.5">
            <Tooltip :title="record.name">
              <a style="color: #1890ff; font-size: 13px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px">
                {{ record.name }}
              </a>
            </Tooltip>
            <div style="font-size: 12px; color: #666">
              {{ record.ozonProductId }}
            </div>
            <div>
              <Tag color="blue" size="small" v-if="record.storeAccount">{{ record.storeAccount.storeName }}</Tag>
              <Tag color="green" size="small">CNY</Tag>
            </div>
            <div style="font-size: 12px; color: #999" v-if="record.categoryName">
              {{ record.categoryName }}
            </div>
            <div style="font-size: 12px; color: #999" v-if="record.notes">
              {{ record.notes }}
            </div>
          </div>
        </template>

        <!-- Action -->
        <template v-if="column.key === 'action'">
          <Space direction="vertical" size="small">
            <a style="font-size: 12px">编辑</a>
            <a style="font-size: 12px">同步</a>
          </Space>
        </template>

        <!-- SKU -->
        <template v-if="column.key === 'sku'">
          <div style="font-size: 12px">
            <div v-if="record.offerId">{{ record.offerId }}</div>
            <div v-for="sku in (record.skus || [])" :key="sku.ozonSku" style="color: #999">
              SKU: {{ sku.ozonSku }}
            </div>
          </div>
        </template>

        <!-- Prices -->
        <template v-if="column.key === 'sellingPrice'">
          <span style="color: #52c41a; font-weight: 500">{{ formatPrice(record.sellingPrice) }}</span>
        </template>
        <template v-if="column.key === 'originalPrice'">
          <span>{{ formatPrice(record.originalPrice) }}</span>
        </template>
        <template v-if="column.key === 'lowestPrice'">
          <span style="color: #1890ff">{{ formatPrice(record.lowestPrice) }}</span>
        </template>
        <template v-if="column.key === 'costPrice'">
          <span style="color: #999">{{ formatPrice(record.costPrice) }}</span>
        </template>

        <!-- Weight -->
        <template v-if="column.key === 'weight'">
          <div style="font-size: 12px; color: #666">
            <div v-if="record.weightGross">重 {{ formatWeight(record.weightGross, 'g') }}</div>
            <div v-if="record.dimensionLength">
              {{ Number(record.dimensionLength) }}×{{ Number(record.dimensionWidth) }}×{{ Number(record.dimensionHeight) }}mm
            </div>
          </div>
        </template>

        <!-- Timestamps -->
        <template v-if="column.key === 'timestamps'">
          <div style="font-size: 11px; color: #999; line-height: 1.8">
            <div>刊 {{ formatDate(record.ozonCreatedAt) }}</div>
            <div>更 {{ formatDate(record.ozonUpdatedAt) }}</div>
            <div>同 {{ formatDate(record.lastSyncAt) }}</div>
          </div>
        </template>
      </template>
    </Table>
  </div>
</template>
