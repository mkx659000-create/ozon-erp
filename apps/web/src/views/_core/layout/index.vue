<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Select,
  SelectOption,
  Dropdown,
  Button,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  Menu,
  MenuItem,
  Tooltip,
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
  MoneyCollectOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  EditOutlined,
} from '@ant-design/icons-vue';
import { useUserStore, useStoreAccountStore } from '@/store';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const storeAccountStore = useStoreAccountStore();

const collapsed = ref(false);
const activeRoute = computed(() => route.name as string);

interface NavItem {
  key: string;
  label: string;
  icon: any;
  children?: { key: string; label: string }[];
}

const navItems: NavItem[] = [
  { key: 'Dashboard', label: '首页', icon: DashboardOutlined },
  {
    key: 'product-sub',
    label: 'OZON产品',
    icon: ShoppingOutlined,
    children: [
      { key: 'ProductOnline', label: '在线产品' },
      { key: 'ProductPublish', label: '产品刊登' },
    ],
  },
  { key: 'PromotionActivities', label: '促销活动', icon: FireOutlined },
  { key: 'OrderList', label: '订单管理', icon: FileTextOutlined },
  { key: 'Finance', label: '财务管理', icon: DollarOutlined },
  { key: 'Warehouse', label: '仓库管理', icon: InboxOutlined },
  { key: 'Returns', label: '退货管理', icon: RollbackOutlined },
  { key: 'Pricing', label: '定价管理', icon: MoneyCollectOutlined },
  { key: 'Rating', label: '卖家评分', icon: StarOutlined },
  { key: 'Reports', label: '报告中心', icon: FileSearchOutlined },
  { key: 'Analytics', label: '数据分析', icon: BarChartOutlined },
  { key: 'StoreAccounts', label: '店铺管理', icon: ShopOutlined },
];

const expandedSubs = ref<string[]>([]);

watch(
  () => route.name,
  (name) => {
    if (name === 'ProductOnline' || name === 'ProductPublish') {
      if (!expandedSubs.value.includes('product-sub')) {
        expandedSubs.value = ['product-sub'];
      }
    }
  },
  { immediate: true },
);

function isActive(key: string): boolean {
  return activeRoute.value === key;
}

function isSubActive(item: NavItem): boolean {
  return !!item.children?.some((c) => c.key === activeRoute.value);
}

function navigateTo(key: string) {
  router.push({ name: key });
}

function toggleSub(key: string) {
  const idx = expandedSubs.value.indexOf(key);
  if (idx >= 0) {
    expandedSubs.value.splice(idx, 1);
  } else {
    expandedSubs.value = [key];
  }
}

const breadcrumbMap: Record<string, { parent?: string; title: string }> = {
  Dashboard: { title: '首页' },
  ProductOnline: { parent: 'OZON产品', title: '在线产品' },
  ProductPublish: { parent: 'OZON产品', title: '产品刊登' },
  PromotionActivities: { parent: 'OZON促销', title: '促销活动' },
  OrderList: { title: '订单管理' },
  Finance: { title: '财务管理' },
  Warehouse: { title: '仓库管理' },
  Returns: { title: '退货管理' },
  Pricing: { title: '定价管理' },
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
  if (item.parent) crumbs.push({ title: item.parent, to: '' });
  if (name !== 'Dashboard') crumbs.push({ title: item.title, to: '' });
  return crumbs;
});

const activeStoreName = computed(() => {
  const store = storeAccountStore.stores.find((s) => s.id === storeAccountStore.activeStoreId);
  return store?.storeName || '';
});

const userInitial = computed(() => {
  const name = userStore.userInfo?.nickname || userStore.userInfo?.username || 'U';
  return name.charAt(0).toUpperCase();
});

async function loadStores() {
  try { await storeAccountStore.fetchStores(); } catch { /* noop */ }
}

onMounted(async () => {
  if (!userStore.userInfo) {
    try { await userStore.fetchProfile(); } catch { /* noop */ }
  }
  await loadStores();
});

watch(() => route.path, () => {
  if (storeAccountStore.stores.length === 0) loadStores();
});

function handleStoreChange(value: any) {
  storeAccountStore.setActiveStore(String(value));
}

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="app-layout">
    <!-- ─── Sidebar ─── -->
    <aside :class="['sidebar', { 'sidebar--collapsed': collapsed }]">
      <!-- Logo -->
      <div class="sidebar-logo" @click="router.push('/')">
        <div class="logo-mark">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#6366f1"/>
            <path d="M2 17l10 5 10-5" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <transition name="sidebar-fade">
          <div v-if="!collapsed" class="logo-text">
            <span class="logo-title">Ozon ERP</span>
          </div>
        </transition>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <template v-for="item in navItems" :key="item.key">
          <!-- Simple item -->
          <template v-if="!item.children">
            <Tooltip v-if="collapsed" :title="item.label" placement="right">
              <button
                :class="['nav-item', { 'nav-item--active': isActive(item.key) }]"
                @click="navigateTo(item.key)"
              >
                <component :is="item.icon" class="nav-icon" />
                <transition name="sidebar-fade">
                  <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
                </transition>
              </button>
            </Tooltip>
            <button
              v-else
              :class="['nav-item', { 'nav-item--active': isActive(item.key) }]"
              @click="navigateTo(item.key)"
            >
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-label">{{ item.label }}</span>
            </button>
          </template>

          <!-- Sub menu -->
          <template v-else>
            <Tooltip v-if="collapsed" :title="item.label" placement="right">
              <button
                :class="['nav-item', { 'nav-item--active': isSubActive(item) }]"
                @click="toggleSub(item.key)"
              >
                <component :is="item.icon" class="nav-icon" />
              </button>
            </Tooltip>
            <template v-else>
              <button
                :class="['nav-item', 'nav-item--sub', { 'nav-item--active': isSubActive(item) }]"
                @click="toggleSub(item.key)"
              >
                <component :is="item.icon" class="nav-icon" />
                <span class="nav-label">{{ item.label }}</span>
                <svg
                  :class="['nav-chevron', { 'nav-chevron--open': expandedSubs.includes(item.key) }]"
                  viewBox="0 0 16 16" width="12" height="12"
                >
                  <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
                </svg>
              </button>
              <div
                :class="['nav-sub', { 'nav-sub--open': expandedSubs.includes(item.key) }]"
              >
                <button
                  v-for="child in item.children"
                  :key="child.key"
                  :class="['nav-sub-item', { 'nav-sub-item--active': isActive(child.key) }]"
                  @click="navigateTo(child.key)"
                >
                  {{ child.label }}
                </button>
              </div>
            </template>
          </template>
        </template>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button class="nav-item nav-item--collapse" @click="collapsed = !collapsed">
          <MenuFoldOutlined v-if="!collapsed" class="nav-icon" />
          <MenuUnfoldOutlined v-else class="nav-icon" />
          <transition name="sidebar-fade">
            <span v-if="!collapsed" class="nav-label">收起菜单</span>
          </transition>
        </button>
      </div>
    </aside>

    <!-- ─── Main ─── -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <Breadcrumb class="header-breadcrumb">
            <BreadcrumbItem v-for="(crumb, i) in breadcrumbs" :key="i">
              <router-link v-if="crumb.to && i === 0" :to="crumb.to" class="breadcrumb-link">
                {{ crumb.title }}
              </router-link>
              <span v-else class="breadcrumb-text">{{ crumb.title }}</span>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>

        <div class="header-right">
          <!-- Store Selector -->
          <div v-if="storeAccountStore.stores.length > 0" class="store-pill">
            <div class="store-dot" />
            <Select
              :value="storeAccountStore.activeStoreId || undefined"
              style="width: 160px"
              placeholder="选择店铺"
              @change="handleStoreChange"
              size="small"
              :bordered="false"
              popupClassName="store-dropdown"
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
            size="small"
            type="text"
            class="add-store-btn"
            @click="router.push({ name: 'StoreAccounts' })"
          >
            <ShopOutlined /> 添加店铺
          </Button>

          <div class="header-sep" />

          <!-- User -->
          <Dropdown>
            <button class="user-btn">
              <div class="user-avatar">{{ userInitial }}</div>
              <span class="user-name">
                {{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}
              </span>
              <svg viewBox="0 0 16 16" width="12" height="12" style="color: var(--color-text-4)">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              </svg>
            </button>
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
      </header>

      <!-- Content -->
      <main class="content">
        <div class="content-inner">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* ─── Sidebar ─── */
.sidebar {
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: width var(--transition-slow);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}
.sidebar--collapsed {
  width: var(--sidebar-collapsed-width);
}

/* Logo */
.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  cursor: pointer;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}
.sidebar-nav::-webkit-scrollbar {
  width: 0;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--sidebar-text);
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
  position: relative;
  text-align: left;
  font-family: inherit;
}
.nav-item:hover {
  background: var(--sidebar-item-hover);
  color: var(--sidebar-text-active);
}
.nav-item--active {
  background: var(--sidebar-item-active);
  color: var(--sidebar-text-active);
}
.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--sidebar-item-active-border);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
  opacity: 0.75;
}
.nav-item--active .nav-icon {
  opacity: 1;
  color: var(--sidebar-item-active-border);
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
}

.nav-chevron {
  margin-left: auto;
  transition: transform var(--transition-fast);
  opacity: 0.4;
}
.nav-chevron--open {
  transform: rotate(90deg);
}

/* Sub items */
.nav-sub {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--transition-slow);
}
.nav-sub--open {
  max-height: 200px;
}
.nav-sub-item {
  width: 100%;
  display: block;
  padding: 7px 12px 7px 38px;
  border: none;
  background: transparent;
  color: var(--sidebar-text);
  font-size: 13px;
  font-weight: 400;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  font-family: inherit;
}
.nav-sub-item:hover {
  background: var(--sidebar-item-hover);
  color: var(--sidebar-text-active);
}
.nav-sub-item--active {
  color: var(--sidebar-text-active);
  font-weight: 500;
  background: var(--sidebar-item-active);
}

/* Collapse button */
.nav-item--collapse {
  margin-top: auto;
  opacity: 0.6;
}
.nav-item--collapse:hover {
  opacity: 1;
}

/* Sidebar footer */
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* ─── Main ─── */
.main-wrapper {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-slow);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.sidebar--collapsed ~ .main-wrapper {
  margin-left: var(--sidebar-collapsed-width);
}

/* ─── Header ─── */
.header {
  height: var(--header-height);
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--header-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}
.header-left {
  display: flex;
  align-items: center;
}
.header-breadcrumb {
  font-size: 13px;
}
.breadcrumb-link {
  color: var(--color-text-3) !important;
  transition: color var(--transition-fast);
}
.breadcrumb-link:hover {
  color: var(--color-primary) !important;
}
.breadcrumb-text {
  color: var(--color-text-2);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Store Pill */
.store-pill {
  display: flex;
  align-items: center;
  padding: 3px 4px 3px 10px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  gap: 6px;
}
.store-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.add-store-btn {
  color: var(--color-warning) !important;
  font-weight: 500 !important;
}

.header-sep {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}

/* User Button */
.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--transition-fast);
  font-family: inherit;
}
.user-btn:hover {
  background: var(--color-bg-hover);
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Content ─── */
.content {
  flex: 1;
  padding: 20px 24px;
  background: var(--color-bg-page);
}
.content-inner {
  background: var(--color-bg-container);
  border-radius: var(--radius-lg);
  padding: 24px;
  min-height: calc(100vh - var(--header-height) - 40px);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border-light);
}

/* ─── Transitions ─── */
.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity 0.15s;
}
.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}
</style>
