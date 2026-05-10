<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  Modal,
  Table,
  InputNumber,
  Button,
  Space,
  Image,
  message,
  Tooltip,
  Popconfirm,
  Tag,
} from 'ant-design-vue';
import {
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import {
  getEditActivityProductsApi,
  batchEditPromotionProductsApi,
  type PromotionProduct,
} from '@/api/promotion';

const props = defineProps<{
  visible: boolean;
  promotionId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'save'): void;
}>();

/* ---- state ---- */
const loading = ref(false);
const saving = ref(false);
const dataSource = ref<EditRow[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(100);
const selectedRowKeys = ref<string[]>([]);

interface EditRow {
  id: string; // promotionProduct id
  productId: string;
  productName: string;
  offerId: string;
  ozonProductId: string;
  primaryImage: string | null;
  storeName: string;
  skuText: string;
  promotionTitle: string;
  originalPrice: number | null;
  lowestPromoPrice: number | null;
  promoPrice: number | null;
  promoDiscount: number | null;
  promoStock: number | null;
  removed: boolean;
}

/* ---- columns ---- */
const columns = [
  { title: '主图', key: 'image', width: 70 },
  { title: '标题 / SKU / ProductID / 店铺', key: 'info', width: 260 },
  { title: '活动', key: 'activity', width: 140 },
  { title: '原价', key: 'originalPrice', width: 100, align: 'right' as const },
  { title: '最低促销价格', key: 'lowestPrice', width: 120, align: 'right' as const },
  { title: '促销价格', key: 'promoPrice', width: 130 },
  { title: '促销折扣', key: 'promoDiscount', width: 130 },
  { title: '促销库存', key: 'promoStock', width: 130 },
  { title: '操作', key: 'action', width: 120 },
];

/* ---- data fetching ---- */
async function loadProducts() {
  if (!props.promotionId) return;
  loading.value = true;
  try {
    const res = await getEditActivityProductsApi(props.promotionId, currentPage.value, pageSize.value);
    dataSource.value = res.items.map((item: PromotionProduct) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || '',
      offerId: item.product?.offerId || '',
      ozonProductId: item.product?.ozonProductId || '',
      primaryImage: item.product?.primaryImage || null,
      storeName: item.product?.storeAccount?.storeName || '',
      skuText: item.product?.skus?.[0]?.ozonSku || '',
      promotionTitle: item.promotion?.title || '',
      originalPrice: item.originalPrice,
      lowestPromoPrice: item.lowestPromoPrice,
      promoPrice: item.promoPrice,
      promoDiscount: item.promoDiscount,
      promoStock: item.promoStock,
      removed: false,
    }));
    total.value = res.total;
  } catch {
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/* ---- computed ---- */
const visibleRows = computed(() => dataSource.value.filter((r) => !r.removed));

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys.map(String);
  },
}));

/* ---- "同首行" logic: apply first row's values to all rows ---- */
function applyFirstRowDiscount() {
  const first = visibleRows.value[0];
  if (!first) return;
  for (const row of visibleRows.value) {
    if (row.id !== first.id) {
      row.promoDiscount = first.promoDiscount;
    }
  }
  message.success('已将首行折扣应用到所有行');
}

function applyFirstRowStock() {
  const first = visibleRows.value[0];
  if (!first) return;
  for (const row of visibleRows.value) {
    if (row.id !== first.id) {
      row.promoStock = first.promoStock;
    }
  }
  message.success('已将首行库存应用到所有行');
}

function applyFirstRowPrice() {
  const first = visibleRows.value[0];
  if (!first) return;
  for (const row of visibleRows.value) {
    if (row.id !== first.id) {
      row.promoPrice = first.promoPrice;
    }
  }
  message.success('已将首行价格应用到所有行');
}

/* ---- per-row actions ---- */
function applySameDiscount(row: EditRow) {
  // Apply this row's discount to all rows in the same promotion
  for (const r of visibleRows.value) {
    if (r.id !== row.id) {
      r.promoDiscount = row.promoDiscount;
    }
  }
  message.success('已应用折扣到同活动所有商品');
}

function removeRow(row: EditRow) {
  row.removed = true;
  selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== row.id);
}

/* ---- save ---- */
async function handleSave() {
  const products = visibleRows.value.map((r) => ({
    id: r.id,
    promoPrice: r.promoPrice ?? undefined,
    promoDiscount: r.promoDiscount ?? undefined,
    promoStock: r.promoStock ?? undefined,
  }));

  if (products.length === 0) {
    message.warning('没有需要保存的数据');
    return;
  }

  saving.value = true;
  try {
    await batchEditPromotionProductsApi(props.promotionId, products);
    message.success(`已保存 ${products.length} 个商品`);
    emit('save');
  } catch {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  emit('update:visible', false);
}

function handleTableChange(pagination: any) {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
  loadProducts();
}

function formatPrice(val: number | null | undefined) {
  if (val === null || val === undefined) return '-';
  return `₽ ${Number(val).toFixed(2)}`;
}

/* ---- watch open ---- */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      currentPage.value = 1;
      selectedRowKeys.value = [];
      loadProducts();
    }
  },
);
</script>

<template>
  <Modal
    :open="visible"
    title="编辑活动"
    width="1200px"
    :maskClosable="false"
    :destroyOnClose="true"
    @cancel="handleCancel"
  >
    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div>
          <Space>
            <Button size="small" @click="applyFirstRowPrice">
              <template #icon><CopyOutlined /></template>
              促销价格同首行
            </Button>
            <Button size="small" @click="applyFirstRowDiscount">
              <template #icon><CopyOutlined /></template>
              折扣同首行
            </Button>
            <Button size="small" @click="applyFirstRowStock">
              <template #icon><CopyOutlined /></template>
              库存同首行
            </Button>
          </Space>
        </div>
        <div>
          <Space>
            <Button @click="handleCancel">取消</Button>
            <Button type="primary" :loading="saving" @click="handleSave">确定</Button>
          </Space>
        </div>
      </div>
    </template>

    <Table
      :columns="columns"
      :dataSource="visibleRows"
      :loading="loading"
      :rowSelection="rowSelection"
      :scroll="{ x: 1200, y: 500 }"
      rowKey="id"
      size="small"
      bordered
      :pagination="{
        current: currentPage,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 行`,
        pageSizeOptions: ['50', '100', '200'],
      }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- Image -->
        <template v-if="column.key === 'image'">
          <Image
            v-if="record.primaryImage"
            :src="record.primaryImage"
            :width="45"
            :height="45"
            style="object-fit: cover; border-radius: 4px"
            :preview="{ visible: false }"
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA0NSA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDUiIGhlaWdodD0iNDUiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4="
          />
          <div v-else style="width: 45px; height: 45px; background: #f5f5f5; border-radius: 4px" />
        </template>

        <!-- Info -->
        <template v-if="column.key === 'info'">
          <div style="line-height: 1.4">
            <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 230px" :title="record.productName">
              {{ record.productName || '-' }}
            </div>
            <div style="color: #888; font-size: 11px">SKU: {{ record.skuText || '-' }}</div>
            <div style="color: #888; font-size: 11px">ID: {{ record.ozonProductId || '-' }}</div>
            <div style="color: #888; font-size: 11px">{{ record.storeName }}</div>
          </div>
        </template>

        <!-- Activity -->
        <template v-if="column.key === 'activity'">
          <Tag color="blue" style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
            {{ record.promotionTitle || '-' }}
          </Tag>
        </template>

        <!-- Original Price -->
        <template v-if="column.key === 'originalPrice'">
          {{ formatPrice(record.originalPrice) }}
        </template>

        <!-- Lowest Price -->
        <template v-if="column.key === 'lowestPrice'">
          <span style="color: #faad14">{{ formatPrice(record.lowestPromoPrice) }}</span>
        </template>

        <!-- Editable: Promo Price -->
        <template v-if="column.key === 'promoPrice'">
          <InputNumber
            v-model:value="record.promoPrice"
            :min="0"
            :precision="2"
            size="small"
            style="width: 110px"
            placeholder="促销价"
          />
        </template>

        <!-- Editable: Promo Discount -->
        <template v-if="column.key === 'promoDiscount'">
          <InputNumber
            v-model:value="record.promoDiscount"
            :min="0"
            :max="100"
            :precision="0"
            size="small"
            style="width: 110px"
            placeholder="折扣%"
            :formatter="(val: any) => val ? `${val}%` : ''"
            :parser="(val: any) => val ? val.replace('%', '') : ''"
          />
        </template>

        <!-- Editable: Promo Stock -->
        <template v-if="column.key === 'promoStock'">
          <InputNumber
            v-model:value="record.promoStock"
            :min="0"
            :precision="0"
            size="small"
            style="width: 110px"
            placeholder="库存"
          />
        </template>

        <!-- Actions -->
        <template v-if="column.key === 'action'">
          <Space :size="2" direction="vertical">
            <Tooltip title="同活动使用此折扣">
              <Button type="link" size="small" @click="applySameDiscount(record as EditRow)">
                同折扣
              </Button>
            </Tooltip>
            <Popconfirm title="确定移除此商品？" @confirm="removeRow(record as EditRow)" okText="确定" cancelText="取消">
              <Button type="link" size="small" danger>
                <template #icon><DeleteOutlined /></template>
                移除
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>
  </Modal>
</template>
