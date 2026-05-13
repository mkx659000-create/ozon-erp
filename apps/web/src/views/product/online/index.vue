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
  InputNumber,
  Badge,
  Image,
  Tooltip,
  message,
  Divider,
  Modal,
  Form,
  FormItem,
  Drawer,
  Descriptions,
  DescriptionsItem,
  Popconfirm,
  Textarea,
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
  DownloadOutlined,
  SaveOutlined,
} from '@ant-design/icons-vue';
import {
  getProductsApi,
  getProductByIdApi,
  updateProductApi,
  batchUpdateProductsApi,
  getStatusCountsApi,
  syncProductsApi,
  exportProductsApi,
  archiveProductsApi,
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

/* ---- Batch Edit Modal ---- */
const batchEditVisible = ref(false);
const batchEditLoading = ref(false);
const batchEditForm = ref({
  costPrice: undefined as number | undefined,
  notes: '',
  categoryName: '',
  updateCostPrice: false,
  updateNotes: false,
  updateCategoryName: false,
});

/* ---- Single Product Edit Drawer ---- */
const editDrawerVisible = ref(false);
const editDrawerLoading = ref(false);
const editSaveLoading = ref(false);
const editProduct = ref<Product | null>(null);
const editForm = ref({
  costPrice: undefined as number | undefined,
  notes: '',
  categoryName: '',
  visible: true,
});

/* ---- Export ---- */
const exportLoading = ref(false);

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

/* ---- Batch Edit ---- */
function openBatchEdit() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要编辑的商品');
    return;
  }
  batchEditForm.value = {
    costPrice: undefined,
    notes: '',
    categoryName: '',
    updateCostPrice: false,
    updateNotes: false,
    updateCategoryName: false,
  };
  batchEditVisible.value = true;
}

async function handleBatchEditSave() {
  const updates: Record<string, any> = {};
  if (batchEditForm.value.updateCostPrice && batchEditForm.value.costPrice !== undefined) {
    updates.costPrice = batchEditForm.value.costPrice;
  }
  if (batchEditForm.value.updateNotes) {
    updates.notes = batchEditForm.value.notes;
  }
  if (batchEditForm.value.updateCategoryName && batchEditForm.value.categoryName) {
    updates.categoryName = batchEditForm.value.categoryName;
  }

  if (Object.keys(updates).length === 0) {
    message.warning('请至少勾选一个要修改的字段');
    return;
  }

  batchEditLoading.value = true;
  try {
    const res = await batchUpdateProductsApi(selectedRowKeys.value, updates);
    message.success(`成功更新 ${res.updated} 个商品`);
    batchEditVisible.value = false;
    selectedRowKeys.value = [];
    await fetchProducts();
  } catch {
    message.error('批量编辑失败');
  } finally {
    batchEditLoading.value = false;
  }
}

/* ---- Batch Archive ---- */
async function handleBatchArchive() {
  if (selectedRowKeys.value.length === 0) return;
  try {
    const res = await archiveProductsApi(selectedRowKeys.value);
    message.success(`成功归档 ${res.updated} 个商品`);
    selectedRowKeys.value = [];
    await Promise.all([fetchProducts(), fetchStatusCounts()]);
  } catch {
    message.error('归档失败');
  }
}

/* ---- Export ---- */
async function handleExport() {
  exportLoading.value = true;
  try {
    const params: any = {};
    if (storeAccountStore.activeStoreId) {
      params.storeAccountId = storeAccountStore.activeStoreId;
    }
    if (activeTab.value !== 'ALL') {
      params.status = activeTab.value;
    }
    if (searchText.value) {
      params.keyword = searchText.value;
    }

    const data = await exportProductsApi(params);
    if (!data || data.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    // Generate CSV
    const headers = [
      '商品名称', 'SKU', 'Ozon产品ID', '状态', '售价', '原价', '最低价',
      '成本', '货币', '总库存', '14天销量', '毛重(g)', '长(mm)', '宽(mm)',
      '高(mm)', '分类', '备注', '店铺', '刊登时间', '同步时间',
    ];
    const rows = data.map((p: any) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.offerId || '',
      p.ozonProductId || '',
      p.status || '',
      p.sellingPrice ?? '',
      p.originalPrice ?? '',
      p.lowestPrice ?? '',
      p.costPrice ?? '',
      p.currencyCode || '',
      p.totalStock ?? '',
      p.sales14d ?? '',
      p.weightGross ?? '',
      p.dimensionLength ?? '',
      p.dimensionWidth ?? '',
      p.dimensionHeight ?? '',
      `"${(p.categoryName || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      p.storeName || '',
      p.ozonCreatedAt ? dayjs(p.ozonCreatedAt).format('YYYY-MM-DD HH:mm') : '',
      p.lastSyncAt ? dayjs(p.lastSyncAt).format('YYYY-MM-DD HH:mm') : '',
    ]);

    const csvContent = '﻿' + headers.join(',') + '\n' + rows.map((r: any[]) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(`成功导出 ${data.length} 条数据`);
  } catch {
    message.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
}

/* ---- Single Product Edit ---- */
async function openEditDrawer(productId: string) {
  editDrawerLoading.value = true;
  editDrawerVisible.value = true;
  try {
    const product = await getProductByIdApi(productId);
    editProduct.value = product;
    editForm.value = {
      costPrice: product.costPrice !== null ? Number(product.costPrice) : undefined,
      notes: product.notes || '',
      categoryName: product.categoryName || '',
      visible: product.visible,
    };
  } catch {
    message.error('加载产品详情失败');
  } finally {
    editDrawerLoading.value = false;
  }
}

async function handleEditSave() {
  if (!editProduct.value) return;
  editSaveLoading.value = true;
  try {
    await updateProductApi(editProduct.value.id, {
      costPrice: editForm.value.costPrice,
      notes: editForm.value.notes || undefined,
      categoryName: editForm.value.categoryName || undefined,
      visible: editForm.value.visible,
    } as any);
    message.success('保存成功');
    editDrawerVisible.value = false;
    await fetchProducts();
  } catch {
    message.error('保存失败');
  } finally {
    editSaveLoading.value = false;
  }
}

watch(activeTab, () => {
  pagination.value.current = 1;
  fetchProducts();
});

watch(() => storeAccountStore.activeStoreId, () => {
  pagination.value.current = 1;
  fetchProducts();
  fetchStatusCounts();
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
          <Button :disabled="selectedRowKeys.length === 0" @click="openBatchEdit">
            <template #icon><EditOutlined /></template>
            批量编辑
          </Button>
          <Popconfirm
            title="确定将所选商品归档？"
            description="归档后商品将标记为归档状态，可在归档标签页查看。"
            @confirm="handleBatchArchive"
            okText="确定归档"
            cancelText="取消"
            okType="danger"
            :disabled="selectedRowKeys.length === 0"
          >
            <Button danger :disabled="selectedRowKeys.length === 0">
              <template #icon><DeleteOutlined /></template>
              批量归档
            </Button>
          </Popconfirm>
          <Divider type="vertical" />
          <Button :loading="exportLoading" @click="handleExport">
            <template #icon><DownloadOutlined /></template>
            导出CSV
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
              <div class="product-name" @click="openEditDrawer(record.id)">{{ record.name }}</div>
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
            <Button type="link" size="small" @click="openEditDrawer(record.id)">编辑</Button>
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
              {{ Number(record.dimensionLength) }}x{{ Number(record.dimensionWidth) }}x{{ Number(record.dimensionHeight) }}mm
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

    <!-- Batch Edit Modal -->
    <Modal
      v-model:open="batchEditVisible"
      title="批量编辑"
      :confirmLoading="batchEditLoading"
      @ok="handleBatchEditSave"
      okText="保存"
      cancelText="取消"
      :width="500"
    >
      <div style="padding: 8px 0 16px; color: #8c8c8c; font-size: 13px">
        已选择 <strong style="color: #1890ff">{{ selectedRowKeys.length }}</strong> 个商品，勾选要修改的字段：
      </div>
      <Form layout="vertical">
        <FormItem>
          <template #label>
            <label style="display: flex; align-items: center; gap: 8px">
              <input type="checkbox" v-model="batchEditForm.updateCostPrice" />
              成本价 (RUB)
            </label>
          </template>
          <InputNumber
            v-model:value="batchEditForm.costPrice"
            :disabled="!batchEditForm.updateCostPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="输入成本价"
            size="large"
          />
        </FormItem>
        <FormItem>
          <template #label>
            <label style="display: flex; align-items: center; gap: 8px">
              <input type="checkbox" v-model="batchEditForm.updateNotes" />
              备注
            </label>
          </template>
          <Textarea
            v-model:value="batchEditForm.notes"
            :disabled="!batchEditForm.updateNotes"
            :rows="3"
            placeholder="输入备注内容"
          />
        </FormItem>
        <FormItem>
          <template #label>
            <label style="display: flex; align-items: center; gap: 8px">
              <input type="checkbox" v-model="batchEditForm.updateCategoryName" />
              分类名称
            </label>
          </template>
          <Input
            v-model:value="batchEditForm.categoryName"
            :disabled="!batchEditForm.updateCategoryName"
            placeholder="输入分类名称"
            size="large"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- Single Product Edit Drawer -->
    <Drawer
      v-model:open="editDrawerVisible"
      title="编辑产品"
      :width="560"
      :destroyOnClose="true"
    >
      <template v-if="editProduct">
        <!-- Product Info (read-only) -->
        <Descriptions bordered size="small" :column="2" style="margin-bottom: 24px">
          <DescriptionsItem label="商品名称" :span="2">
            <span style="font-weight: 500">{{ editProduct.name }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="Ozon ID">
            {{ editProduct.ozonProductId }}
          </DescriptionsItem>
          <DescriptionsItem label="SKU">
            {{ editProduct.offerId || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag
              :color="editProduct.status === 'ON_SALE' ? 'green' :
                      editProduct.status === 'MODERATION' ? 'blue' :
                      editProduct.status === 'MODERATION_FAILED' ? 'red' : 'default'"
              style="margin: 0"
            >
              {{ editProduct.status }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="售价">
            <span style="color: #52c41a; font-weight: 600">
              {{ formatPrice(editProduct.sellingPrice) }}
            </span>
          </DescriptionsItem>
          <DescriptionsItem label="总库存">
            <Tag :color="(editProduct.totalStock ?? 0) > 0 ? 'green' : 'red'" style="margin: 0">
              {{ editProduct.totalStock ?? 0 }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="14天销量">
            {{ editProduct.sales14d ?? 0 }}
          </DescriptionsItem>
        </Descriptions>

        <!-- Editable Fields -->
        <h4 style="margin: 0 0 16px; font-weight: 600; font-size: 15px">可编辑字段</h4>
        <Form layout="vertical">
          <FormItem label="成本价 (RUB)">
            <InputNumber
              v-model:value="editForm.costPrice"
              :min="0"
              :precision="2"
              style="width: 100%"
              size="large"
              placeholder="输入成本价"
            />
          </FormItem>
          <FormItem label="分类名称">
            <Input
              v-model:value="editForm.categoryName"
              placeholder="输入分类名称"
              size="large"
            />
          </FormItem>
          <FormItem label="备注">
            <Textarea
              v-model:value="editForm.notes"
              :rows="3"
              placeholder="输入备注"
              showCount
              :maxlength="500"
            />
          </FormItem>
        </Form>

        <div class="drawer-actions">
          <Button size="large" @click="editDrawerVisible = false">取消</Button>
          <Button type="primary" size="large" :loading="editSaveLoading" @click="handleEditSave">
            <template #icon><SaveOutlined /></template>
            保存
          </Button>
        </div>
      </template>
    </Drawer>
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
.product-name:hover {
  text-decoration: underline;
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

.drawer-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
