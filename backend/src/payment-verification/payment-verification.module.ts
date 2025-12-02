import { Module } from '@nestjs/common';
import { PaymentVerificationController } from './payment-verification.controller';
import { PaymentVerificationService } from './payment-verification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentVerificationController],
  providers: [PaymentVerificationService],
  exports: [PaymentVerificationService],
})
export class PaymentVerificationModule {}
