<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  TabPane,
  message,
  Empty,
  Tooltip,
} from 'ant-design-vue';
import {
  MoneyCollectOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import {
  listStrategiesApi,
  getProductPriceDetailsApi,
} from '@/api/pricing';
import type { PricingStrategy, ProductPricingInfo } from '@/api/pricing';

const storeAccountStore = useStoreAccountStore();

const strategies = ref<PricingStrategy[]>([]);
const priceDetails = ref<ProductPricingInfo[]>([]);
const loading = ref(false);
const activeTab = ref('prices');

const strategyColumns = [
  { title: 'ID', dataIndex: 'id', width: 200, ellipsis: true },
  { title: '策略名称', dataIndex: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'type', width: 120 },
  { title: '状态', dataIndex: 'enabled', width: 80 },
  { title: '创建时间', dataIndex: 'created_at', width: 170 },
];

const priceColumns = [
  { title: '产品ID', dataIndex: 'product_id', width: 100 },
  { title: 'Offer ID', dataIndex: 'offer_id', width: 140, ellipsis: true },
  { title: '售价', key: 'price', width: 100, align: 'right' as const },
  { title: '原价', key: 'old_price', width: 100, align: 'right' as const },
  { title: '最低价', key: 'min_price', width: 100, align: 'right' as const },
  { title: '佣金%', key: 'commission_pct', width: 80, align: 'right' as const },
  { title: '佣金额', key: 'commission_val', width: 100, align: 'right' as const },
  { title: 'FBO物流', key: 'fbo_fulfillment', width: 100, align: 'right' as const },
  { title: '价格指数', dataIndex: 'price_index', width: 100 },
];

const priceIndexColors: Record<string, string> = {
  WITHOUT_INDEX: 'default',
  PROFIT: 'green',
  AVG_PROFIT: 'cyan',
  NON_PROFIT: 'red',
};

function formatDate(val: string) {
  if (!val) return '-';
  return new Date(val).toLocaleString('zh-CN');
}

async function loadStrategies() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  loading.value = true;
  try {
    const result = await listStrategiesApi(storeId);
    strategies.value = result.items || [];
  } catch {
    // Pricing strategy API may not be available for all sellers
    strategies.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadPriceDetails() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  loading.value = true;
  try {
    priceDetails.value = await getProductPriceDetailsApi(storeId);
  } catch {
    message.error('加载价格详情失败');
  } finally {
    loading.value = false;
  }
}

function handleTabChange(key: string | number) {
  activeTab.value = String(key);
  if (key === 'strategies' && strategies.value.length === 0) {
    loadStrategies();
  }
}

watch(() => storeAccountStore.activeStoreId, () => {
  priceDetails.value = [];
  strategies.value = [];
  if (activeTab.value === 'prices') loadPriceDetails();
  else loadStrategies();
});

onMounted(() => {
  loadPriceDetails();
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0; font-size: 20px">
        <MoneyCollectOutlined style="margin-right: 8px" />
        定价管理
      </h2>
      <Button
        @click="activeTab === 'prices' ? loadPriceDetails() : loadStrategies()"
        :loading="loading"
        :disabled="!storeAccountStore.activeStoreId"
      >
        <ReloadOutlined /> 刷新
      </Button>
    </div>

    <Card v-if="!storeAccountStore.activeStoreId">
      <Empty description="请先选择店铺" />
    </Card>

    <template v-else>
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <TabPane key="prices" tab="价格详情">
          <Table
            :columns="priceColumns"
            :dataSource="priceDetails"
            :loading="loading"
            rowKey="product_id"
            size="middle"
            :pagination="{ pageSize: 50, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
            :scroll="{ x: 900 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'price'">
                {{ record.price?.price || '-' }}
              </template>
              <template v-if="column.key === 'old_price'">
                {{ record.price?.old_price || '-' }}
              </template>
              <template v-if="column.key === 'min_price'">
                {{ record.price?.min_price || '-' }}
              </template>
              <template v-if="column.key === 'commission_pct'">
                {{ record.commission?.percent != null ? `${record.commission.percent}%` : '-' }}
              </template>
              <template v-if="column.key === 'commission_val'">
                {{ record.commission?.value != null ? record.commission.value.toFixed(2) : '-' }}
              </template>
              <template v-if="column.key === 'fbo_fulfillment'">
                {{ record.commission?.fbo_fulfillment_amount != null ? record.commission.fbo_fulfillment_amount.toFixed(2) : '-' }}
              </template>
              <template v-if="column.dataIndex === 'price_index'">
                <Tag :color="priceIndexColors[record.price_index] || 'default'">
                  {{ record.price_index || '-' }}
                </Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="strategies" tab="定价策略">
          <Table
            :columns="strategyColumns"
            :dataSource="strategies"
            :loading="loading"
            rowKey="id"
            size="middle"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'enabled'">
                <Tag :color="record.enabled ? 'green' : 'default'">
                  {{ record.enabled ? '启用' : '禁用' }}
                </Tag>
              </template>
              <template v-if="column.dataIndex === 'created_at'">
                {{ formatDate(record.created_at) }}
              </template>
            </template>
          </Table>
          <Empty v-if="!loading && strategies.length === 0" description="暂无定价策略" />
        </TabPane>
      </Tabs>
    </template>
  </div>
</template>
