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
  Breadcrumb,
  BreadcrumbItem,
  Tag,
} from 'ant-design-vue';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FireOutlined,
  ShopOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DollarOutlined,
  InboxOutlined,
  RollbackOutlined,
  FileSearchOutlined,
  StarOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import { useUserStore, useStoreAccountStore } from '@/store';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const storeAccountStore = useStoreAccountStore();

const collapsed = ref(false);
const selectedKeys = computed(() => [route.name as string]);

// Open keys for sub-menus: auto-expand based on current route
const openKeys = ref<string[]>([]);
watch(
  () => route.name,
  (name) => {
    if (name === 'ProductOnline' || name === 'ProductPublish') {
      openKeys.value = ['product-sub'];
    } else if (name === 'PromotionActivities') {
      openKeys.value = ['promotion-sub'];
    }
  },
  { immediate: true },
);

// Breadcrumb mapping
const breadcrumbMap: Record<string, { parent?: string; title: string }> = {
  Dashboard: { title: '首页' },
  ProductOnline: { parent: 'OZON产品', title: '在线产品' },
  ProductPublish: { parent: 'OZON产品', title: '产品刊登' },
  PromotionActivities: { parent: 'OZON促销', title: '促销活动' },
  OrderList: { title: '订单管理' },
  Finance: { title: '财务管理' },
  Warehouse: { title: '仓库管理' },
  Returns: { title: '退货管理' },
  Rating: { title: '卖家评分' },
  Reports: { title: '报告中心' },
  Analytics: { title: '数据分析' },
  StoreAccounts: { title: '店铺管理' },
};

const breadcrumbs = computed(() => {
  const name = route.name as string;
  const item = breadcrumbMap[name];
  if (!item) return [];
  const crumbs = [{ title: '首页', to: '/dashboard' }];
  if (item.parent) {
    crumbs.push({ title: item.parent, to: '' });
  }
  if (name !== 'Dashboard') {
    crumbs.push({ title: item.title, to: '' });
  }
  return crumbs;
});

// Active store name
const activeStoreName = computed(() => {
  const store = storeAccountStore.stores.find(
    (s) => s.id === storeAccountStore.activeStoreId,
  );
  return store?.storeName || '';
});

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
}

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<template>
  <Layout style="min-height: 100vh">
    <LayoutSider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      width="220"
      class="sidebar"
    >
      <div class="logo" @click="router.push('/')">
        <div class="logo-icon">
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
            <rect width="28" height="28" rx="6" fill="#1890ff"/>
            <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14C21 17.866 17.866 21 14 21C10.134 21 7 17.866 7 14Z" stroke="white" stroke-width="2"/>
            <path d="M11 14L13 16L17 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <transition name="fade">
          <div v-if="!collapsed" class="logo-text">
            <span class="logo-title">Ozon ERP</span>
            <span class="logo-subtitle">卖家管理系统</span>
          </div>
        </transition>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        v-model:openKeys="openKeys"
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
          <MenuItem key="ProductOnline">在线产品</MenuItem>
          <MenuItem key="ProductPublish">产品刊登</MenuItem>
        </SubMenu>
        <SubMenu key="promotion-sub">
          <template #title>
            <FireOutlined />
            <span>OZON促销</span>
          </template>
          <MenuItem key="PromotionActivities">促销活动</MenuItem>
        </SubMenu>
        <MenuItem key="OrderList">
          <FileTextOutlined />
          <span>订单管理</span>
        </MenuItem>
        <MenuItem key="Finance">
          <DollarOutlined />
          <span>财务管理</span>
        </MenuItem>
        <MenuItem key="Warehouse">
          <InboxOutlined />
          <span>仓库管理</span>
        </MenuItem>
        <MenuItem key="Returns">
          <RollbackOutlined />
          <span>退货管理</span>
        </MenuItem>
        <MenuItem key="Rating">
          <StarOutlined />
          <span>卖家评分</span>
        </MenuItem>
        <MenuItem key="Reports">
          <FileSearchOutlined />
          <span>报告中心</span>
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

      <!-- Sidebar footer -->
      <div class="sidebar-footer" v-if="!collapsed">
        <div class="sidebar-version">v1.0.0</div>
      </div>
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
          <Breadcrumb class="header-breadcrumb">
            <BreadcrumbItem v-for="(crumb, i) in breadcrumbs" :key="i">
              <router-link v-if="crumb.to && i === 0" :to="crumb.to" style="color: inherit">
                {{ crumb.title }}
              </router-link>
              <span v-else>{{ crumb.title }}</span>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>

        <div class="header-right">
          <!-- Store Selector -->
          <div v-if="storeAccountStore.stores.length > 0" class="store-selector">
            <ShopOutlined style="margin-right: 6px; color: #1890ff" />
            <Select
              :value="storeAccountStore.activeStoreId || undefined"
              style="width: 180px"
              placeholder="选择店铺"
              @change="handleStoreChange"
              size="small"
              :bordered="false"
            >
              <SelectOption
                v-for="store in storeAccountStore.stores"
                :key="store.id"
                :value="store.id"
              >
                {{ store.storeName }}
              </SelectOption>
            </Select>
          </div>
          <Button
            v-else
            type="link"
            size="small"
            style="color: #faad14"
            @click="router.push({ name: 'StoreAccounts' })"
          >
            <ShopOutlined /> 请先添加店铺
          </Button>

          <div class="header-divider" />

          <!-- User Menu -->
          <Dropdown>
            <div class="user-info">
              <Avatar :size="30" style="background-color: #1890ff">
                <template #icon><UserOutlined /></template>
              </Avatar>
              <span class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}</span>
            </div>
            <template #overlay>
              <Menu>
                <MenuItem key="logout" @click="handleLogout">
                  <LogoutOutlined />
                  <span style="margin-left: 8px">退出登录</span>
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </LayoutHeader>

      <LayoutContent class="content-wrapper">
        <div class="page-content">
          <RouterView />
        </div>
      </LayoutContent>
    </Layout>
  </Layout>
</template>

<style scoped>
.sidebar {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  position: relative;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  transition: opacity 0.2s;
  overflow: hidden;
  gap: 10px;
}
.logo:hover {
  opacity: 0.85;
}
.logo-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}
.logo-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.logo-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.sidebar-version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
}

.header {
  background: #fff;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 9;
  height: 56px;
  line-height: 56px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-breadcrumb {
  margin-left: 4px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-divider {
  width: 1px;
  height: 24px;
  background: #e8e8e8;
  margin: 0 8px;
}

.store-selector {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: #f6f8fa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.trigger:hover {
  background: #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.user-info:hover {
  background: #f5f5f5;
}
.user-name {
  font-size: 14px;
  color: #333;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-wrapper {
  margin: 0;
  padding: 16px;
  background: #f0f2f5;
  min-height: calc(100vh - 56px);
}
.page-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  min-height: calc(100vh - 88px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
