<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Tabs,
  TabPane,
  Button,
  Space,
  Table,
  Tag,
  Badge,
  Input,
  Image,
  message,
  Popconfirm,
  Divider,
} from 'ant-design-vue';
import {
  SyncOutlined,
  PlusOutlined,
  EditOutlined,
  LogoutOutlined,
  SettingOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import {
  getPromotionProductsApi,
  getStatusCountsApi,
  syncPromotionsApi,
  exitPromotionApi,
  type PromotionProduct,
  type StatusCounts,
} from '@/api/promotion';
import EditActivityModal from './components/EditActivityModal.vue';
import dayjs from 'dayjs';

const storeAccountStore = useStoreAccountStore();

/* ---- state ---- */
const activeTab = ref<string>('ALL');
const loading = ref(false);
const syncLoading = ref(false);
const dataSource = ref<PromotionProduct[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(50);
const selectedRowKeys = ref<string[]>([]);
const keyword = ref('');

const statusCounts = ref<StatusCounts>({ total: 0, joined: 0, notJoined: 0 });

/* edit-activity modal */
const editModalVisible = ref(false);
const editPromotionId = ref('');
const editProductId = ref<string | undefined>(undefined);

/* ---- computed ---- */
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');

const statusTabs = computed(() => [
  { key: 'ALL', label: '全部', count: statusCounts.value.total },
  { key: 'JOINED', label: '已参加', count: statusCounts.value.joined },
  { key: 'NOT_JOINED', label: '未参加', count: statusCounts.value.notJoined },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys.map(String);
  },
}));

/* ---- columns ---- */
const columns = [
  { title: '主图', key: 'image', width: 70, fixed: 'left' as const },
  { title: '标题 / SKU / ProductID / 店铺', key: 'info', width: 280, fixed: 'left' as const },
  { title: '状态', key: 'status', width: 90 },
  { title: '原价', key: 'originalPrice', width: 100, align: 'right' as const },
  { title: '最低促销价', key: 'lowestPrice', width: 110, align: 'right' as const },
  { title: '促销价格', key: 'promoPrice', width: 100, align: 'right' as const },
  { title: '在售/促销库存', key: 'stock', width: 130 },
  { title: '参加方式', key: 'participation', width: 100, align: 'center' as const },
  { title: '活动时间', key: 'activityTime', width: 200 },
  { title: '促销活动', key: 'activityName', width: 200 },
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
    if (activeTab.value !== 'ALL') params.participationStatus = activeTab.value;
    if (keyword.value) params.keyword = keyword.value;

    const res = await getPromotionProductsApi(params);
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
    statusCounts.value = await getStatusCountsApi(storeAccountId.value || undefined);
  } catch {
    statusCounts.value = { total: 0, joined: 0, notJoined: 0 };
  }
}

async function loadAll() {
  await Promise.all([fetchData(), fetchCounts()]);
}

/* ---- actions ---- */
async function handleSync() {
  if (!storeAccountId.value) {
    message.warning('请先选择店铺');
    return;
  }
  syncLoading.value = true;
  try {
    const res: any = await syncPromotionsApi(storeAccountId.value);
    if (res.error) {
      message.warning(`同步部分完成：成功 ${res.synced} 个活动，失败 ${res.failed} 个。${res.error}`);
    } else {
      message.success(`同步完成：成功 ${res.synced} 个活动，失败 ${res.failed} 个`);
    }
    await loadAll();
  } catch {
    message.error('同步请求失败，请稍后重试');
  } finally {
    syncLoading.value = false;
  }
}

function handleEditActivity() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要编辑的商品');
    return;
  }
  const first = dataSource.value.find((d) => d.id === selectedRowKeys.value[0]);
  if (first) {
    editPromotionId.value = first.promotionId;
    editProductId.value = undefined;
    editModalVisible.value = true;
  }
}

async function handleExitActivity() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要退出的商品');
    return;
  }
  if (!storeAccountId.value) {
    message.warning('请先选择店铺');
    return;
  }
  const grouped: Record<string, string[]> = {};
  for (const key of selectedRowKeys.value) {
    const item = dataSource.value.find((d) => d.id === key);
    if (item) {
      if (!grouped[item.promotionId]) grouped[item.promotionId] = [];
      grouped[item.promotionId].push(item.productId);
    }
  }
  try {
    for (const [promoId, productIds] of Object.entries(grouped)) {
      await exitPromotionApi(promoId, storeAccountId.value, productIds);
    }
    message.success('退出活动成功');
    selectedRowKeys.value = [];
    await loadAll();
  } catch {
    message.error('退出活动失败');
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handleReset() {
  keyword.value = '';
  activeTab.value = 'ALL';
  currentPage.value = 1;
  loadAll();
}

function handleTabChange() {
  currentPage.value = 1;
  fetchData();
}

function handleTableChange(pagination: any) {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
  fetchData();
}

function handleEditModalSave() {
  editModalVisible.value = false;
  loadAll();
}

function formatPrice(val: number | null | undefined) {
  if (val === null || val === undefined) return '-';
  return `₽ ${Number(val).toFixed(2)}`;
}

function formatDate(d: string | null) {
  if (!d) return '-';
  return dayjs(d).format('YYYY-MM-DD HH:mm');
}

/* ---- lifecycle ---- */
onMounted(() => {
  loadAll();
});

watch(storeAccountId, () => {
  currentPage.value = 1;
  loadAll();
});
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">OZON促销活动</h2>
        <p class="page-desc">管理促销活动商品，支持批量编辑价格和库存</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <Space wrap :size="8">
        <Button type="primary" :loading="syncLoading" @click="handleSync">
          <template #icon><SyncOutlined /></template>
          同步活动
        </Button>
        <Divider type="vertical" />
        <Button @click="handleEditActivity" :disabled="selectedRowKeys.length === 0">
          <template #icon><EditOutlined /></template>
          编辑活动
        </Button>
        <Popconfirm
          title="确定退出所选商品的促销活动？"
          @confirm="handleExitActivity"
          okText="确定"
          cancelText="取消"
          :disabled="selectedRowKeys.length === 0"
        >
          <Button danger :disabled="selectedRowKeys.length === 0">
            <template #icon><LogoutOutlined /></template>
            退出活动
          </Button>
        </Popconfirm>
      </Space>
    </div>

    <!-- Status Tabs -->
    <Tabs v-model:activeKey="activeTab" @change="handleTabChange" class="status-tabs">
      <TabPane v-for="tab in statusTabs" :key="tab.key">
        <template #tab>
          {{ tab.label }}
          <Badge
            :count="tab.count"
            :overflowCount="99999"
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

    <!-- Search -->
    <div class="search-bar">
      <Input
        v-model:value="keyword"
        placeholder="搜索标题 / SKU / ProductID"
        style="width: 280px"
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

    <!-- Promotion Table -->
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
        current: currentPage,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 行`,
        pageSizeOptions: ['20', '50', '100'],
      }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- Image -->
        <template v-if="column.key === 'image'">
          <Image
            v-if="record.product?.primaryImage"
            :src="record.product.primaryImage"
            :width="50"
            :height="50"
            style="object-fit: cover; border-radius: 6px"
            :preview="{ visible: false }"
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSIyNSIgeT0iMjUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWc8L3RleHQ+PC9zdmc+"
          />
          <div v-else class="img-placeholder" />
        </template>

        <!-- Info -->
        <template v-if="column.key === 'info'">
          <div style="line-height: 1.5">
            <div class="product-name" :title="record.product?.name">
              {{ record.product?.name || '-' }}
            </div>
            <div class="product-meta">
              SKU: {{ record.product?.skus?.[0]?.ozonSku || '-' }}
            </div>
            <div class="product-meta">
              ID: {{ record.product?.ozonProductId || '-' }}
            </div>
            <div class="product-meta">
              {{ record.product?.storeAccount?.storeName || '-' }}
            </div>
          </div>
        </template>

        <!-- Status -->
        <template v-if="column.key === 'status'">
          <Tag v-if="record.participationStatus === 'JOINED'" color="success" style="margin: 0">已参加</Tag>
          <Tag v-else-if="record.participationStatus === 'NOT_JOINED'" color="warning" style="margin: 0">未参加</Tag>
          <Tag v-else-if="record.participationStatus === 'EXITED'" color="error" style="margin: 0">已退出</Tag>
          <Tag v-else>{{ record.participationStatus }}</Tag>
        </template>

        <!-- Original Price -->
        <template v-if="column.key === 'originalPrice'">
          <span style="color: #595959">{{ formatPrice(record.originalPrice) }}</span>
        </template>

        <!-- Lowest Promo Price -->
        <template v-if="column.key === 'lowestPrice'">
          <span style="color: #faad14; font-weight: 500">{{ formatPrice(record.lowestPromoPrice) }}</span>
        </template>

        <!-- Promo Price -->
        <template v-if="column.key === 'promoPrice'">
          <span style="color: #f5222d; font-weight: 600">{{ formatPrice(record.promoPrice) }}</span>
        </template>

        <!-- Stock -->
        <template v-if="column.key === 'stock'">
          <span style="font-weight: 500">{{ record.product?.totalStock ?? '-' }}</span>
          <span style="color: #d9d9d9; margin: 0 4px">/</span>
          <span style="color: #1890ff; font-weight: 500">{{ record.promoStock ?? '-' }}</span>
        </template>

        <!-- Participation -->
        <template v-if="column.key === 'participation'">
          <Tag v-if="record.promotion?.participationType === 'AUTO'" color="processing" style="margin: 0">自动</Tag>
          <Tag v-else style="margin: 0">手动</Tag>
        </template>

        <!-- Activity Time -->
        <template v-if="column.key === 'activityTime'">
          <div style="font-size: 12px; color: #595959; line-height: 1.6">
            <div>{{ formatDate(record.promotion?.startDate) }}</div>
            <div style="color: #8c8c8c">{{ formatDate(record.promotion?.endDate) }}</div>
          </div>
        </template>

        <!-- Activity Name -->
        <template v-if="column.key === 'activityName'">
          <span class="activity-name" :title="record.promotion?.title">
            {{ record.promotion?.title || '-' }}
          </span>
        </template>

        <!-- Action -->
        <template v-if="column.key === 'action'">
          <Button
            type="link"
            size="small"
            @click="() => { editPromotionId = record.promotionId; editProductId = record.productId; editModalVisible = true; }"
          >
            编辑
          </Button>
        </template>
      </template>
    </Table>

    <!-- Edit Activity Modal -->
    <EditActivityModal
      v-model:visible="editModalVisible"
      :promotionId="editPromotionId"
      :productId="editProductId"
      @save="handleEditModalSave"
    />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.page-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}
.page-desc {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.toolbar {
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
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 250px;
  color: #1a1a1a;
}
.product-meta {
  color: #8c8c8c;
  font-size: 12px;
}

.img-placeholder {
  width: 50px;
  height: 50px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px dashed #e8e8e8;
}

.activity-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 180px;
  color: #595959;
}
</style>
