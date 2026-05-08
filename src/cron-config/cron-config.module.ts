import { Module, forwardRef } from '@nestjs/common';
import { CronConfigService } from './cron-config.service';
import { CronConfigController } from './cron-config.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [forwardRef(() => TasksModule)],
  controllers: [CronConfigController],
  providers: [CronConfigService],
  exports: [CronConfigService],
})
export class CronConfigModule {}
