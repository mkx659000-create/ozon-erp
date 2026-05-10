<script setup lang="ts">
import { ref, computed, onMounted, watch, shallowRef } from 'vue';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Space,
  Spin,
  Empty,
} from 'ant-design-vue';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RollbackOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import { getAnalyticsApi, type AnalyticsData } from '@/api/order';
import dayjs from 'dayjs';

const storeAccountStore = useStoreAccountStore();
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');

/* ---- state ---- */
const loading = ref(false);
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(30, 'day'),
  dayjs(),
]);
const analyticsData = ref<AnalyticsData | null>(null);

/* ---- chart refs ---- */
const revenueChartRef = ref<HTMLDivElement>();
const ordersChartRef = ref<HTMLDivElement>();
let revenueChart: any = null;
let ordersChart: any = null;

/* ---- computed stats ---- */
const totalRevenue = computed(() => analyticsData.value?.totals?.[0] || 0);
const totalUnits = computed(() => analyticsData.value?.totals?.[1] || 0);
const totalReturns = computed(() => analyticsData.value?.totals?.[2] || 0);
const totalViews = computed(() => analyticsData.value?.totals?.[3] || 0);

/* ---- data fetching ---- */
async function fetchAnalytics() {
  if (!storeAccountId.value) return;
  loading.value = true;
  try {
    const [from, to] = dateRange.value;
    analyticsData.value = await getAnalyticsApi(
      storeAccountId.value,
      from.format('YYYY-MM-DD'),
      to.format('YYYY-MM-DD'),
    );
    renderCharts();
  } catch {
    analyticsData.value = null;
  } finally {
    loading.value = false;
  }
}

/* ---- charts ---- */
async function renderCharts() {
  if (!analyticsData.value?.data?.length) return;

  try {
    const echarts = await import('echarts');

    const days = analyticsData.value.data.map(
      (d) => d.dimensions[0]?.name || d.dimensions[0]?.id || '',
    );
    const revenues = analyticsData.value.data.map((d) => d.metrics[0] || 0);
    const units = analyticsData.value.data.map((d) => d.metrics[1] || 0);

    // Revenue chart
    if (revenueChartRef.value) {
      if (revenueChart) revenueChart.dispose();
      revenueChart = echarts.init(revenueChartRef.value);
      revenueChart.setOption({
        title: { text: '每日营收 (₽)', left: 'center', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: days },
        yAxis: { type: 'value' },
        series: [
          {
            data: revenues,
            type: 'line',
            smooth: true,
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#1890ff' },
          },
        ],
        grid: { left: 60, right: 20, bottom: 30, top: 50 },
      });
    }

    // Orders chart
    if (ordersChartRef.value) {
      if (ordersChart) ordersChart.dispose();
      ordersChart = echarts.init(ordersChartRef.value);
      ordersChart.setOption({
        title: { text: '每日订单数', left: 'center', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: days },
        yAxis: { type: 'value' },
        series: [
          {
            data: units,
            type: 'bar',
            itemStyle: { color: '#52c41a' },
          },
        ],
        grid: { left: 60, right: 20, bottom: 30, top: 50 },
      });
    }
  } catch (err) {
    console.warn('ECharts not available:', err);
  }
}

function handleDateChange() {
  fetchAnalytics();
}

onMounted(() => {
  fetchAnalytics();
});

watch(storeAccountId, () => {
  fetchAnalytics();
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px">
      <h2 style="margin: 0">数据分析</h2>
      <Space>
        <DatePicker.RangePicker
          v-model:value="dateRange"
          :allowClear="false"
          @change="handleDateChange"
        />
        <Button @click="fetchAnalytics">
          <template #icon><ReloadOutlined /></template>
          刷新
        </Button>
      </Space>
    </div>

    <Spin :spinning="loading">
      <!-- Summary Cards -->
      <Row :gutter="16" style="margin-bottom: 24px">
        <Col :span="6">
          <Card>
            <Statistic
              title="总营收"
              :value="totalRevenue"
              :precision="2"
              prefix="₽"
              :valueStyle="{ color: '#1890ff' }"
            >
              <template #prefix>
                <DollarOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="总订单数"
              :value="totalUnits"
              :valueStyle="{ color: '#52c41a' }"
            >
              <template #prefix>
                <ShoppingCartOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="退货数"
              :value="totalReturns"
              :valueStyle="{ color: '#faad14' }"
            >
              <template #prefix>
                <RollbackOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="6">
          <Card>
            <Statistic
              title="商品页浏览量"
              :value="totalViews"
              :valueStyle="{ color: '#722ed1' }"
            >
              <template #prefix>
                <EyeOutlined />
              </template>
            </Statistic>
          </Card>
        </Col>
      </Row>

      <!-- Charts -->
      <Row :gutter="16">
        <Col :span="12">
          <Card>
            <div
              v-if="analyticsData?.data?.length"
              ref="revenueChartRef"
              style="height: 350px"
            />
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
        <Col :span="12">
          <Card>
            <div
              v-if="analyticsData?.data?.length"
              ref="ordersChartRef"
              style="height: 350px"
            />
            <Empty v-else description="暂无数据" />
          </Card>
        </Col>
      </Row>
    </Spin>
  </div>
</template>
