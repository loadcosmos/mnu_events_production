import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CheckInMode } from '@prisma/client';
import { Public } from './auth/decorators/public.decorator';

@Controller('migration')
export class MigrationController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Post('fix-checkin-modes')
  @HttpCode(HttpStatus.OK)
  async fixCheckInModes() {
    console.log('Starting check-in mode migration via HTTP endpoint...');

    const events = await this.prisma.event.findMany({
      select: {
        id: true,
        title: true,
        isPaid: true,
        isExternalEvent: true,
        checkInMode: true,
      },
    });

    console.log(`Found ${events.length} events to check`);

    let updatedCount = 0;
    const updates: Array<{
      id: string;
      title: string;
      oldMode: CheckInMode;
      newMode: CheckInMode;
    }> = [];

    for (const event of events) {
      let correctMode: CheckInMode;

      if (event.isExternalEvent) {
        correctMode = CheckInMode.ORGANIZER_SCANS;
      } else if (event.isPaid) {
        correctMode = CheckInMode.ORGANIZER_SCANS;
      } else {
        correctMode = CheckInMode.STUDENTS_SCAN;
      }

      if (event.checkInMode !== correctMode) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { checkInMode: correctMode },
        });

        updates.push({
          id: event.id,
          title: event.title,
          oldMode: event.checkInMode,
          newMode: correctMode,
        });

        updatedCount++;
      }
    }

    // Clear QR codes for STUDENTS_SCAN events
    const clearedQRs = await this.prisma.registration.updateMany({
      where: {
        event: {
          checkInMode: CheckInMode.STUDENTS_SCAN,
        },
        qrCode: { not: null },
      },
      data: { qrCode: null },
    });

    return {
      success: true,
      totalEvents: events.length,
      updatedEvents: updatedCount,
      clearedQRs: clearedQRs.count,
      updates: updates.map(u => ({
        id: u.id.slice(0, 8) + '...',
        title: u.title,
        change: `${u.oldMode} → ${u.newMode}`,
      })),
    };
  }
}
