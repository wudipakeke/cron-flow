import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CronConfigService, CronTask } from '../cron-config/cron-config.service';
import { FeishuService } from '../feishu/feishu.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private cronConfig: CronConfigService,
    private feishuService: FeishuService,
  ) {}

  async executeTask(task: CronTask) {
    this.logger.log(`Executing task: ${task.name} (${task.taskType})`);

    const startTime = Date.now();

    try {
      switch (task.taskType) {
        case 'feishu_sync':
          await this.handleFeishuSync(task);
          break;
        case 'data_clean':
          await this.handleDataClean(task);
          break;
        default:
          this.logger.warn(`Unknown task type: ${task.taskType}`);
      }

      const elapsed = Date.now() - startTime;
      this.logger.log(`Task ${task.name} completed in ${elapsed}ms`);
      await this.cronConfig.logExecution(task.id, 1);
    } catch (error) {
      this.logger.error(`Task ${task.name} failed: ${error.message}`);
      await this.cronConfig.logExecution(task.id, 0, error.message);
    }
  }

  private async handleFeishuSync(task: CronTask) {
    const params = task.taskParams ? JSON.parse(task.taskParams) : {};
    const { appToken, tableId } = params;
    if (!appToken || !tableId) {
      throw new Error(`飞书同步参数不完整: 需要 appToken 和 tableId`);
    }
    this.logger.log(`Feishu sync: appToken=${appToken}, tableId=${tableId}`);
    await this.feishuService.fetchBitableData(appToken, tableId);
  }

  private async handleDataClean(task: CronTask) {
    this.logger.log(`Data clean task: ${task.name}`);
    // TODO: Implement data cleanup logic
  }

  // 每5分钟执行飞书同步任务
  @Cron('*/5 * * * *')
  async syncFeishuTasks() {
    const tasks = await this.cronConfig.getEnabledTasks();
    const feishuTasks = tasks.filter((t) => t.taskType === 'feishu_sync');
    if (feishuTasks.length > 0) {
      this.logger.log(`Found ${feishuTasks.length} feishu_sync task(s) to execute`);
      for (const task of feishuTasks) {
        await this.executeTask(task);
      }
    }
  }
}
