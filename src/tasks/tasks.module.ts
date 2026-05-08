import { Module, forwardRef } from '@nestjs/common';
import { CronConfigModule } from '../cron-config/cron-config.module';
import { FeishuModule } from '../feishu/feishu.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [forwardRef(() => CronConfigModule), FeishuModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
