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
  Input,
  Select,
  SelectOption,
  Badge,
} from 'ant-design-vue';
import {
  SyncOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';

const activeTab = ref('ON_SALE');
const searchText = ref('');
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

const statusTabs = [
  { key: 'ALL', label: '全部', count: 0 },
  { key: 'ON_SALE', label: '在售', count: 0 },
  { key: 'OUT_OF_STOCK', label: '缺货', count: 0 },
  { key: 'MODERATION', label: '审核中', count: 0 },
  { key: 'MODERATION_FAILED', label: '审核失败', count: 0 },
  { key: 'REMOVED', label: '已下架', count: 0 },
  { key: 'ARCHIVED', label: '归档', count: 0 },
];

const columns = [
  { title: '主图', dataIndex: 'primaryImage', key: 'image', width: 80 },
  {
    title: '标题/ProductID/店铺/分类/备注',
    dataIndex: 'name',
    key: 'info',
    width: 300,
  },
  { title: '操作', key: 'action', width: 100 },
  {
    title: '合并数/编号/评分/价格指数',
    key: 'merge',
    width: 180,
  },
  { title: 'SKU/审核信息', key: 'sku', width: 150 },
  {
    title: '售价/原价/最低价/成本',
    key: 'prices',
    width: 160,
    children: [
      { title: '售', dataIndex: 'sellingPrice', key: 'sellingPrice', width: 80 },
      { title: '原', dataIndex: 'originalPrice', key: 'originalPrice', width: 80 },
      { title: '低', dataIndex: 'lowestPrice', key: 'lowestPrice', width: 80 },
      { title: '成', dataIndex: 'costPrice', key: 'costPrice', width: 80 },
    ],
  },
  { title: '总库存', dataIndex: 'totalStock', key: 'totalStock', width: 80 },
  { title: '14天销量', dataIndex: 'sales14d', key: 'sales14d', width: 90 },
  { title: '毛重/体积', key: 'weight', width: 100 },
  { title: '刊登/更新/修改/同步时间', key: 'timestamps', width: 180 },
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
          同步产品
        </Button>
        <Button>数据搬家</Button>
        <Button>
          <template #icon><EditOutlined /></template>
          编辑
        </Button>
        <Button type="primary" ghost>批量编辑</Button>
        <Button>
          <template #icon><ImportOutlined /></template>
          导入更新
        </Button>
        <Button danger>
          <template #icon><DeleteOutlined /></template>
          批量归档
        </Button>
        <Button>
          <template #icon><ExportOutlined /></template>
          导出产品
        </Button>
        <Button>设置分类</Button>
        <Button type="primary" ghost>自动更新价格</Button>
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

    <!-- Search Bar -->
    <div style="margin-bottom: 16px; display: flex; gap: 12px">
      <Select placeholder="平台店铺" style="width: 160px" allowClear>
        <SelectOption value="">全部店铺</SelectOption>
      </Select>
      <Input
        v-model:value="searchText"
        placeholder="ProductId"
        style="width: 200px"
        allowClear
      >
        <template #suffix><SearchOutlined /></template>
      </Input>
      <Select placeholder="是否隐藏" style="width: 120px" allowClear>
        <SelectOption value="false">显示</SelectOption>
        <SelectOption value="true">隐藏</SelectOption>
      </Select>
      <Select placeholder="排序" style="width: 120px" allowClear />
      <Button type="primary">
        <template #icon><SearchOutlined /></template>
        搜索
      </Button>
    </div>

    <!-- Product Table -->
    <Table
      :columns="columns"
      :dataSource="dataSource"
      :loading="loading"
      :rowSelection="rowSelection"
      :scroll="{ x: 1800 }"
      rowKey="id"
      size="small"
      bordered
      :pagination="{ pageSize: 50, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 行` }"
    />
  </div>
</template>
