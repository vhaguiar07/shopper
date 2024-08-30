import { Module } from '@nestjs/common';
import { UploadController } from './upload/upload.controller';
import { UploadModule } from './upload/upload.module';
import { UploadService } from './upload/upload.service';
import { ConfirmController } from './confirm/confirm.controller';
import { ConfirmService } from './confirm/confirm.service';
import { ConfirmModule } from './confirm/confirm.module';

@Module({
  imports: [UploadModule, ConfirmModule],
  controllers: [UploadController, ConfirmController],
  providers: [UploadService, ConfirmService],
})
export class AppModule {}
