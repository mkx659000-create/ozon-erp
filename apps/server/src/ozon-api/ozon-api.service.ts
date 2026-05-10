import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';

const OZON_API_BASE = 'https://api-seller.ozon.ru';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface OzonCredentials {
  clientId: string;
  apiKey: string;
}

@Injectable()
export class OzonApiService {
  private readonly logger = new Logger(OzonApiService.name);

  createClient(credentials: OzonCredentials): AxiosInstance {
    const client = axios.create({
      baseURL: OZON_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': credentials.clientId,
        'Api-Key': credentials.apiKey,
      },
    });

    client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        if (!config) return Promise.reject(error);

        config.__retryCount = config.__retryCount || 0;

        if (
          config.__retryCount < MAX_RETRIES &&
          error.response?.status === 429
        ) {
          config.__retryCount += 1;
          const delay =
            RETRY_DELAY_MS * Math.pow(2, config.__retryCount - 1);
          this.logger.warn(
            `Ozon API rate limited, retry ${config.__retryCount}/${MAX_RETRIES} in ${delay}ms`,
          );
          await this.sleep(delay);
          return client(config);
        }

        return Promise.reject(error);
      },
    );

    return client;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
