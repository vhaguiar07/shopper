import { Module } from '@nestjs/common';
import { UploadController } from './upload/upload.controller';
import { UploadModule } from './upload/upload.module';
import { UploadService } from './upload/upload.service';
import { ConfirmController } from './confirm/confirm.controller';
import { ConfirmService } from './confirm/confirm.service';
import { ConfirmModule } from './confirm/confirm.module';
import { ListController } from './list/list.controller';
import { ListService } from './list/list.service';
import { ListModule } from './list/list.module';

@Module({
  imports: [UploadModule, ConfirmModule, ListModule],
  controllers: [UploadController, ConfirmController, ListController],
  providers: [UploadService, ConfirmService, ListService],
})
export class AppModule {}
