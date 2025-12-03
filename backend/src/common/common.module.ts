import { Module, Global } from '@nestjs/common';
import { EmailService } from './services/email.service';

@Global() // Make this module global so EmailService is available everywhere
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class CommonModule {}
