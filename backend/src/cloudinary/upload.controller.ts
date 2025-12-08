import {
    Controller,
    Post,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CloudinaryService } from './cloudinary.service';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    /**
     * Upload event image (organizers, admins)
     */
    @Post('event/:eventId')
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Upload event banner image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid file type or size' })
    async uploadEventImage(
        @Param('eventId') eventId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const result = await this.cloudinaryService.uploadEventImage(file, eventId);
        return {
            message: 'Event image uploaded successfully',
            imageUrl: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Upload service image (service owners)
     */
    @Post('service/:serviceId')
    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Upload service image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid file type or size' })
    async uploadServiceImage(
        @Param('serviceId') serviceId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const result = await this.cloudinaryService.uploadServiceImage(file, serviceId);
        return {
            message: 'Service image uploaded successfully',
            imageUrl: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Upload club logo/image (organizers, admins)
     */
    @Post('club/:clubId')
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Upload club logo/image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid file type or size' })
    async uploadClubImage(
        @Param('clubId') clubId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const result = await this.cloudinaryService.uploadClubImage(file, clubId);
        return {
            message: 'Club image uploaded successfully',
            imageUrl: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Generic image upload (any authenticated user)
     * Returns URL without saving to any entity - frontend handles the save
     */
    @Post('image')
    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Upload generic image and get URL' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
    async uploadGenericImage(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        const result = await this.cloudinaryService.uploadPostImage(file, `generic_${user.id}_${Date.now()}`);
        return {
            message: 'Image uploaded successfully',
            imageUrl: result.secure_url,
            publicId: result.public_id,
        };
    }
}
