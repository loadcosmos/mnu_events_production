import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class UpdatePreferencesDto {
    @ApiProperty({ description: 'Preferred event categories', example: ['ACADEMIC', 'SPORTS'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    preferredCategories?: string[];

    @ApiProperty({ description: 'Preferred CSI tags', example: ['social', 'professional'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    preferredCsiTags?: string[];

    @ApiProperty({ description: 'Interested club IDs', example: [] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interestedClubIds?: string[];

    @ApiProperty({ description: 'Available days for events', example: ['Monday', 'Friday'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    availableDays?: string[];

    @ApiProperty({ description: 'Preferred time slot', example: 'evening' })
    @IsOptional()
    @IsString()
    preferredTimeSlot?: string;

    @ApiProperty({ description: 'Onboarding completed', example: false })
    @IsOptional()
    @IsBoolean()
    onboardingCompleted?: boolean;

    @ApiProperty({ description: 'Current onboarding step', example: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    onboardingStep?: number;
}
