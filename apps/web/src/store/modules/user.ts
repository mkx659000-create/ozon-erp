import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  loginApi,
  registerApi,
  getProfileApi,
  type LoginParams,
  type RegisterParams,
  type UserInfo,
} from '@/api/core/auth';

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const userInfo = ref<UserInfo | null>(null);

    async function login(params: LoginParams) {
      const result = await loginApi(params);
      token.value = result.accessToken;
      localStorage.setItem('access_token', result.accessToken);
      await fetchProfile();
    }

    async function register(params: RegisterParams) {
      const result = await registerApi(params);
      token.value = result.accessToken;
      localStorage.setItem('access_token', result.accessToken);
      await fetchProfile();
    }

    async function fetchProfile() {
      userInfo.value = await getProfileApi();
    }

    function logout() {
      token.value = '';
      userInfo.value = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('active_store_id');
    }

    return { token, userInfo, login, register, fetchProfile, logout };
  },
  { persist: { pick: ['token'] } },
);
