import { Controller, Post, Param, ParseIntPipe, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { CronConfigService } from './cron-config.service';
import { TasksService } from '../tasks/tasks.service';

@Controller('trigger')
export class CronConfigController {
  constructor(
    private readonly cronConfigService: CronConfigService,
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
  ) {}

  @Post(':configId')
  async trigger(@Param('configId', ParseIntPipe) configId: number) {
    const task = await this.cronConfigService.findById(configId);
    if (!task) throw new NotFoundException('任务不存在');
    // 异步执行，不阻塞响应
    this.tasksService.executeTask(task);
    return { message: '任务已触发' };
  }
}
