<script setup lang="ts">
import {
  Row,
  Col,
  Card,
  Statistic,
} from 'ant-design-vue';
import {
  ShoppingOutlined,
  FireOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
} from '@ant-design/icons-vue';
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">数据概览</h2>
    <Row :gutter="16">
      <Col :span="6">
        <Card>
          <Statistic title="在线产品" :value="0" :prefix="h(ShoppingOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="促销活动" :value="0" :prefix="h(FireOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="待处理订单" :value="0" :prefix="h(ShoppingCartOutlined)" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="最后同步" value="--" :prefix="h(SyncOutlined)" />
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script lang="ts">
import { h } from 'vue';
export default {};
</script>
