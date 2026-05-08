import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';

interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
}

interface BitableRecord {
  record_id: string;
  fields: Record<string, any>;
}

interface BitableListResponse {
  code: number;
  msg: string;
  data?: {
    items: BitableRecord[];
    has_more: boolean;
    page_token: string;
    total: number;
  };
}

@Injectable()
export class FeishuService {
  private readonly logger = new Logger(FeishuService.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;
  private readonly BASE_URL = 'https://open.feishu.cn/open-apis';

  constructor(private db: DatabaseService) {}

  private async getTenantAccessToken(): Promise<string> {
    // 使用缓存的 token（提前5分钟过期）
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt - 300000) {
      return this.tokenCache.token;
    }

    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error('FEISHU_APP_ID 或 FEISHU_APP_SECRET 未配置');
    }

    const res = await fetch(`${this.BASE_URL}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });

    const data: FeishuTokenResponse = await res.json();
    if (data.code !== 0) {
      throw new Error(`获取飞书 tenant_access_token 失败: ${data.msg}`);
    }

    this.tokenCache = {
      token: data.tenant_access_token!,
      expiresAt: Date.now() + (data.expire || 7200) * 1000,
    };

    return this.tokenCache.token;
  }

  async fetchBitableData(appToken: string, tableId: string): Promise<void> {
    this.logger.log(`开始同步飞书多维表格: appToken=${appToken}, tableId=${tableId}`);

    const token = await this.getTenantAccessToken();
    const batchId = Date.now().toString();

    let pageToken: string | undefined;
    let totalCount = 0;

    do {
      const url = new URL(`${this.BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
      url.searchParams.set('page_size', '500');
      if (pageToken) url.searchParams.set('page_token', pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`飞书 API 请求失败: ${res.status} ${text}`);
      }

      const data: BitableListResponse = await res.json();
      if (data.code !== 0) {
        throw new Error(`飞书 API 返回错误: ${data.code} ${data.msg}`);
      }

      const items = data.data?.items || [];
      for (const item of items) {
        await this.db.execute(
          `INSERT INTO bitable_records (app_token, record_id, fields, batch_id)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE fields = VALUES(fields), synced_at = NOW()`,
          [appToken, item.record_id, JSON.stringify(item.fields), batchId],
        );
      }

      totalCount += items.length;
      pageToken = data.data?.has_more ? data.data?.page_token : undefined;
    } while (pageToken);

    this.logger.log(`飞书多维表格同步完成: 共 ${totalCount} 条记录`);
  }
}
