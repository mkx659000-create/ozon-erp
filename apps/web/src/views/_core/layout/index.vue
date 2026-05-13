<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Layout,
  LayoutSider,
  LayoutHeader,
  LayoutContent,
  Menu,
  MenuItem,
  SubMenu,
  Select,
  SelectOption,
  Dropdown,
  Button,
  Avatar,
  Space,
} from 'ant-design-vue';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FireOutlined,
  ShopOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons-vue';
import { useUserStore, useStoreAccountStore } from '@/store';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const storeAccountStore = useStoreAccountStore();

const collapsed = ref(false);
const selectedKeys = computed(() => [route.name as string]);

async function loadStores() {
  try {
    await storeAccountStore.fetchStores();
  } catch {
    // Backend not available
  }
}

onMounted(async () => {
  if (!userStore.userInfo) {
    try {
      await userStore.fetchProfile();
    } catch {
      // Backend not available, continue with layout render
    }
  }
  await loadStores();
});

// Re-fetch stores when navigating between pages in case stores were added/removed
watch(() => route.path, () => {
  if (storeAccountStore.stores.length === 0) {
    loadStores();
  }
});

function handleMenuClick(info: any) {
  router.push({ name: String(info.key) });
}

function handleStoreChange(value: any) {
  storeAccountStore.setActiveStore(String(value));
  window.location.reload();
}

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<template>
  <Layout style="min-height: 100vh">
    <LayoutSider v-model:collapsed="collapsed" :trigger="null" collapsible width="220">
      <div class="logo">
        <h1 v-if="!collapsed">Ozon ERP</h1>
        <h1 v-else>OZ</h1>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        :selectedKeys="selectedKeys"
        @click="handleMenuClick"
      >
        <MenuItem key="Dashboard">
          <DashboardOutlined />
          <span>首页</span>
        </MenuItem>
        <SubMenu key="product-sub">
          <template #title>
            <ShoppingOutlined />
            <span>OZON产品</span>
          </template>
          <MenuItem key="ProductOnline">OZON在线产品</MenuItem>
          <MenuItem key="ProductPublish">OZON产品刊登</MenuItem>
        </SubMenu>
        <SubMenu key="promotion-sub">
          <template #title>
            <FireOutlined />
            <span>OZON促销</span>
          </template>
          <MenuItem key="PromotionActivities">OZON促销活动</MenuItem>
        </SubMenu>
        <MenuItem key="OrderList">
          <FileTextOutlined />
          <span>订单管理</span>
        </MenuItem>
        <MenuItem key="Analytics">
          <BarChartOutlined />
          <span>数据分析</span>
        </MenuItem>
        <MenuItem key="StoreAccounts">
          <ShopOutlined />
          <span>店铺管理</span>
        </MenuItem>
      </Menu>
    </LayoutSider>

    <Layout>
      <LayoutHeader class="header">
        <div class="header-left">
          <MenuFoldOutlined
            v-if="!collapsed"
            class="trigger"
            @click="collapsed = true"
          />
          <MenuUnfoldOutlined
            v-else
            class="trigger"
            @click="collapsed = false"
          />
        </div>

        <div class="header-right">
          <Select
            v-if="storeAccountStore.stores.length > 0"
            :value="storeAccountStore.activeStoreId || undefined"
            style="width: 200px; margin-right: 16px"
            placeholder="选择店铺"
            @change="handleStoreChange"
          >
            <SelectOption
              v-for="store in storeAccountStore.stores"
              :key="store.id"
              :value="store.id"
            >
              {{ store.storeName }}
            </SelectOption>
          </Select>
          <Button
            v-else
            type="link"
            style="margin-right: 16px; color: #faad14"
            @click="router.push({ name: 'StoreAccounts' })"
          >
            <ShopOutlined /> 请先添加店铺
          </Button>

          <Dropdown>
            <Space class="user-info" style="cursor: pointer">
              <Avatar :size="28">
                <template #icon><UserOutlined /></template>
              </Avatar>
              <span>{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
            </Space>
            <template #overlay>
              <Menu @click="handleLogout">
                <MenuItem key="logout">
                  <LogoutOutlined />
                  <span style="margin-left: 8px">退出登录</span>
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </LayoutHeader>

      <LayoutContent class="content">
        <RouterView />
      </LayoutContent>
    </Layout>
  </Layout>
</template>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.header-left {
  display: flex;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
}
.trigger {
  font-size: 18px;
  cursor: pointer;
  padding: 0 12px;
}
.content {
  margin: 16px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  min-height: 280px;
}
</style>
