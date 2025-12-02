import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class ModeratorGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            return false;
        }

        if (user.role === Role.MODERATOR || user.role === Role.ADMIN) {
            return true;
        }

        throw new ForbiddenException('Access denied. Moderator role required.');
    }
}
