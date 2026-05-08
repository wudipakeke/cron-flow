import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../common/database.service';

export interface CronTask {
  id: number;
  name: string;
  cronExpr: string;
  taskType: string;
  taskParams: string | null;
  status: number;
}

@Injectable()
export class CronConfigService {
  private readonly logger = new Logger(CronConfigService.name);

  constructor(private db: DatabaseService) {}

  async getEnabledTasks(): Promise<CronTask[]> {
    const rows = await this.db.query<any[]>('SELECT * FROM v_cron_tasks');
    return rows;
  }

  async findById(id: number): Promise<CronTask | null> {
    const rows = await this.db.query<any[]>('SELECT * FROM v_cron_tasks WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async logExecution(configId: number, status: number, errorMsg?: string) {
    const env = process.env.APP_ENV || 'dev';
    await this.db.execute(
      'INSERT INTO cron_execution_logs (config_id, start_time, end_time, status, error_msg, env) VALUES (?, NOW(), NOW(), ?, ?, ?)',
      [configId, status, errorMsg || null, env],
    );
  }

  // Periodic check: every 30 seconds, reload enabled tasks and reschedule
  @Cron(CronExpression.EVERY_30_SECONDS)
  async reloadTasks() {
    const tasks = await this.getEnabledTasks();
    if (tasks.length > 0) {
      this.logger.log(`Loaded ${tasks.length} enabled task(s) from config`);
    }
  }
}
