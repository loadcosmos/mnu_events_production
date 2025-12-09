import { Module } from '@nestjs/common';
import { SavedPostsController } from './saved-posts.controller';
import { SavedPostsService } from './saved-posts.service';

@Module({
    controllers: [SavedPostsController],
    providers: [SavedPostsService],
    exports: [SavedPostsService],
})
export class SavedPostsModule { }
