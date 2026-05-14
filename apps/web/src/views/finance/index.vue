<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Tabs,
  TabPane,
  Table,
  Button,
  Space,
  DatePicker,
  Select,
  SelectOption,
  Statistic,
  Card,
  Row,
  Col,
  Tag,
  message,
  Input,
  Empty,
} from 'ant-design-vue';
import {
  SyncOutlined,
  DollarOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import {
  getTransactionsApi,
  getSummaryApi,
  getProfitAnalysisApi,
  syncFinanceApi,
  type FinanceTransaction,
  type FinanceSummary,
  type SummaryResponse,
  type ProfitItem,
} from '@/api/finance';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const storeAccountStore = useStoreAccountStore();
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');

const activeTab = ref('transactions');

/* ---- Transaction Tab ---- */
const txLoading = ref(false);
const txData = ref<FinanceTransaction[]>([]);
const txTotal = ref(0);
const txPage = ref(1);
const txPageSize = ref(20);
const txDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(undefined);
const txOperationType = ref<string | undefined>(undefined);
const txPostingNumber = ref('');

const txColumns = [
  { title: '操作ID', dataIndex: 'operationId', key: 'operationId', width: 140 },
  { title: '类型', key: 'operationType', width: 140 },
  { title: '日期', key: 'operationDate', width: 160 },
  { title: '发货单号', dataIndex: 'postingNumber', key: 'postingNumber', width: 180 },
  { title: '商品', key: 'productName', width: 240 },
  { title: '金额', key: 'amount', width: 120, align: 'right' as const },
  { title: '佣金', key: 'commission', width: 120, align: 'right' as const },
  { title: '物流费', key: 'delivery', width: 120, align: 'right' as const },
];

const operationTypes = [
  { value: 'OperationAgentDeliveredToCustomer', label: '客户签收' },
  { value: 'MarketplaceRedistributionOfAcquiringOperation', label: '收单服务' },
  { value: 'OperationMarketplaceServicePremiumCashback', label: '高级返现' },
  { value: 'ClientReturnAgentOperation', label: '退货' },
  { value: 'MarketplaceSellerReexposureDeliveryReturnOperation', label: '二次曝光退货' },
  { value: 'OperationMarketplaceCrossDockServiceWriteOff', label: '集货扣款' },
];

async function fetchTransactions() {
  if (!storeAccountId.value) return;
  txLoading.value = true;
  try {
    const params: any = {
      page: txPage.value,
      pageSize: txPageSize.value,
      storeAccountId: storeAccountId.value,
    };
    if (txDateRange.value) {
      params.dateFrom = txDateRange.value[0].format('YYYY-MM-DD');
      params.dateTo = txDateRange.value[1].format('YYYY-MM-DD');
    }
    if (txOperationType.value) params.operationType = txOperationType.value;
    if (txPostingNumber.value) params.postingNumber = txPostingNumber.value;

    const res = await getTransactionsApi(params);
    txData.value = res.items;
    txTotal.value = res.total;
  } catch {
    txData.value = [];
    txTotal.value = 0;
  } finally {
    txLoading.value = false;
  }
}

function handleTxTableChange(pagination: any) {
  txPage.value = pagination.current;
  txPageSize.value = pagination.pageSize;
  fetchTransactions();
}

function handleTxSearch() {
  txPage.value = 1;
  fetchTransactions();
}

function handleTxReset() {
  txDateRange.value = undefined;
  txOperationType.value = undefined;
  txPostingNumber.value = '';
  txPage.value = 1;
  fetchTransactions();
}

/* ---- Summary Tab ---- */
const summaryLoading = ref(false);
const summaryData = ref<FinanceSummary[]>([]);
const summaryTotals = ref<SummaryResponse['totals'] | null>(null);
const summaryDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(undefined);

const summaryColumns = [
  { title: '日期', key: 'date', width: 120 },
  { title: '销售额', key: 'totalSales', width: 140, align: 'right' as const },
  { title: '佣金', key: 'totalCommissions', width: 140, align: 'right' as const },
  { title: '物流费', key: 'totalDelivery', width: 140, align: 'right' as const },
  { title: '退货', key: 'totalReturns', width: 140, align: 'right' as const },
  { title: '净收入', key: 'totalPayout', width: 140, align: 'right' as const },
  { title: '交易数', dataIndex: 'transactionCount', key: 'transactionCount', width: 100, align: 'center' as const },
];

async function fetchSummary() {
  if (!storeAccountId.value) return;
  summaryLoading.value = true;
  try {
    const params: any = { storeAccountId: storeAccountId.value };
    if (summaryDateRange.value) {
      params.dateFrom = summaryDateRange.value[0].format('YYYY-MM-DD');
      params.dateTo = summaryDateRange.value[1].format('YYYY-MM-DD');
    }
    const res = await getSummaryApi(params);
    summaryData.value = res.daily;
    summaryTotals.value = res.totals;
  } catch {
    summaryData.value = [];
    summaryTotals.value = null;
  } finally {
    summaryLoading.value = false;
  }
}

/* ---- Profit Tab ---- */
const profitLoading = ref(false);
const profitData = ref<ProfitItem[]>([]);
const profitDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(30, 'day'),
  dayjs(),
]);

const profitColumns = [
  { title: 'SKU', dataIndex: 'ozonSku', key: 'ozonSku', width: 120 },
  { title: '商品', key: 'productName', width: 260 },
  { title: '收入', key: 'revenue', width: 120, align: 'right' as const },
  { title: '佣金', key: 'commission', width: 120, align: 'right' as const },
  { title: '物流', key: 'delivery', width: 120, align: 'right' as const },
  { title: '成本', key: 'costPrice', width: 120, align: 'right' as const },
  { title: '利润', key: 'profit', width: 120, align: 'right' as const },
  { title: '利润率', key: 'margin', width: 100, align: 'right' as const },
  { title: '交易数', dataIndex: 'transactionCount', key: 'count', width: 80, align: 'center' as const },
];

async function fetchProfit() {
  if (!storeAccountId.value || !profitDateRange.value) return;
  profitLoading.value = true;
  try {
    profitData.value = await getProfitAnalysisApi({
      storeAccountId: storeAccountId.value,
      dateFrom: profitDateRange.value[0].format('YYYY-MM-DD'),
      dateTo: profitDateRange.value[1].format('YYYY-MM-DD'),
    });
  } catch {
    profitData.value = [];
  } finally {
    profitLoading.value = false;
  }
}

/* ---- Sync ---- */
const syncLoading = ref(false);

async function handleSync() {
  if (!storeAccountId.value) {
    message.warning('请先选择店铺');
    return;
  }
  syncLoading.value = true;
  try {
    const res = await syncFinanceApi(storeAccountId.value);
    message.success(`同步完成：成功 ${res.synced}，失败 ${res.failed}`);
    loadCurrentTab();
  } catch {
    message.error('同步请求失败');
  } finally {
    syncLoading.value = false;
  }
}

/* ---- Tab switching ---- */
function loadCurrentTab() {
  if (activeTab.value === 'transactions') fetchTransactions();
  else if (activeTab.value === 'summary') fetchSummary();
  else if (activeTab.value === 'profit') fetchProfit();
}

function handleTabChange() {
  loadCurrentTab();
}

/* ---- Helpers ---- */
function formatDate(d: string | null) {
  if (!d) return '-';
  return dayjs(d).format('YYYY-MM-DD HH:mm');
}

function formatDay(d: string | null) {
  if (!d) return '-';
  return dayjs(d).format('YYYY-MM-DD');
}

function formatMoney(val: number | null | undefined) {
  if (val === null || val === undefined) return '-';
  return `₽ ${Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(val: number | null | undefined) {
  if (val === null || val === undefined) return '-';
  return `${Number(val).toFixed(1)}%`;
}

function profitColor(val: number) {
  if (val > 0) return '#52c41a';
  if (val < 0) return '#ff4d4f';
  return '#8c8c8c';
}

const operationTypeLabels: Record<string, string> = {
  OperationAgentDeliveredToCustomer: '客户签收',
  MarketplaceRedistributionOfAcquiringOperation: '收单服务',
  OperationMarketplaceServicePremiumCashback: '高级返现',
  ClientReturnAgentOperation: '退货',
  MarketplaceSellerReexposureDeliveryReturnOperation: '二次曝光退货',
  OperationMarketplaceCrossDockServiceWriteOff: '集货扣款',
};

function getOperationTypeLabel(type: string) {
  return operationTypeLabels[type] || type;
}

onMounted(() => fetchTransactions());

watch(storeAccountId, () => {
  txPage.value = 1;
  loadCurrentTab();
});
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">财务管理</h2>
        <p class="page-desc">查看交易明细、收支汇总、利润分析</p>
      </div>
      <Button type="primary" :loading="syncLoading" @click="handleSync">
        <template #icon><SyncOutlined /></template>
        同步财务数据
      </Button>
    </div>

    <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <!-- Transaction Tab -->
      <TabPane key="transactions" tab="交易明细">
        <div class="filter-bar">
          <RangePicker
            v-model:value="txDateRange"
            style="width: 260px"
            :placeholder="['开始日期', '结束日期']"
          />
          <Select
            v-model:value="txOperationType"
            placeholder="操作类型"
            allowClear
            style="width: 180px"
          >
            <SelectOption v-for="t in operationTypes" :key="t.value" :value="t.value">
              {{ t.label }}
            </SelectOption>
          </Select>
          <Input
            v-model:value="txPostingNumber"
            placeholder="发货单号"
            style="width: 200px"
            allowClear
            @pressEnter="handleTxSearch"
          >
            <template #prefix><SearchOutlined style="color: #bfbfbf" /></template>
          </Input>
          <Button type="primary" @click="handleTxSearch">搜索</Button>
          <Button @click="handleTxReset">
            <template #icon><ReloadOutlined /></template>
            重置
          </Button>
        </div>

        <Table
          :columns="txColumns"
          :dataSource="txData"
          :loading="txLoading"
          :scroll="{ x: 1400 }"
          rowKey="id"
          size="small"
          bordered
          :pagination="{
            current: txPage,
            pageSize: txPageSize,
            total: txTotal,
            showSizeChanger: true,
            showTotal: (t: number) => `共 ${t} 条`,
            pageSizeOptions: ['20', '50', '100'],
          }"
          @change="handleTxTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'operationType'">
              <Tag color="blue" style="margin: 0">{{ getOperationTypeLabel(record.operationType) }}</Tag>
            </template>
            <template v-if="column.key === 'operationDate'">
              <span style="font-size: 13px; color: #595959">{{ formatDate(record.operationDate) }}</span>
            </template>
            <template v-if="column.key === 'productName'">
              <span v-if="record.productName" style="font-size: 12px; color: #595959">
                {{ record.productName?.substring(0, 50) }}{{ record.productName?.length > 50 ? '...' : '' }}
              </span>
              <span v-else style="color: #d9d9d9">-</span>
            </template>
            <template v-if="column.key === 'amount'">
              <span :style="{ fontWeight: 600, color: Number(record.amount) >= 0 ? '#52c41a' : '#ff4d4f' }">
                {{ formatMoney(record.amount) }}
              </span>
            </template>
            <template v-if="column.key === 'commission'">
              <span style="color: #ff7a45">{{ formatMoney(record.commissionAmount) }}</span>
            </template>
            <template v-if="column.key === 'delivery'">
              <span style="color: #8c8c8c">{{ formatMoney(record.deliveryCharge) }}</span>
            </template>
          </template>
        </Table>
      </TabPane>

      <!-- Summary Tab -->
      <TabPane key="summary" tab="收支汇总">
        <div class="filter-bar">
          <RangePicker
            v-model:value="summaryDateRange"
            style="width: 260px"
            :placeholder="['开始日期', '结束日期']"
          />
          <Button type="primary" @click="fetchSummary">查询</Button>
        </div>

        <Row v-if="summaryTotals" :gutter="16" class="summary-cards">
          <Col :span="4">
            <Card size="small">
              <Statistic title="总销售额" :value="Number(summaryTotals.totalSales)" :precision="2" prefix="₽" :valueStyle="{ color: '#1890ff', fontSize: '18px' }" />
            </Card>
          </Col>
          <Col :span="4">
            <Card size="small">
              <Statistic title="总佣金" :value="Number(summaryTotals.totalCommissions)" :precision="2" prefix="₽" :valueStyle="{ color: '#ff7a45', fontSize: '18px' }" />
            </Card>
          </Col>
          <Col :span="4">
            <Card size="small">
              <Statistic title="物流费" :value="Number(summaryTotals.totalDelivery)" :precision="2" prefix="₽" :valueStyle="{ color: '#8c8c8c', fontSize: '18px' }" />
            </Card>
          </Col>
          <Col :span="4">
            <Card size="small">
              <Statistic title="退货金额" :value="Number(summaryTotals.totalReturns)" :precision="2" prefix="₽" :valueStyle="{ color: '#ff4d4f', fontSize: '18px' }" />
            </Card>
          </Col>
          <Col :span="4">
            <Card size="small">
              <Statistic title="净收入" :value="Number(summaryTotals.totalPayout)" :precision="2" prefix="₽" :valueStyle="{ color: '#52c41a', fontSize: '18px' }" />
            </Card>
          </Col>
          <Col :span="4">
            <Card size="small">
              <Statistic title="交易笔数" :value="summaryTotals.transactionCount" :valueStyle="{ fontSize: '18px' }" />
            </Card>
          </Col>
        </Row>

        <Table
          :columns="summaryColumns"
          :dataSource="summaryData"
          :loading="summaryLoading"
          rowKey="id"
          size="small"
          bordered
          :pagination="false"
          :scroll="{ x: 1000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'date'">
              {{ formatDay(record.date) }}
            </template>
            <template v-if="column.key === 'totalSales'">
              <span style="color: #1890ff; font-weight: 500">{{ formatMoney(record.totalSales) }}</span>
            </template>
            <template v-if="column.key === 'totalCommissions'">
              <span style="color: #ff7a45">{{ formatMoney(record.totalCommissions) }}</span>
            </template>
            <template v-if="column.key === 'totalDelivery'">
              <span style="color: #8c8c8c">{{ formatMoney(record.totalDelivery) }}</span>
            </template>
            <template v-if="column.key === 'totalReturns'">
              <span style="color: #ff4d4f">{{ formatMoney(record.totalReturns) }}</span>
            </template>
            <template v-if="column.key === 'totalPayout'">
              <span style="font-weight: 600; color: #52c41a">{{ formatMoney(record.totalPayout) }}</span>
            </template>
          </template>
        </Table>
      </TabPane>

      <!-- Profit Tab -->
      <TabPane key="profit" tab="利润分析">
        <div class="filter-bar">
          <RangePicker
            v-model:value="profitDateRange"
            style="width: 260px"
            :placeholder="['开始日期', '结束日期']"
          />
          <Button type="primary" @click="fetchProfit">分析</Button>
        </div>

        <Table
          :columns="profitColumns"
          :dataSource="profitData"
          :loading="profitLoading"
          rowKey="ozonSku"
          size="small"
          bordered
          :pagination="{ pageSize: 50, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 件商品` }"
          :scroll="{ x: 1200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'productName'">
              <span style="font-size: 12px; color: #595959">
                {{ record.productName?.substring(0, 60) }}{{ record.productName?.length > 60 ? '...' : '' }}
              </span>
            </template>
            <template v-if="column.key === 'revenue'">
              <span style="color: #1890ff; font-weight: 500">{{ formatMoney(record.revenue) }}</span>
            </template>
            <template v-if="column.key === 'commission'">
              <span style="color: #ff7a45">{{ formatMoney(record.commission) }}</span>
            </template>
            <template v-if="column.key === 'delivery'">
              <span style="color: #8c8c8c">{{ formatMoney(record.delivery) }}</span>
            </template>
            <template v-if="column.key === 'costPrice'">
              <span>{{ formatMoney(record.costPrice) }}</span>
            </template>
            <template v-if="column.key === 'profit'">
              <span :style="{ fontWeight: 600, color: profitColor(record.profit) }">
                {{ formatMoney(record.profit) }}
              </span>
            </template>
            <template v-if="column.key === 'margin'">
              <Tag :color="record.margin > 20 ? 'green' : record.margin > 0 ? 'orange' : 'red'" style="margin: 0">
                {{ formatPercent(record.margin) }}
              </Tag>
            </template>
          </template>
        </Table>
      </TabPane>
    </Tabs>
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

.filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-cards {
  margin-bottom: 16px;
}
.summary-cards :deep(.ant-card-body) {
  padding: 16px;
}
</style>
