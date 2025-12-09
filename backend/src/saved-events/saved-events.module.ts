import { Module } from '@nestjs/common';
import { SavedEventsController } from './saved-events.controller';
import { SavedEventsService } from './saved-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SavedEventsController],
    providers: [SavedEventsService],
    exports: [SavedEventsService],
})
export class SavedEventsModule { }
