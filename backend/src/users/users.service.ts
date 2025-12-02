import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateRoleDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import { sanitizeSearchQuery } from '../common/utils';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    // SECURITY FIX: Sanitize search input to prevent ReDoS and resource exhaustion
    const sanitizedSearch = sanitizeSearchQuery(search);

    const where = sanitizedSearch
      ? {
          OR: [
            { email: { contains: sanitizedSearch, mode: 'insensitive' as any } },
            { firstName: { contains: sanitizedSearch, mode: 'insensitive' as any } },
            { lastName: { contains: sanitizedSearch, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          faculty: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        faculty: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdEvents: true,
            registrations: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId: string) {
    // SECURITY FIX: Simplified - only used for user updating their own profile
    // Admin updates go through updateAsAdmin method
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        faculty: true,
        role: true,
        emailVerified: true,
      },
    });

    return updatedUser;
  }

  async updateAsAdmin(id: string, updateUserDto: UpdateUserDto) {
    // SECURITY FIX: Separate method for admin updates
    // This method should only be called from admin-protected endpoints
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        faculty: true,
        role: true,
        emailVerified: true,
      },
    });

    return updatedUser;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!updateRoleDto.role) {
      throw new BadRequestException('Role is required');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: updateRoleDto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string, currentUserId: string, currentUserRole: Role) {
    // Only admin can delete users, or users can delete themselves
    if (currentUserRole !== Role.ADMIN && id !== currentUserId) {
      throw new ForbiddenException('You do not have permission to delete this user');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}
