<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  message,
  Empty,
  Spin,
} from 'ant-design-vue';
import { SyncOutlined, HomeOutlined } from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import { getWarehousesApi, syncWarehousesApi } from '@/api/warehouse';
import type { Warehouse } from '@/api/warehouse';

const storeAccountStore = useStoreAccountStore();
const warehouses = ref<Warehouse[]>([]);
const loading = ref(false);
const syncing = ref(false);

const columns = [
  { title: 'Ozon ID', dataIndex: 'ozonWarehouseId', width: 120 },
  { title: '仓库名称', dataIndex: 'name', ellipsis: true },
  {
    title: '类型',
    dataIndex: 'isRfbs',
    width: 100,
    customRender: ({ record }: any) => record.isRfbs ? 'rFBS' : 'FBO/FBS',
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
  },
];

async function loadWarehouses() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  loading.value = true;
  try {
    warehouses.value = await getWarehousesApi(storeId);
  } catch {
    message.error('加载仓库失败');
  } finally {
    loading.value = false;
  }
}

async function handleSync() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  syncing.value = true;
  try {
    const result = await syncWarehousesApi(storeId);
    message.success(`同步完成：${result.synced} 个仓库`);
    await loadWarehouses();
  } catch {
    message.error('同步仓库失败');
  } finally {
    syncing.value = false;
  }
}

watch(() => storeAccountStore.activeStoreId, () => {
  loadWarehouses();
});

onMounted(() => {
  loadWarehouses();
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0; font-size: 20px">
        <HomeOutlined style="margin-right: 8px" />
        仓库管理
      </h2>
      <Button type="primary" :loading="syncing" @click="handleSync" :disabled="!storeAccountStore.activeStoreId">
        <SyncOutlined />
        同步仓库
      </Button>
    </div>

    <Card v-if="!storeAccountStore.activeStoreId">
      <Empty description="请先选择店铺" />
    </Card>

    <template v-else>
      <div style="margin-bottom: 16px; display: flex; gap: 12px">
        <Card size="small" style="flex: 1">
          <div style="font-size: 24px; font-weight: 600; color: #1890ff">{{ warehouses.length }}</div>
          <div style="color: #888; font-size: 13px">仓库总数</div>
        </Card>
        <Card size="small" style="flex: 1">
          <div style="font-size: 24px; font-weight: 600; color: #52c41a">
            {{ warehouses.filter(w => !w.isRfbs).length }}
          </div>
          <div style="color: #888; font-size: 13px">FBO/FBS 仓库</div>
        </Card>
        <Card size="small" style="flex: 1">
          <div style="font-size: 24px; font-weight: 600; color: #722ed1">
            {{ warehouses.filter(w => w.isRfbs).length }}
          </div>
          <div style="color: #888; font-size: 13px">rFBS 仓库</div>
        </Card>
      </div>

      <Table
        :columns="columns"
        :dataSource="warehouses"
        :loading="loading"
        rowKey="id"
        :pagination="false"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'isRfbs'">
            <Tag :color="record.isRfbs ? 'purple' : 'blue'">
              {{ record.isRfbs ? 'rFBS' : 'FBO/FBS' }}
            </Tag>
          </template>
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="record.status === 'active' ? 'green' : 'default'">
              {{ record.status }}
            </Tag>
          </template>
        </template>
      </Table>
    </template>
  </div>
</template>
