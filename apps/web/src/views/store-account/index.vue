<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  FormItem,
  Input,
  message,
  Popconfirm,
} from 'ant-design-vue';
import {
  PlusOutlined,
  ApiOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import {
  getStoreAccountsApi,
  createStoreAccountApi,
  deleteStoreAccountApi,
  testConnectionApi,
  type StoreAccount,
} from '@/api/store-account/index';
import { useStoreAccountStore } from '@/store';

const storeAccountStore = useStoreAccountStore();
const loading = ref(false);
const stores = ref<StoreAccount[]>([]);
const showModal = ref(false);
const formLoading = ref(false);
const form = ref({ storeName: '', ozonClientId: '', ozonApiKey: '' });

const columns = [
  { title: '店铺名称', dataIndex: 'storeName', key: 'storeName' },
  { title: 'Client ID', dataIndex: 'ozonClientId', key: 'ozonClientId' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    customRender: ({ text }: { text: string }) => {
      const map: Record<string, { color: string; label: string }> = {
        ACTIVE: { color: 'green', label: '正常' },
        DISABLED: { color: 'default', label: '禁用' },
        AUTH_EXPIRED: { color: 'red', label: '认证过期' },
      };
      return map[text] || { color: 'default', label: text };
    },
  },
  { title: '同步状态', dataIndex: 'syncEnabled', key: 'syncEnabled' },
  { title: '最后同步', dataIndex: 'lastSyncAt', key: 'lastSyncAt' },
  { title: '操作', key: 'action', width: 200 },
];

async function fetchStores() {
  loading.value = true;
  try {
    stores.value = await getStoreAccountsApi();
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  if (!form.value.storeName || !form.value.ozonClientId || !form.value.ozonApiKey) {
    message.warning('请填写所有字段');
    return;
  }
  formLoading.value = true;
  try {
    await createStoreAccountApi(form.value);
    message.success('店铺创建成功');
    showModal.value = false;
    form.value = { storeName: '', ozonClientId: '', ozonApiKey: '' };
    await fetchStores();
    // Refresh the global store so the header selector updates immediately
    await storeAccountStore.fetchStores();
  } finally {
    formLoading.value = false;
  }
}

async function handleTestConnection(id: string) {
  try {
    const result = await testConnectionApi(id);
    message.success(result.message);
  } catch {
    // handled by interceptor
  }
}

async function handleDelete(id: string) {
  try {
    await deleteStoreAccountApi(id);
    message.success('删除成功');
    await fetchStores();
    // Refresh the global store so the header selector updates immediately
    await storeAccountStore.fetchStores();
  } catch {
    // handled by interceptor
  }
}

onMounted(fetchStores);
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <h2 style="margin: 0">店铺管理</h2>
      <Button type="primary" @click="showModal = true">
        <template #icon><PlusOutlined /></template>
        添加店铺
      </Button>
    </div>

    <Table
      :columns="columns"
      :dataSource="stores"
      :loading="loading"
      rowKey="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Tag :color="record.status === 'ACTIVE' ? 'green' : record.status === 'AUTH_EXPIRED' ? 'red' : 'default'">
            {{ record.status === 'ACTIVE' ? '正常' : record.status === 'AUTH_EXPIRED' ? '认证过期' : '禁用' }}
          </Tag>
        </template>
        <template v-if="column.key === 'syncEnabled'">
          <Tag :color="record.syncEnabled ? 'blue' : 'default'">
            {{ record.syncEnabled ? '已启用' : '已禁用' }}
          </Tag>
        </template>
        <template v-if="column.key === 'lastSyncAt'">
          {{ record.lastSyncAt || '从未同步' }}
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button size="small" @click="handleTestConnection(record.id)">
              <template #icon><ApiOutlined /></template>
              测试连接
            </Button>
            <Popconfirm title="确定删除?" @confirm="handleDelete(record.id)">
              <Button size="small" danger>
                <template #icon><DeleteOutlined /></template>
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="showModal"
      title="添加 Ozon 店铺"
      @ok="handleCreate"
      :confirmLoading="formLoading"
    >
      <Form layout="vertical">
        <FormItem label="店铺名称" required>
          <Input v-model:value="form.storeName" placeholder="例如：我的Ozon店铺" />
        </FormItem>
        <FormItem label="Ozon Client ID" required>
          <Input v-model:value="form.ozonClientId" placeholder="在Ozon卖家后台获取" />
        </FormItem>
        <FormItem label="Ozon API Key" required>
          <Input v-model:value="form.ozonApiKey" placeholder="在Ozon卖家后台 > 设置 > API密钥" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
