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
  InputPassword,
  message,
  Popconfirm,
  Empty,
  Alert,
  Tooltip,
} from 'ant-design-vue';
import {
  PlusOutlined,
  ApiOutlined,
  DeleteOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  EyeInvisibleOutlined,
  SyncOutlined,
} from '@ant-design/icons-vue';
import {
  getStoreAccountsApi,
  createStoreAccountApi,
  deleteStoreAccountApi,
  testConnectionApi,
  type StoreAccount,
} from '@/api/store-account/index';
import { triggerAllSyncApi } from '@/api/sync';
import { useStoreAccountStore } from '@/store';
import dayjs from 'dayjs';

const storeAccountStore = useStoreAccountStore();
const loading = ref(false);
const stores = ref<StoreAccount[]>([]);
const showModal = ref(false);
const formLoading = ref(false);
const form = ref({ storeName: '', ozonClientId: '', ozonApiKey: '' });
const testingId = ref<string | null>(null);
const syncingId = ref<string | null>(null);

const columns = [
  { title: '店铺名称', key: 'storeName', width: 180 },
  { title: 'Client ID', dataIndex: 'ozonClientId', key: 'ozonClientId', width: 160 },
  { title: '状态', key: 'status', width: 100, align: 'center' as const },
  { title: '同步状态', key: 'syncEnabled', width: 100, align: 'center' as const },
  { title: '最后同步', key: 'lastSyncAt', width: 180 },
  { title: '操作', key: 'action', width: 280 },
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
  testingId.value = id;
  try {
    const result = await testConnectionApi(id);
    message.success(result.message || '连接成功');
  } catch {
    // handled by interceptor
  } finally {
    testingId.value = null;
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

async function handleSyncAll(id: string) {
  syncingId.value = id;
  try {
    const res = await triggerAllSyncApi(id);
    message.success(res.message || '全部同步任务已启动');
  } catch {
    message.error('同步请求失败');
  } finally {
    syncingId.value = null;
  }
}

function openModal() {
  form.value = { storeName: '', ozonClientId: '', ozonApiKey: '' };
  showModal.value = true;
}

onMounted(fetchStores);
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">店铺管理</h2>
        <p class="page-desc">管理您的 Ozon 店铺账号，支持多店铺操作</p>
      </div>
      <Button type="primary" @click="openModal" size="large">
        <template #icon><PlusOutlined /></template>
        添加店铺
      </Button>
    </div>

    <!-- Tips -->
    <Alert
      v-if="stores.length === 0 && !loading"
      type="info"
      show-icon
      style="margin-bottom: 20px; border-radius: 8px"
    >
      <template #message>
        <span>请先添加您的 Ozon 店铺。您需要在 Ozon 卖家后台获取 Client ID 和 API Key。</span>
      </template>
      <template #description>
        <span style="color: #8c8c8c">
          前往 Ozon 卖家后台 → 设置 → API密钥，生成一个新的 API Key，然后在此处添加店铺。
        </span>
      </template>
    </Alert>

    <!-- Store Cards or Table -->
    <Table
      v-if="stores.length > 0 || loading"
      :columns="columns"
      :dataSource="stores"
      :loading="loading"
      rowKey="id"
      :pagination="false"
      :bordered="true"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'storeName'">
          <div style="display: flex; align-items: center; gap: 8px">
            <div class="store-icon">
              <ShopOutlined />
            </div>
            <span style="font-weight: 500; font-size: 14px">{{ record.storeName }}</span>
          </div>
        </template>

        <template v-if="column.key === 'status'">
          <Tag
            v-if="record.status === 'ACTIVE'"
            color="success"
            style="margin: 0"
          >
            <template #icon><CheckCircleOutlined /></template>
            正常
          </Tag>
          <Tag
            v-else-if="record.status === 'AUTH_EXPIRED'"
            color="error"
            style="margin: 0"
          >
            <template #icon><CloseCircleOutlined /></template>
            过期
          </Tag>
          <Tag v-else color="default" style="margin: 0">
            <template #icon><ExclamationCircleOutlined /></template>
            禁用
          </Tag>
        </template>

        <template v-if="column.key === 'syncEnabled'">
          <Tag :color="record.syncEnabled ? 'processing' : 'default'" style="margin: 0">
            {{ record.syncEnabled ? '已启用' : '已禁用' }}
          </Tag>
        </template>

        <template v-if="column.key === 'lastSyncAt'">
          <span v-if="record.lastSyncAt" style="font-size: 13px; color: #595959">
            {{ dayjs(record.lastSyncAt).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
          <span v-else style="color: #d9d9d9; font-size: 13px">从未同步</span>
        </template>

        <template v-if="column.key === 'action'">
          <Space :size="8">
            <Button
              size="small"
              type="primary"
              ghost
              :loading="syncingId === record.id"
              @click="handleSyncAll(record.id)"
              :disabled="record.status !== 'ACTIVE'"
            >
              <template #icon><SyncOutlined /></template>
              全量同步
            </Button>
            <Button
              size="small"
              :loading="testingId === record.id"
              @click="handleTestConnection(record.id)"
            >
              <template #icon><ApiOutlined /></template>
              测试
            </Button>
            <Popconfirm
              title="确定删除此店铺？"
              description="删除后将无法恢复，该店铺的所有数据将被清除。"
              @confirm="handleDelete(record.id)"
              okText="确定删除"
              cancelText="取消"
              okType="danger"
            >
              <Button size="small" danger>
                <template #icon><DeleteOutlined /></template>
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- Empty State -->
    <div v-if="stores.length === 0 && !loading" class="empty-state">
      <Empty description="">
        <template #image>
          <ShopOutlined style="font-size: 64px; color: #d9d9d9" />
        </template>
        <p style="color: #8c8c8c; margin: 16px 0">还没有添加任何店铺</p>
        <Button type="primary" size="large" @click="openModal">
          <template #icon><PlusOutlined /></template>
          添加第一个店铺
        </Button>
      </Empty>
    </div>

    <!-- Add Store Modal -->
    <Modal
      v-model:open="showModal"
      title="添加 Ozon 店铺"
      @ok="handleCreate"
      :confirmLoading="formLoading"
      okText="添加"
      cancelText="取消"
      :width="480"
    >
      <div style="margin-bottom: 16px; padding: 12px; background: #f6f8fa; border-radius: 8px; font-size: 13px; color: #595959">
        <InfoCircleOutlined style="color: #1890ff; margin-right: 6px" />
        请在 Ozon 卖家后台获取 API 凭证：设置 → API密钥
      </div>
      <Form layout="vertical">
        <FormItem label="店铺名称" required>
          <Input
            v-model:value="form.storeName"
            placeholder="例如：我的Ozon店铺"
            size="large"
          />
        </FormItem>
        <FormItem label="Ozon Client ID" required>
          <Input
            v-model:value="form.ozonClientId"
            placeholder="数字ID，在Ozon卖家后台获取"
            size="large"
          />
        </FormItem>
        <FormItem required>
          <template #label>
            Ozon API Key
            <Tooltip title="API Key 将被加密存储">
              <EyeInvisibleOutlined style="margin-left: 4px; color: #8c8c8c" />
            </Tooltip>
          </template>
          <InputPassword
            v-model:value="form.ozonApiKey"
            placeholder="在Ozon卖家后台 > 设置 > API密钥获取"
            size="large"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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

.store-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e6f7ff;
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
