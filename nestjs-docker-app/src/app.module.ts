import { Module } from '@nestjs/common';
import { UploadController } from './upload/upload.controller';
import { UploadModule } from './upload/upload.module';
import { UploadService } from './upload/upload.service';

@Module({
  imports: [UploadModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
