import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
    constructor(private readonly preferencesService: PreferencesService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user preferences' })
    @ApiResponse({ status: 200, description: 'Preferences retrieved' })
    async getMyPreferences(@CurrentUser() user: any) {
        return this.preferencesService.getByUserId(user.id);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user preferences' })
    @ApiResponse({ status: 200, description: 'Preferences updated' })
    async updateMyPreferences(
        @CurrentUser() user: any,
        @Body() dto: UpdatePreferencesDto,
    ) {
        return this.preferencesService.update(user.id, dto);
    }

    @Delete('me')
    @ApiOperation({ summary: 'Reset preferences to defaults' })
    @ApiResponse({ status: 200, description: 'Preferences reset' })
    async resetMyPreferences(@CurrentUser() user: any) {
        return this.preferencesService.reset(user.id);
    }

    @Patch('me/complete-onboarding')
    @ApiOperation({ summary: 'Mark onboarding as complete' })
    @ApiResponse({ status: 200, description: 'Onboarding completed' })
    async completeOnboarding(@CurrentUser() user: any) {
        return this.preferencesService.completeOnboarding(user.id);
    }
}
