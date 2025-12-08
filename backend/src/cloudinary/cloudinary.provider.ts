import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        // Support both CLOUDINARY_URL and individual variables
        const cloudinaryUrl = configService.get<string>('CLOUDINARY_URL');

        if (cloudinaryUrl) {
            // Parse CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
            // Remove angle brackets if present (user may copy with them)
            const cleanUrl = cloudinaryUrl.replace(/<|>/g, '');
            const match = cleanUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);

            if (match) {
                return cloudinary.config({
                    cloud_name: match[3],
                    api_key: match[1],
                    api_secret: match[2],
                });
            }
        }

        // Fallback to individual variables
        return cloudinary.config({
            cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    },
};

