<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Select,
  SelectOption,
  DatePicker,
  message,
  Empty,
  Modal,
  Spin,
} from 'ant-design-vue';
import {
  FileTextOutlined,
  DownloadOutlined,
  PlusOutlined,
  SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import { createReportApi, listReportsApi, waitForReportApi } from '@/api/report';
import type { ReportInfo } from '@/api/report';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const storeAccountStore = useStoreAccountStore();

const reports = ref<ReportInfo[]>([]);
const loading = ref(false);
const creating = ref(false);
const totalReports = ref(0);
const page = ref(1);
const pageSize = ref(20);

const createModalVisible = ref(false);
const newReportType = ref('products');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(undefined);

const columns = [
  { title: '报告编号', dataIndex: 'code', width: 200, ellipsis: true },
  { title: '类型', dataIndex: 'report_type', width: 100 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 140 },
];

const reportTypeLabels: Record<string, string> = {
  products: '产品报告',
  postings: '发货报告',
  returns: '退货报告',
  ALL: '全部',
};

const statusColors: Record<string, string> = {
  success: 'green',
  processing: 'blue',
  waiting: 'orange',
  failed: 'red',
};

function formatDate(val: string) {
  if (!val) return '-';
  return new Date(val).toLocaleString('zh-CN');
}

async function loadReports() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  loading.value = true;
  try {
    const result = await listReportsApi(storeId, undefined, page.value, pageSize.value);
    reports.value = result.reports || [];
    totalReports.value = result.total || 0;
  } catch {
    message.error('加载报告列表失败');
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;
  creating.value = true;
  try {
    const filter: Record<string, any> = {};
    if (dateRange.value && dateRange.value.length === 2) {
      if (newReportType.value === 'postings') {
        filter.processed_at_from = dateRange.value[0].format('YYYY-MM-DDTHH:mm:ss.000Z');
        filter.processed_at_to = dateRange.value[1].format('YYYY-MM-DDTHH:mm:ss.000Z');
      } else if (newReportType.value === 'returns') {
        filter.return_date_from = dateRange.value[0].format('YYYY-MM-DDTHH:mm:ss.000Z');
        filter.return_date_to = dateRange.value[1].format('YYYY-MM-DDTHH:mm:ss.000Z');
      }
    }

    const result = await createReportApi(storeId, newReportType.value, Object.keys(filter).length ? filter : undefined);
    message.success(`报告创建成功，编号: ${result.code}`);
    createModalVisible.value = false;
    await loadReports();
  } catch {
    message.error('创建报告失败');
  } finally {
    creating.value = false;
  }
}

async function handleWaitAndDownload(record: any) {
  const storeId = storeAccountStore.activeStoreId;
  if (!storeId) return;

  if (record.status === 'success' && record.file) {
    window.open(record.file, '_blank');
    return;
  }

  message.loading({ content: '等待报告生成...', key: 'wait-report' });
  try {
    const info = await waitForReportApi(storeId, record.code);
    if (info.status === 'success' && info.file) {
      message.success({ content: '报告已生成', key: 'wait-report' });
      window.open(info.file, '_blank');
      await loadReports();
    } else {
      message.error({ content: `报告生成失败: ${info.error || '未知错误'}`, key: 'wait-report' });
    }
  } catch {
    message.error({ content: '等待报告超时', key: 'wait-report' });
  }
}

function handleTableChange(pagination: any) {
  page.value = pagination.current;
  pageSize.value = pagination.pageSize;
  loadReports();
}

watch(() => storeAccountStore.activeStoreId, () => {
  page.value = 1;
  loadReports();
});

onMounted(() => {
  loadReports();
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0; font-size: 20px">
        <FileTextOutlined style="margin-right: 8px" />
        报告中心
      </h2>
      <Space>
        <Button @click="loadReports" :loading="loading">
          <ReloadOutlined /> 刷新
        </Button>
        <Button type="primary" @click="createModalVisible = true" :disabled="!storeAccountStore.activeStoreId">
          <PlusOutlined /> 创建报告
        </Button>
      </Space>
    </div>

    <Card v-if="!storeAccountStore.activeStoreId">
      <Empty description="请先选择店铺" />
    </Card>

    <template v-else>
      <Table
        :columns="columns"
        :dataSource="reports"
        :loading="loading"
        rowKey="code"
        size="middle"
        :pagination="{
          current: page,
          pageSize,
          total: totalReports,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'report_type'">
            <Tag color="blue">{{ reportTypeLabels[record.report_type] || record.report_type }}</Tag>
          </template>
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="statusColors[record.status] || 'default'">
              {{ record.status }}
            </Tag>
          </template>
          <template v-if="column.dataIndex === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>
          <template v-if="column.key === 'action'">
            <Button
              v-if="record.status === 'success' && record.file"
              type="link"
              size="small"
              @click="handleWaitAndDownload(record)"
            >
              <DownloadOutlined /> 下载
            </Button>
            <Button
              v-else-if="record.status === 'waiting' || record.status === 'processing'"
              type="link"
              size="small"
              @click="handleWaitAndDownload(record)"
            >
              <SyncOutlined /> 等待完成
            </Button>
            <Tag v-else-if="record.status === 'failed'" color="red">失败</Tag>
          </template>
        </template>
      </Table>
    </template>

    <!-- Create Report Modal -->
    <Modal
      v-model:open="createModalVisible"
      title="创建报告"
      @ok="handleCreate"
      :confirmLoading="creating"
      okText="创建"
      cancelText="取消"
    >
      <div style="margin-bottom: 16px">
        <div style="margin-bottom: 8px; font-weight: 500">报告类型</div>
        <Select v-model:value="newReportType" style="width: 100%">
          <SelectOption value="products">产品报告</SelectOption>
          <SelectOption value="postings">发货报告</SelectOption>
          <SelectOption value="returns">退货报告</SelectOption>
        </Select>
      </div>
      <div v-if="newReportType !== 'products'">
        <div style="margin-bottom: 8px; font-weight: 500">日期范围（可选）</div>
        <RangePicker v-model:value="dateRange" style="width: 100%" />
      </div>
    </Modal>
  </div>
</template>
