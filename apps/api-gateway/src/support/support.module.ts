import { Module } from '@nestjs/common';
import { EmailModule } from '@app/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [EmailModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
