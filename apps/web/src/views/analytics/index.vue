<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
  Alert,
} from 'ant-design-vue';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RollbackOutlined,
  EyeOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import { getAnalyticsApi, type AnalyticsData } from '@/api/order';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

const router = useRouter();
const storeAccountStore = useStoreAccountStore();
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');
const hasStore = computed(() => storeAccountStore.stores.length > 0);

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
        title: { text: '每日营收 (₽)', left: 'center', textStyle: { fontSize: 14, fontWeight: 500, color: '#1a1a1a' } },
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: '#e8e8e8', textStyle: { color: '#595959' } },
        xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: '#8c8c8c', fontSize: 11 } },
        yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f5f5f5' } }, axisLabel: { color: '#8c8c8c' } },
        series: [
          {
            data: revenues,
            type: 'line',
            smooth: true,
            areaStyle: { opacity: 0.15, color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#1890ff' }, { offset: 1, color: '#fff' }] } },
            itemStyle: { color: '#1890ff' },
            lineStyle: { width: 2.5 },
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
        title: { text: '每日订单数', left: 'center', textStyle: { fontSize: 14, fontWeight: 500, color: '#1a1a1a' } },
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: '#e8e8e8', textStyle: { color: '#595959' } },
        xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: '#8c8c8c', fontSize: 11 } },
        yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f5f5f5' } }, axisLabel: { color: '#8c8c8c' } },
        series: [
          {
            data: units,
            type: 'bar',
            itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
            barWidth: '60%',
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
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">数据分析</h2>
        <p class="page-desc">查看店铺营收、订单和流量数据</p>
      </div>
      <Space>
        <DatePicker.RangePicker
          v-model:value="dateRange"
          :allowClear="false"
          @change="handleDateChange"
          size="middle"
        />
        <Button @click="fetchAnalytics" :loading="loading">
          <template #icon><ReloadOutlined /></template>
          刷新
        </Button>
      </Space>
    </div>

    <!-- No Store Alert -->
    <Alert
      v-if="!hasStore"
      type="warning"
      show-icon
      banner
      style="margin-bottom: 20px; border-radius: 8px"
    >
      <template #message>
        <span>请先添加店铺后查看数据分析。</span>
        <Button type="link" size="small" @click="router.push({ name: 'StoreAccounts' })">
          前往添加 <RightOutlined />
        </Button>
      </template>
    </Alert>

    <Alert
      v-else-if="!storeAccountId"
      type="info"
      show-icon
      banner
      style="margin-bottom: 20px; border-radius: 8px"
    >
      <template #message>
        请在页面顶部选择要查看的店铺
      </template>
    </Alert>

    <Spin :spinning="loading">
      <!-- Summary Cards -->
      <Row :gutter="[16, 16]" style="margin-bottom: 20px">
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card" hoverable>
            <div class="stat-card-inner">
              <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
                <DollarOutlined />
              </div>
              <Statistic
                title="总营收"
                :value="totalRevenue"
                :precision="2"
                prefix="₽"
                :valueStyle="{ color: '#1890ff', fontSize: '24px', fontWeight: 600 }"
              />
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card" hoverable>
            <div class="stat-card-inner">
              <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
                <ShoppingCartOutlined />
              </div>
              <Statistic
                title="总订单数"
                :value="totalUnits"
                :valueStyle="{ color: '#52c41a', fontSize: '24px', fontWeight: 600 }"
              />
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card" hoverable>
            <div class="stat-card-inner">
              <div class="stat-icon" style="background: #fff7e6; color: #faad14">
                <RollbackOutlined />
              </div>
              <Statistic
                title="退货数"
                :value="totalReturns"
                :valueStyle="{ color: '#faad14', fontSize: '24px', fontWeight: 600 }"
              />
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card class="stat-card" hoverable>
            <div class="stat-card-inner">
              <div class="stat-icon" style="background: #f9f0ff; color: #722ed1">
                <EyeOutlined />
              </div>
              <Statistic
                title="商品浏览量"
                :value="totalViews"
                :valueStyle="{ color: '#722ed1', fontSize: '24px', fontWeight: 600 }"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <!-- Charts -->
      <Row :gutter="[16, 16]">
        <Col :xs="24" :lg="12">
          <Card class="chart-card">
            <div
              v-if="analyticsData?.data?.length"
              ref="revenueChartRef"
              style="height: 350px"
            />
            <Empty v-else description="暂无数据" :image="Empty.PRESENTED_IMAGE_SIMPLE" style="padding: 80px 0" />
          </Card>
        </Col>
        <Col :xs="24" :lg="12">
          <Card class="chart-card">
            <div
              v-if="analyticsData?.data?.length"
              ref="ordersChartRef"
              style="height: 350px"
            />
            <Empty v-else description="暂无数据" :image="Empty.PRESENTED_IMAGE_SIMPLE" style="padding: 80px 0" />
          </Card>
        </Col>
      </Row>
    </Spin>
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

.stat-card {
  border-radius: 10px;
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.stat-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.chart-card {
  border-radius: 10px;
  height: 100%;
}
</style>
