import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getStoreAccountsApi,
  type StoreAccount,
} from '@/api/store-account/index';

export const useStoreAccountStore = defineStore(
  'storeAccount',
  () => {
    const stores = ref<StoreAccount[]>([]);
    const activeStoreId = ref<string>('');

    async function fetchStores() {
      stores.value = await getStoreAccountsApi();
      if (stores.value.length > 0 && !activeStoreId.value) {
        setActiveStore(stores.value[0].id);
      }
    }

    function setActiveStore(id: string) {
      activeStoreId.value = id;
      localStorage.setItem('active_store_id', id);
    }

    const activeStore = () =>
      stores.value.find((s) => s.id === activeStoreId.value);

    return { stores, activeStoreId, fetchStores, setActiveStore, activeStore };
  },
  { persist: { pick: ['activeStoreId'] } },
);
