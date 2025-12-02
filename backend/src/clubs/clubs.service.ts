import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { FilterClubsDto } from './dto/filter-clubs.dto';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  async create(createClubDto: CreateClubDto, userId: string) {
    const club = await this.prisma.club.create({
      data: {
        ...createClubDto,
        organizerId: userId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return club;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filterDto?: FilterClubsDto,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filterDto?.category) {
      where.category = filterDto.category;
    }

    if (filterDto?.search) {
      // Note: mode: 'insensitive' only works with String fields, not Text fields
      // description is @db.Text, so we can't use mode: 'insensitive' for it
      where.OR = [
        { name: { contains: filterDto.search, mode: 'insensitive' } },
        // description is Text field, so we search it case-sensitively
        { description: { contains: filterDto.search } },
      ];
    }

    // CSI categories filter (multi-select)
    if (filterDto?.csiCategories) {
      const csiTags = filterDto.csiCategories.split(',').map(tag => tag.trim());
      where.csiCategories = {
        hasSome: csiTags,
      };
    }

    const [clubs, total] = await Promise.all([
      this.prisma.club.findMany({
        where,
        skip,
        take: limit,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.club.count({ where }),
    ]);

    return {
      data: clubs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    return club;
  }

  async update(id: string, updateClubDto: UpdateClubDto, userId: string) {
    const club = await this.findOne(id);

    if (club.organizerId !== userId) {
      throw new ForbiddenException('You can only update your own clubs');
    }

    const updatedClub = await this.prisma.club.update({
      where: { id },
      data: updateClubDto,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return updatedClub;
  }

  async remove(id: string, userId: string) {
    const club = await this.findOne(id);

    if (club.organizerId !== userId) {
      throw new ForbiddenException('You can only delete your own clubs');
    }

    await this.prisma.club.delete({
      where: { id },
    });

    return { message: 'Club deleted successfully' };
  }

  async joinClub(clubId: string, userId: string) {
    const club = await this.findOne(clubId);

    // Check if already a member
    const existingMembership = await this.prisma.clubMembership.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a member of this club');
    }

    const membership = await this.prisma.clubMembership.create({
      data: {
        userId,
        clubId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return membership;
  }

  async leaveClub(clubId: string, userId: string) {
    const membership = await this.prisma.clubMembership.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this club');
    }

    // Prevent organizer from leaving
    const club = await this.findOne(clubId);
    if (club.organizerId === userId) {
      throw new BadRequestException('Organizer cannot leave the club');
    }

    await this.prisma.clubMembership.delete({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    return { message: 'Left club successfully' };
  }

  async getMyClubs(userId: string) {
    const clubs = await this.prisma.club.findMany({
      where: {
        OR: [
          { organizerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clubs;
  }
}


