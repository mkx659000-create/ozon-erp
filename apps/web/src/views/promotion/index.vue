<script setup lang="ts">
import { ref } from 'vue';
import {
  Card,
  Tabs,
  TabPane,
  Button,
  Space,
  Table,
  Tag,
  Select,
  SelectOption,
  DatePicker,
  Badge,
  Input,
} from 'ant-design-vue';
import {
  SyncOutlined,
  PlusOutlined,
  EditOutlined,
  LogoutOutlined,
  SettingOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';

const activeTab = ref('ALL');
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

const statusTabs = [
  { key: 'ALL', label: '全部', count: 0 },
  { key: 'JOINED', label: '已参加', count: 0 },
  { key: 'NOT_JOINED', label: '未参加', count: 0 },
];

const columns = [
  { title: '主图', key: 'image', width: 80 },
  { title: '标题/SKU/ProductID/店铺', key: 'info', width: 280 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '原价', dataIndex: 'originalPrice', key: 'originalPrice', width: 100 },
  { title: '最低价', dataIndex: 'lowestPrice', key: 'lowestPrice', width: 100 },
  { title: '促销价格', dataIndex: 'promoPrice', key: 'promoPrice', width: 100 },
  { title: '在售/促销库', key: 'stock', width: 120 },
  { title: '参加活动/方式', key: 'participation', width: 120 },
  { title: '操作', key: 'action', width: 100 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 80 },
  { title: '活动时间', key: 'activityTime', width: 180 },
  { title: '促销活动', dataIndex: 'activityName', key: 'activityName', width: 200 },
];

const dataSource = ref([]);

const rowSelection = ref({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys.map(String);
  },
});
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div style="margin-bottom: 16px">
      <Space>
        <Button type="primary">
          <template #icon><SyncOutlined /></template>
          同步活动
        </Button>
        <Button type="primary" ghost>
          <template #icon><PlusOutlined /></template>
          参加活动
        </Button>
        <Button>
          <template #icon><EditOutlined /></template>
          编辑活动
        </Button>
        <Button danger>
          <template #icon><LogoutOutlined /></template>
          退出活动
        </Button>
        <Button>
          <template #icon><SettingOutlined /></template>
          设置自动退出/参加活动
        </Button>
        <Button>文档教程</Button>
      </Space>
    </div>

    <!-- Status Tabs -->
    <Tabs v-model:activeKey="activeTab" style="margin-bottom: 16px">
      <TabPane v-for="tab in statusTabs" :key="tab.key">
        <template #tab>
          {{ tab.label }}
          <Badge
            :count="tab.count"
            :number-style="{ backgroundColor: tab.key === activeTab ? '#1890ff' : '#999' }"
            :offset="[6, -4]"
            :showZero="false"
          />
        </template>
      </TabPane>
    </Tabs>

    <!-- Filters -->
    <div style="margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap">
      <Select placeholder="平台店铺" style="width: 160px" allowClear />
      <Select
        placeholder="状态"
        style="width: 100px"
        defaultValue="在售"
        allowClear
      >
        <SelectOption value="在售">在售</SelectOption>
      </Select>
      <Select placeholder="参加方式" style="width: 120px" allowClear>
        <SelectOption value="MANUAL">手动</SelectOption>
        <SelectOption value="AUTO">自动</SelectOption>
      </Select>
      <Select placeholder="价格筛选" style="width: 120px" allowClear />
      <DatePicker placeholder="活动结束时间" style="width: 180px" />
      <Input placeholder="SKU" style="width: 140px" allowClear />
      <Select placeholder="ProductId" style="width: 140px" allowClear />
      <Button type="primary">
        <template #icon><SearchOutlined /></template>
        搜索
      </Button>
    </div>

    <!-- Promotion Table -->
    <Table
      :columns="columns"
      :dataSource="dataSource"
      :loading="loading"
      :rowSelection="rowSelection"
      :scroll="{ x: 1600 }"
      rowKey="id"
      size="small"
      bordered
      :pagination="{ pageSize: 50, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 行` }"
    />
  </div>
</template>
