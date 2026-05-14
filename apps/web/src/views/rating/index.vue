<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Tabs,
  TabPane,
  message,
  Empty,
} from 'ant-design-vue';
import {
  StarOutlined,
  SyncOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import {
  getCurrentRatingApi,
  getStockDistributionApi,
  syncRatingApi,
} from '@/api/rating';
import type { RatingSummary, StockOnWarehouseItem } from '@/api/rating';

const storeAccountStore = useStoreAccountStore();

const ratingSummary = ref<RatingSummary | null>(null);
const stockData = ref<StockOnWarehouseItem[]>([]);
const loading = ref(false);
const syncing = ref(false);
const activeTab = ref('rating');

const stockColumns = [
  { title: 'SKU', dataIndex: 'sku', width: 100 },
  { title: '商品编码', dataIndex: 'item_code', width: 140, ellipsis: true },
  { title: '商品名称', dataIndex: 'item_name', ellipsis: true },
  { title: '仓库', dataIndex: 'warehouse_name', width: 160, ellipsis: true },
  { title: '承诺库存', dataIndex: 'promised_amount', width: 100, align: 'right' as const },
  { title: '可售库存', dataIndex: 'free_to_sell_amount', width: 100, align: 'right' as const },
  { title: '预留库存', dataIndex: 'reserved_amount', width: 100, align: 'right' as const },
];

function getRatingColor(item: any) {
  if (item.current_value <= item.status?.danger) return '#ff4d4f';
  if (item.current_value <= item.status?.warning) return '#faad14';
  return '#52c41a';
}

function getRatingTag(item: any) {
  if (item.current_value <= item.status?.danger) return 'error';
  if (item.current_value <= item.status?.warning) return 'warning';
  return 'success';
}

async function loadRating() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  loading.value = true;
  try {
    ratingSummary.value = await getCurrentRatingApi(storeId);
  } catch {
    message.error('加载评分失败');
  } finally {
    loading.value = false;
  }
}

async function loadStockDistribution() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  loading.value = true;
  try {
    stockData.value = await getStockDistributionApi(storeId);
  } catch {
    message.error('加载库存分布失败');
  } finally {
    loading.value = false;
  }
}

async function handleSync() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  syncing.value = true;
  try {
    const result = await syncRatingApi(storeId);
    message.success(`同步完成：${result.synced} 条评分记录`);
    await loadRating();
  } catch {
    message.error('同步评分失败');
  } finally {
    syncing.value = false;
  }
}

function handleTabChange(key: string | number) {
  activeTab.value = String(key);
  if (key === 'stock' && stockData.value.length === 0) {
    loadStockDistribution();
  }
}

watch(() => storeAccountStore.activeStoreId, () => {
  loadRating();
  stockData.value = [];
});

onMounted(() => {
  loadRating();
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0; font-size: 20px">
        <StarOutlined style="margin-right: 8px" />
        卖家评分
      </h2>
      <Button type="primary" :loading="syncing" @click="handleSync" :disabled="!storeAccountStore.activeStoreId">
        <SyncOutlined />
        同步评分
      </Button>
    </div>

    <Card v-if="!storeAccountStore.activeStoreId">
      <Empty description="请先选择店铺" />
    </Card>

    <template v-else>
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <TabPane key="rating" tab="当前评分">
          <div v-if="ratingSummary">
            <div style="margin-bottom: 12px">
              <Tag :color="ratingSummary.premium ? 'gold' : 'default'" style="font-size: 14px; padding: 4px 12px">
                {{ ratingSummary.premium ? 'Premium 卖家' : '普通卖家' }}
              </Tag>
            </div>

            <Row :gutter="[16, 16]">
              <Col :span="24" v-for="group in ratingSummary.groups" :key="group.group_name">
                <Card :title="group.group_name" size="small">
                  <Row :gutter="16">
                    <Col :span="8" v-for="item in group.items" :key="item.rating_name">
                      <Card size="small" :bordered="false" style="background: #fafafa">
                        <div style="margin-bottom: 4px; color: #666; font-size: 13px">{{ item.rating_name }}</div>
                        <div style="display: flex; align-items: baseline; gap: 8px">
                          <span :style="{ fontSize: '28px', fontWeight: 600, color: getRatingColor(item) }">
                            {{ item.current_value }}
                          </span>
                          <span v-if="item.value_type === 'PERCENT'">%</span>
                          <Tag :color="getRatingTag(item)" size="small">
                            {{ item.current_value > item.past_value ? '↑' : item.current_value < item.past_value ? '↓' : '—' }}
                            {{ item.past_value }}
                          </Tag>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>
          <Empty v-else-if="!loading" description="暂无评分数据" />
        </TabPane>

        <TabPane key="stock" tab="仓库库存分布">
          <Table
            :columns="stockColumns"
            :dataSource="stockData"
            :loading="loading"
            rowKey="sku"
            size="middle"
            :pagination="{ pageSize: 50, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
          />
        </TabPane>
      </Tabs>
    </template>
  </div>
</template>
