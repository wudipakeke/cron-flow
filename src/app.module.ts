import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database.module';
import { CronConfigModule } from './cron-config/cron-config.module';
import { TasksModule } from './tasks/tasks.module';
import { FeishuModule } from './feishu/feishu.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CronConfigModule,
    TasksModule,
    FeishuModule,
  ],
})
export class AppModule {}
