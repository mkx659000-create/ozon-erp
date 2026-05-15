<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  Modal,
  Table,
  InputNumber,
  Button,
  Input,
  Image,
  message,
  Space,
} from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import {
  getCandidateProductsApi,
  joinPromotionApi,
  type CandidateProduct,
} from '@/api/promotion';

const props = defineProps<{
  visible: boolean;
  promotionId: string;
  storeAccountId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'joined'): void;
}>();

const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const candidates = ref<CandidateProduct[]>([]);
const selectedRowKeys = ref<string[]>([]);

interface JoinRow {
  productId: string;
  actionPrice: number | undefined;
  stock: number | undefined;
}
const joinData = ref<Map<string, JoinRow>>(new Map());

const columns = [
  { title: '主图', key: 'image', width: 60 },
  { title: '商品信息', key: 'info', width: 260 },
  { title: '在售价', dataIndex: 'sellingPrice', width: 100, align: 'right' as const },
  { title: '库存', dataIndex: 'totalStock', width: 80, align: 'right' as const },
  { title: '促销价', key: 'actionPrice', width: 130 },
  { title: '促销库存', key: 'stock', width: 130 },
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys.map(String);
    for (const key of keys) {
      if (!joinData.value.has(String(key))) {
        joinData.value.set(String(key), { productId: String(key), actionPrice: undefined, stock: undefined });
      }
    }
  },
}));

function getJoinRow(productId: string): JoinRow {
  if (!joinData.value.has(productId)) {
    joinData.value.set(productId, { productId, actionPrice: undefined, stock: undefined });
  }
  return joinData.value.get(productId)!;
}

async function loadCandidates() {
  if (!props.promotionId) return;
  loading.value = true;
  try {
    candidates.value = await getCandidateProductsApi(props.promotionId, keyword.value || undefined);
  } catch {
    candidates.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleJoin() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要加入的商品');
    return;
  }

  const products = selectedRowKeys.value
    .map((id) => {
      const row = joinData.value.get(id);
      if (!row || !row.actionPrice || !row.stock) return null;
      return { productId: id, actionPrice: row.actionPrice, stock: row.stock };
    })
    .filter(Boolean) as Array<{ productId: string; actionPrice: number; stock: number }>;

  if (products.length === 0) {
    message.warning('请为选中的商品填写促销价和库存');
    return;
  }

  saving.value = true;
  try {
    const res: any = await joinPromotionApi(props.promotionId, props.storeAccountId, products);
    message.success(`成功加入 ${res.joined || products.length} 个商品`);
    emit('joined');
    emit('update:visible', false);
  } catch {
    message.error('加入活动失败');
  } finally {
    saving.value = false;
  }
}

function formatPrice(val: number | null | undefined) {
  if (val === null || val === undefined) return '-';
  return `₽ ${Number(val).toFixed(2)}`;
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      keyword.value = '';
      selectedRowKeys.value = [];
      joinData.value = new Map();
      loadCandidates();
    }
  },
);
</script>

<template>
  <Modal
    :open="visible"
    title="加入促销活动"
    width="1000px"
    :maskClosable="false"
    :destroyOnClose="true"
    @cancel="emit('update:visible', false)"
  >
    <template #footer>
      <Space>
        <span style="color: #8c8c8c; font-size: 12px; margin-right: 8px">
          已选 {{ selectedRowKeys.length }} 个商品
        </span>
        <Button @click="emit('update:visible', false)">取消</Button>
        <Button type="primary" :loading="saving" @click="handleJoin" :disabled="selectedRowKeys.length === 0">
          确定加入
        </Button>
      </Space>
    </template>

    <div style="display: flex; gap: 8px; margin-bottom: 12px">
      <Input
        v-model:value="keyword"
        placeholder="搜索商品名称 / SKU"
        style="width: 280px"
        allowClear
        @pressEnter="loadCandidates"
      >
        <template #prefix><SearchOutlined style="color: #bfbfbf" /></template>
      </Input>
      <Button type="primary" @click="loadCandidates">搜索</Button>
    </div>

    <Table
      :columns="columns"
      :dataSource="candidates"
      :loading="loading"
      :rowSelection="rowSelection"
      :scroll="{ y: 400 }"
      rowKey="id"
      size="small"
      bordered
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'image'">
          <Image
            v-if="record.primaryImage"
            :src="record.primaryImage"
            :width="40"
            :height="40"
            style="object-fit: cover; border-radius: 4px"
            :preview="{ visible: false }"
          />
          <div v-else style="width: 40px; height: 40px; background: #f5f5f5; border-radius: 4px" />
        </template>

        <template v-if="column.key === 'info'">
          <div style="line-height: 1.4">
            <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 230px">
              {{ record.name || '-' }}
            </div>
            <div style="color: #8c8c8c; font-size: 11px">
              SKU: {{ record.skus?.[0]?.ozonSku || '-' }} | ID: {{ record.ozonProductId || '-' }}
            </div>
          </div>
        </template>

        <template v-if="column.dataIndex === 'sellingPrice'">
          {{ formatPrice(record.sellingPrice) }}
        </template>

        <template v-if="column.key === 'actionPrice'">
          <InputNumber
            v-model:value="getJoinRow(record.id).actionPrice"
            :min="0"
            :precision="2"
            size="small"
            style="width: 110px"
            placeholder="促销价"
          />
        </template>

        <template v-if="column.key === 'stock'">
          <InputNumber
            v-model:value="getJoinRow(record.id).stock"
            :min="0"
            :precision="0"
            size="small"
            style="width: 110px"
            placeholder="库存"
          />
        </template>
      </template>
    </Table>
  </Modal>
</template>
