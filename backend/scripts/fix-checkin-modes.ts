import { PrismaClient, CheckInMode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting check-in mode migration...');
  console.log('This script will update checkInMode for existing events based on business rules:');
  console.log('  1. External events ALWAYS use ORGANIZER_SCANS (for analytics)');
  console.log('  2. Internal paid events use ORGANIZER_SCANS (student has ticket)');
  console.log('  3. Internal free events use STUDENTS_SCAN (organizer displays QR)');
  console.log('');

  // Get all events
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      isPaid: true,
      isExternalEvent: true,
      checkInMode: true,
    },
  });

  console.log(`Found ${events.length} events to check`);
  console.log('');

  let updatedCount = 0;
  const updates: Array<{
    id: string;
    title: string;
    oldMode: CheckInMode;
    newMode: CheckInMode;
  }> = [];

  for (const event of events) {
    // Determine correct mode based on business rules
    let correctMode: CheckInMode;

    if (event.isExternalEvent) {
      // External venues always scan students for analytics
      correctMode = CheckInMode.ORGANIZER_SCANS;
    } else if (event.isPaid) {
      // Internal paid events: organizer scans ticket
      correctMode = CheckInMode.ORGANIZER_SCANS;
    } else {
      // Internal free events: student scans organizer's QR
      correctMode = CheckInMode.STUDENTS_SCAN;
    }

    // Update if different from current mode
    if (event.checkInMode !== correctMode) {
      await prisma.event.update({
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

  console.log('Migration complete!');
  console.log(`Total events checked: ${events.length}`);
  console.log(`Events updated: ${updatedCount}`);
  console.log('');

  if (updatedCount > 0) {
    console.log('Updated events:');
    updates.forEach((update, index) => {
      console.log(
        `  ${index + 1}. [${update.id.slice(0, 8)}...] "${update.title}": ${update.oldMode} → ${update.newMode}`
      );
    });
    console.log('');
  }

  // Also clear QR codes for registrations that shouldn't have them
  console.log('Clearing registration QR codes for STUDENTS_SCAN events...');

  const clearedQRs = await prisma.registration.updateMany({
    where: {
      event: {
        checkInMode: CheckInMode.STUDENTS_SCAN,
      },
      qrCode: { not: null },
    },
    data: { qrCode: null },
  });

  console.log(`Cleared ${clearedQRs.count} registration QR codes`);
  console.log('');
  console.log('✅ Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
