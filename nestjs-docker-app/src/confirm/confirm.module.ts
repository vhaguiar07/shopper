import { Module } from '@nestjs/common';
import { ConfirmController } from './confirm.controller';
import { ConfirmService } from './confirm.service';

@Module({
  controllers: [ConfirmController],
  providers: [ConfirmService],
})
export class ConfirmModule {}
