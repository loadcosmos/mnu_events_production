import {
  PrismaClient,
  Role,
  Category,
  CsiCategory,
  EventStatus,
  ClubCategory,
  ServiceType,
  ServiceCategory,
  PriceType,
  AdPosition,
  PaymentStatus,
  TicketStatus,
  CheckInMode,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean database
  await prisma.checkIn.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.advertisement.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.clubMembership.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Database cleaned');

  // Create users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@kazguu.kz',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      emailVerified: true,
      faculty: 'Administration',
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@kazguu.kz',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Organizer',
      role: Role.ORGANIZER,
      emailVerified: true,
      faculty: 'Computer Science',
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@kazguu.kz',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Moderator',
      role: Role.MODERATOR,
      emailVerified: true,
      faculty: 'Administration',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@kazguu.kz',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Student',
      role: Role.STUDENT,
      emailVerified: true,
      faculty: 'Business',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@kazguu.kz',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Johnson',
      role: Role.STUDENT,
      emailVerified: true,
      faculty: 'Engineering',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@kazguu.kz',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      role: Role.STUDENT,
      emailVerified: true,
      faculty: 'Law',
    },
  });

  console.log('✅ Users created');

  // Create external partners
  const partner1User = await prisma.user.create({
    data: {
      email: 'partner1@itacademy.kz',
      password: hashedPassword,
      firstName: 'Ivan',
      lastName: 'Petrov',
      role: Role.EXTERNAL_PARTNER,
      emailVerified: true,
      faculty: null,
    },
  });

  const partner2User = await prisma.user.create({
    data: {
      email: 'partner2@coffeehouse.kz',
      password: hashedPassword,
      firstName: 'Elena',
      lastName: 'Sidorova',
      role: Role.EXTERNAL_PARTNER,
      emailVerified: true,
      faculty: null,
    },
  });

  // Create platform settings
  await prisma.platformSettings.create({
    data: {
      defaultCommissionRate: 0.10, // 10%
      premiumCommissionRate: 0.07, // 7%
      additionalEventPrice: 3000,
      premiumSubscriptionPrice: 15000,
      topBannerPricePerWeek: 15000,
      nativeFeedPricePerWeek: 8000,
      sidebarPricePerWeek: 5000,
      platformKaspiPhone: '+7 777 999 88 77',
      platformKaspiName: 'MNU Events Platform',
    },
  });

  const partner1 = await prisma.externalPartner.create({
    data: {
      userId: partner1User.id,
      companyName: 'IT Academy Kazakhstan',
      bin: '123456789012',
      contactPerson: 'Ivan Petrov',
      phone: '+7 777 123 45 67',
      email: 'info@itacademy.kz',
      whatsapp: '+7 777 123 45 67',
      kaspiPhone: '+7 777 123 45 67',
      kaspiName: 'Ivan Petrov',
      commissionRate: 0.10,
      paidEventSlots: 2, // Has 2 additional paid slots
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  const partner2 = await prisma.externalPartner.create({
    data: {
      userId: partner2User.id,
      companyName: 'Coffee House Central',
      bin: '987654321098',
      contactPerson: 'Elena Sidorova',
      phone: '+7 701 987 65 43',
      email: 'info@coffeehouse.kz',
      whatsapp: '+7 701 987 65 43',
      kaspiPhone: '+7 701 987 65 43',
      kaspiName: 'Elena Sidorova',
      commissionRate: 0.08, // Custom 8% commission
      paidEventSlots: 0,
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  console.log('✅ External partners created');

  // Create events
  const events = [];

  // Используем текущий год для событий в декабре
  // Если сейчас ноябрь 2025, события будут в декабре 2025
  const currentYear = new Date().getFullYear();
  const eventYear = currentYear; // Используем текущий год для событий в декабре

  const event1 = await prisma.event.create({
    data: {
      title: 'Hackathon 2025',
      description:
        'Annual coding competition for students. Build innovative solutions in 24 hours! Prizes for top 3 teams.',
      category: Category.TECH,
      csiTags: [CsiCategory.CREATIVITY, CsiCategory.INTELLIGENCE],
      location: 'Main Hall, Building A',
      startDate: new Date(`${eventYear}-12-15T10:00:00`),
      endDate: new Date(`${eventYear}-12-15T18:00:00`),
      capacity: 100,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
      creatorId: organizer.id,
    },
  });
  events.push(event1);

  const event2 = await prisma.event.create({
    data: {
      title: 'Career Fair 2025',
      description:
        'Meet top employers and explore career opportunities. Bring your resume and dress professionally.',
      category: Category.CAREER,
      csiTags: [CsiCategory.INTELLIGENCE, CsiCategory.SERVICE],
      location: 'Sports Complex',
      startDate: new Date(`${eventYear}-12-20T09:00:00`),
      endDate: new Date(`${eventYear}-12-20T17:00:00`),
      capacity: 200,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1560439514-4e9645039924',
      creatorId: admin.id,
    },
  });
  events.push(event2);

  const event3 = await prisma.event.create({
    data: {
      title: 'Football Tournament',
      description:
        'Inter-faculty football championship. Register your team now! 7 players per team.',
      category: Category.SPORTS,
      csiTags: [CsiCategory.CREATIVITY],
      location: 'Stadium',
      startDate: new Date(`${eventYear}-12-10T14:00:00`),
      endDate: new Date(`${eventYear}-12-10T18:00:00`),
      capacity: 50,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55',
      creatorId: organizer.id,
    },
  });
  events.push(event3);

  const event4 = await prisma.event.create({
    data: {
      title: 'Cultural Night: Kazakhstan',
      description:
        'Celebrate Kazakh culture with traditional music, dance, and food. Free entry for all students.',
      category: Category.CULTURAL,
      csiTags: [CsiCategory.CREATIVITY],
      location: 'Concert Hall',
      startDate: new Date(`${eventYear}-12-18T18:00:00`),
      endDate: new Date(`${eventYear}-12-18T21:00:00`),
      capacity: 150,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
      creatorId: admin.id,
    },
  });
  events.push(event4);

  const event5 = await prisma.event.create({
    data: {
      title: 'AI & Machine Learning Workshop',
      description:
        'Learn the basics of AI and ML from industry experts. Hands-on coding session included.',
      category: Category.ACADEMIC,
      csiTags: [CsiCategory.INTELLIGENCE],
      location: 'Room 301, Building B',
      startDate: new Date(`${eventYear}-12-12T10:00:00`),
      endDate: new Date(`${eventYear}-12-12T13:00:00`),
      capacity: 40,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
      creatorId: organizer.id,
    },
  });
  events.push(event5);

  const event6 = await prisma.event.create({
    data: {
      title: 'Student Mixer',
      description:
        'Meet new friends and network with fellow students. Refreshments will be provided.',
      category: Category.SOCIAL,
      csiTags: [CsiCategory.SERVICE],
      location: 'Student Lounge',
      startDate: new Date(`${eventYear}-12-08T17:00:00`),
      endDate: new Date(`${eventYear}-12-08T20:00:00`),
      capacity: 80,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
      creatorId: admin.id,
    },
  });
  events.push(event6);

  const event7 = await prisma.event.create({
    data: {
      title: 'Startup Pitch Competition',
      description:
        'Present your startup idea to investors. Top 3 winners receive seed funding!',
      category: Category.CAREER,
      csiTags: [CsiCategory.CREATIVITY, CsiCategory.INTELLIGENCE],
      location: 'Innovation Lab',
      startDate: new Date(`${eventYear}-12-22T13:00:00`),
      endDate: new Date(`${eventYear}-12-22T17:00:00`),
      capacity: 60,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd',
      creatorId: organizer.id,
    },
  });
  events.push(event7);

  const event8 = await prisma.event.create({
    data: {
      title: 'Chess Championship',
      description: 'University chess tournament. All skill levels welcome. Prizes for top 3 players.',
      category: Category.SPORTS,
      csiTags: [CsiCategory.INTELLIGENCE],
      location: 'Library Conference Room',
      startDate: new Date(`${eventYear}-12-14T10:00:00`),
      endDate: new Date(`${eventYear}-12-14T16:00:00`),
      capacity: 30,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b',
      creatorId: admin.id,
    },
  });
  events.push(event8);

  const event9 = await prisma.event.create({
    data: {
      title: 'Photography Exhibition',
      description:
        'Student photography showcase. Submit your best work and vote for your favorites!',
      category: Category.CULTURAL,
      csiTags: [CsiCategory.CREATIVITY],
      location: 'Art Gallery',
      startDate: new Date(`${eventYear}-12-16T12:00:00`),
      endDate: new Date(`${eventYear}-12-16T18:00:00`),
      capacity: 100,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d',
      creatorId: organizer.id,
    },
  });
  events.push(event9);

  const event10 = await prisma.event.create({
    data: {
      title: 'Volunteer Day',
      description:
        'Join us in giving back to the community. Various volunteer activities available.',
      category: Category.SOCIAL,
      csiTags: [CsiCategory.SERVICE],
      location: 'City Community Center',
      startDate: new Date(`${eventYear}-12-09T09:00:00`),
      endDate: new Date(`${eventYear}-12-09T15:00:00`),
      capacity: 50,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a',
      creatorId: admin.id,
    },
  });
  events.push(event10);

  // Create external partner events (paid, with commission tracking)
  const partnerEvent1 = await prisma.event.create({
    data: {
      title: 'Full-Stack Web Development Bootcamp',
      description:
        'Intensive 2-day coding bootcamp by IT Academy Kazakhstan. Learn React, Node.js, and deploy your first web app. Certificate included.',
      category: Category.TECH,
      csiTags: [CsiCategory.CREATIVITY, CsiCategory.INTELLIGENCE],
      location: 'IT Academy, Dostyk Avenue 123',
      startDate: new Date(`${eventYear}-12-21T10:00:00`),
      endDate: new Date(`${eventYear}-12-22T18:00:00`),
      capacity: 25,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      creatorId: partner1User.id,
      isPaid: true,
      price: 15000,
      isExternalEvent: true,
      externalPartnerId: partner1.id,
      checkInMode: CheckInMode.ORGANIZER_SCANS,
    },
  });
  events.push(partnerEvent1);

  const partnerEvent2 = await prisma.event.create({
    data: {
      title: 'Coffee & Networking: Startup Founders Meetup',
      description:
        'Exclusive networking event for aspiring entrepreneurs and startup founders. Connect over coffee, share ideas, and find potential co-founders. Drinks and snacks included.',
      category: Category.CAREER,
      csiTags: [CsiCategory.SERVICE],
      location: 'Coffee House Central, Abay Street 45',
      startDate: new Date(`${eventYear}-12-17T18:00:00`),
      endDate: new Date(`${eventYear}-12-17T21:00:00`),
      capacity: 30,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348',
      creatorId: partner2User.id,
      isPaid: true,
      price: 2500,
      isExternalEvent: true,
      externalPartnerId: partner2.id,
      checkInMode: CheckInMode.ORGANIZER_SCANS,
    },
  });
  events.push(partnerEvent2);

  console.log('✅ External partner events created (testing commission system)');

  // Create paid events
  const paidEvent1 = await prisma.event.create({
    data: {
      title: 'Premium Networking Gala',
      description:
        'Exclusive networking event with industry leaders and successful entrepreneurs. Ticket includes dinner and drinks.',
      category: Category.CAREER,
      csiTags: [CsiCategory.INTELLIGENCE, CsiCategory.SERVICE],
      location: 'Grand Ballroom, Rixos Hotel',
      startDate: new Date(`${eventYear}-12-25T19:00:00`),
      endDate: new Date(`${eventYear}-12-25T23:00:00`),
      capacity: 50,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
      creatorId: organizer.id,
      isPaid: true,
      price: 5000,
      platformFee: 500,
      checkInMode: CheckInMode.ORGANIZER_SCANS,
    },
  });
  events.push(paidEvent1);

  const paidEvent2 = await prisma.event.create({
    data: {
      title: 'Advanced Python Bootcamp',
      description:
        '3-hour intensive Python programming course with certification. Materials and laptop provided.',
      category: Category.TECH,
      csiTags: [CsiCategory.CREATIVITY, CsiCategory.INTELLIGENCE],
      location: 'IT Lab, Building C',
      startDate: new Date(`${eventYear}-12-19T10:00:00`),
      endDate: new Date(`${eventYear}-12-19T13:00:00`),
      capacity: 30,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
      creatorId: organizer.id,
      isPaid: true,
      price: 3000,
      platformFee: 300,
      checkInMode: CheckInMode.ORGANIZER_SCANS,
    },
  });
  events.push(paidEvent2);

  const freeLecture = await prisma.event.create({
    data: {
      title: 'Introduction to AI - Open Lecture',
      description:
        'Free educational lecture on Artificial Intelligence basics. Open to all students.',
      category: Category.ACADEMIC,
      csiTags: [CsiCategory.INTELLIGENCE],
      location: 'Lecture Hall 1, Building B',
      startDate: new Date(`${eventYear}-12-11T14:00:00`),
      endDate: new Date(`${eventYear}-12-11T16:00:00`),
      capacity: 200,
      status: EventStatus.UPCOMING,
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
      creatorId: admin.id,
      isPaid: false,
      checkInMode: CheckInMode.STUDENTS_SCAN,
      eventQRCode: 'EVENT_QR_' + Date.now(),
      qrCodeExpiry: new Date(`${eventYear}-12-11T17:00:00`),
    },
  });
  events.push(freeLecture);

  console.log('✅ Events created (including paid and free lecture events)');

  // Create registrations
  await prisma.registration.create({
    data: {
      userId: student1.id,
      eventId: event1.id,
      status: 'REGISTERED',
    },
  });

  await prisma.registration.create({
    data: {
      userId: student1.id,
      eventId: event2.id,
      status: 'REGISTERED',
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  await prisma.registration.create({
    data: {
      userId: student2.id,
      eventId: event1.id,
      status: 'REGISTERED',
    },
  });

  await prisma.registration.create({
    data: {
      userId: student2.id,
      eventId: event3.id,
      status: 'REGISTERED',
      checkedIn: true,
      checkedInAt: new Date(),
    },
  });

  await prisma.registration.create({
    data: {
      userId: student3.id,
      eventId: event1.id,
      status: 'REGISTERED',
    },
  });

  await prisma.registration.create({
    data: {
      userId: student3.id,
      eventId: event4.id,
      status: 'REGISTERED',
    },
  });

  await prisma.registration.create({
    data: {
      userId: student3.id,
      eventId: event5.id,
      status: 'REGISTERED',
    },
  });

  console.log('✅ Registrations created');

  // Helper function to generate QR code
  const generateTicketQRCode = async (ticketId: string, eventId: string, userId: string): Promise<string> => {
    const qrPayload = {
      ticketId,
      eventId,
      userId,
      timestamp: Date.now(),
    };

    // SECURITY FIX: Never use default secrets - require PAYMENT_SECRET to be set
    // This prevents QR code forgery attacks
    if (!process.env.PAYMENT_SECRET) {
      throw new Error(
        'PAYMENT_SECRET environment variable is required for seed data. ' +
        'This secret is used to sign QR codes and must be set in your .env file.'
      );
    }

    const secret = process.env.PAYMENT_SECRET;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(qrPayload))
      .digest('hex');

    const qrData = {
      ...qrPayload,
      signature,
    };

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to a minimal valid base64 PNG (1x1 transparent pixel)
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  };

  // Create paid tickets with real QR codes
  const ticket1Id = 'ticket-seed-' + Date.now() + '-1';
  const qrCode1 = await generateTicketQRCode(ticket1Id, paidEvent1.id, student1.id);

  const ticket1 = await prisma.ticket.create({
    data: {
      id: ticket1Id,
      eventId: paidEvent1.id,
      userId: student1.id,
      price: 5000,
      platformFee: 500,
      status: TicketStatus.PAID,
      paymentMethod: 'mock',
      transactionId: 'MOCK_TXN_' + Date.now() + '_1',
      qrCode: qrCode1,
      purchasedAt: new Date(),
    },
  });

  const ticket2Id = 'ticket-seed-' + Date.now() + '-2';
  const qrCode2 = await generateTicketQRCode(ticket2Id, paidEvent1.id, student2.id);

  const ticket2 = await prisma.ticket.create({
    data: {
      id: ticket2Id,
      eventId: paidEvent1.id,
      userId: student2.id,
      price: 5000,
      platformFee: 500,
      status: TicketStatus.PAID,
      paymentMethod: 'mock',
      transactionId: 'MOCK_TXN_' + Date.now() + '_2',
      qrCode: qrCode2,
      purchasedAt: new Date(),
    },
  });

  const ticket3Id = 'ticket-seed-' + Date.now() + '-3';
  const qrCode3 = await generateTicketQRCode(ticket3Id, paidEvent2.id, student3.id);

  const ticket3 = await prisma.ticket.create({
    data: {
      id: ticket3Id,
      eventId: paidEvent2.id,
      userId: student3.id,
      price: 3000,
      platformFee: 300,
      status: TicketStatus.PAID,
      paymentMethod: 'mock',
      transactionId: 'MOCK_TXN_' + Date.now() + '_3',
      qrCode: qrCode3,
      purchasedAt: new Date(),
    },
  });

  // Create partner event tickets with commission tracking
  // Partner 1 (IT Academy): 15,000₸ event, 10% commission = 1,500₸ commission, 13,500₸ to partner
  const partnerTicket1Id = 'ticket-seed-' + Date.now() + '-partner1';
  const partnerQrCode1 = await generateTicketQRCode(partnerTicket1Id, partnerEvent1.id, student1.id);

  const partnerTicket1 = await prisma.ticket.create({
    data: {
      id: partnerTicket1Id,
      eventId: partnerEvent1.id,
      userId: student1.id,
      price: 15000,
      platformFee: 0, // No platform fee for external events
      status: TicketStatus.PAID,
      paymentMethod: 'kaspi',
      transactionId: 'KASPI_TXN_' + Date.now() + '_P1',
      qrCode: partnerQrCode1,
      purchasedAt: new Date(),
      // Commission fields
      commissionRate: 0.10, // 10%
      commissionAmount: 1500, // 15,000 * 0.10
      partnerAmount: 13500, // 15,000 - 1,500
      ticketCode: 'TICKET-SEED001',
      commissionPaidByPartner: false,
    },
  });

  // Partner 2 (Coffee House): 2,500₸ event, 8% custom commission = 200₸ commission, 2,300₸ to partner
  const partnerTicket2Id = 'ticket-seed-' + Date.now() + '-partner2';
  const partnerQrCode2 = await generateTicketQRCode(partnerTicket2Id, partnerEvent2.id, student2.id);

  const partnerTicket2 = await prisma.ticket.create({
    data: {
      id: partnerTicket2Id,
      eventId: partnerEvent2.id,
      userId: student2.id,
      price: 2500,
      platformFee: 0,
      status: TicketStatus.PAID,
      paymentMethod: 'kaspi',
      transactionId: 'KASPI_TXN_' + Date.now() + '_P2',
      qrCode: partnerQrCode2,
      purchasedAt: new Date(),
      // Commission fields
      commissionRate: 0.08, // 8% custom rate
      commissionAmount: 200, // 2,500 * 0.08
      partnerAmount: 2300, // 2,500 - 200
      ticketCode: 'TICKET-SEED002',
      commissionPaidByPartner: false,
    },
  });

  // One more ticket for partner event 1
  const partnerTicket3Id = 'ticket-seed-' + Date.now() + '-partner3';
  const partnerQrCode3 = await generateTicketQRCode(partnerTicket3Id, partnerEvent1.id, student3.id);

  const partnerTicket3 = await prisma.ticket.create({
    data: {
      id: partnerTicket3Id,
      eventId: partnerEvent1.id,
      userId: student3.id,
      price: 15000,
      platformFee: 0,
      status: TicketStatus.PAID,
      paymentMethod: 'kaspi',
      transactionId: 'KASPI_TXN_' + Date.now() + '_P3',
      qrCode: partnerQrCode3,
      purchasedAt: new Date(),
      // Commission fields
      commissionRate: 0.10,
      commissionAmount: 1500,
      partnerAmount: 13500,
      ticketCode: 'TICKET-SEED003',
      commissionPaidByPartner: true, // This one is already paid
      commissionPaidAt: new Date(),
    },
  });

  console.log('✅ Tickets created (including 3 partner event tickets with commission tracking)');

  // Create check-ins
  await prisma.checkIn.create({
    data: {
      eventId: freeLecture.id,
      userId: student1.id,
      scanMode: CheckInMode.STUDENTS_SCAN,
      checkedInAt: new Date(),
    },
  });

  await prisma.checkIn.create({
    data: {
      eventId: freeLecture.id,
      userId: student2.id,
      scanMode: CheckInMode.STUDENTS_SCAN,
      checkedInAt: new Date(),
    },
  });

  console.log('✅ Check-ins created');

  // Create services
  const service1 = await prisma.service.create({
    data: {
      providerId: student1.id,
      type: ServiceType.GENERAL,
      title: 'Professional Logo Design',
      description:
        'Custom logo design for your business or personal brand. Includes 3 concepts and unlimited revisions.',
      category: ServiceCategory.DESIGN,
      price: 15000,
      priceType: PriceType.FIXED,
      imageUrl: 'https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67',
      rating: 4.8,
      reviewCount: 12,
      isActive: true,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      providerId: student2.id,
      type: ServiceType.GENERAL,
      title: 'Event Photography & Videography',
      description:
        'Professional photography and video services for events, parties, and special occasions.',
      category: ServiceCategory.PHOTO_VIDEO,
      price: 25000,
      priceType: PriceType.PER_SESSION,
      imageUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d',
      rating: 4.9,
      reviewCount: 18,
      isActive: true,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      providerId: student3.id,
      type: ServiceType.GENERAL,
      title: 'Web Development & IT Consulting',
      description:
        'Full-stack web development, app development, and IT consulting services.',
      category: ServiceCategory.IT,
      price: 8000,
      priceType: PriceType.HOURLY,
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      rating: 4.7,
      reviewCount: 9,
      isActive: true,
    },
  });

  const tutoring1 = await prisma.service.create({
    data: {
      providerId: organizer.id,
      type: ServiceType.TUTORING,
      title: 'Math Tutoring - Calculus & Algebra',
      description:
        'Expert math tutoring for university students. Specializing in Calculus I, II, Linear Algebra.',
      category: ServiceCategory.MATH,
      price: 5000,
      priceType: PriceType.HOURLY,
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb',
      rating: 5.0,
      reviewCount: 24,
      isActive: true,
    },
  });

  const tutoring2 = await prisma.service.create({
    data: {
      providerId: student1.id,
      type: ServiceType.TUTORING,
      title: 'English Language Tutoring - IELTS Prep',
      description:
        'IELTS preparation and general English language tutoring. Native-level fluency.',
      category: ServiceCategory.ENGLISH,
      price: 4000,
      priceType: PriceType.HOURLY,
      imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d',
      rating: 4.9,
      reviewCount: 15,
      isActive: true,
    },
  });

  const tutoring3 = await prisma.service.create({
    data: {
      providerId: student2.id,
      type: ServiceType.TUTORING,
      title: 'Programming Tutoring - Python, JavaScript',
      description:
        'Learn programming from scratch or advance your skills. Python, JavaScript, React, Node.js.',
      category: ServiceCategory.PROGRAMMING,
      price: 6000,
      priceType: PriceType.HOURLY,
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
      rating: 4.8,
      reviewCount: 20,
      isActive: true,
    },
  });

  console.log('✅ Services created');

  // Create advertisements with current dates
  const now = new Date();
  const adEndDate = new Date(now);
  adEndDate.setDate(adEndDate.getDate() + 30); // Active for 30 days

  const ad1 = await prisma.advertisement.create({
    data: {
      title: 'Kaspi Bank Student Card',
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3',
      linkUrl: 'https://kaspi.kz',
      position: AdPosition.TOP_BANNER,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 1250,
      clicks: 85,
    },
  });

  const ad2 = await prisma.advertisement.create({
    data: {
      title: 'Tech Internship Program',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
      linkUrl: null,
      position: AdPosition.HERO_SLIDE,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 3200,
      clicks: 240,
    },
  });

  const ad3 = await prisma.advertisement.create({
    data: {
      title: 'Coffee Shop - Student Discount',
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348',
      linkUrl: null,
      position: AdPosition.NATIVE_FEED,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 950,
      clicks: 67,
    },
  });

  // Add more HERO_SLIDE ads for testing carousel
  const ad5 = await prisma.advertisement.create({
    data: {
      title: 'Kaspi Bank - Кредит наличными до 10 млн ₸! Получите деньги за 1 день',
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3',
      linkUrl: 'https://kaspi.kz/shop/kredit',
      position: AdPosition.HERO_SLIDE,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 2500,
      clicks: 180,
    },
  });

  const ad6 = await prisma.advertisement.create({
    data: {
      title: 'IT Academy - Стань программистом за 6 месяцев! Гарантия трудоустройства',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
      linkUrl: 'https://itacademy.kz',
      position: AdPosition.HERO_SLIDE,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 1800,
      clicks: 120,
    },
  });

  const ad7 = await prisma.advertisement.create({
    data: {
      title: `Coffee House - Скидка 30% для студентов! Покажите студенческий и получите скидку на все меню`,
      imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
      linkUrl: 'https://www.instagram.com/coffeehouse.almaty',
      position: AdPosition.HERO_SLIDE,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 1600,
      clicks: 95,
    },
  });

  console.log('✅ Advertisements created (including 4 HERO_SLIDE ads)')

  // Create clubs
  const club1 = await prisma.club.create({
    data: {
      name: 'Tech Innovation Club',
      description: 'A community for tech enthusiasts to share ideas, work on projects, and learn about the latest technologies. We organize hackathons, coding workshops, and tech talks.',
      category: ClubCategory.TECH,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      organizerId: organizer.id,
    },
  });

  const club2 = await prisma.club.create({
    data: {
      name: 'Debate Society',
      description: 'Develop your public speaking and critical thinking skills. We participate in regional and national debate competitions.',
      category: ClubCategory.ACADEMIC,
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
      organizerId: admin.id,
    },
  });

  const club3 = await prisma.club.create({
    data: {
      name: 'Photography Club',
      description: 'Capture moments and tell stories through photography. We organize photo walks, exhibitions, and workshops.',
      category: ClubCategory.ARTS,
      imageUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d',
      organizerId: organizer.id,
    },
  });

  const club4 = await prisma.club.create({
    data: {
      name: 'Football Team',
      description: 'Join our university football team! We practice regularly and compete in inter-university tournaments.',
      category: ClubCategory.SPORTS,
      imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55',
      organizerId: admin.id,
    },
  });

  const club5 = await prisma.club.create({
    data: {
      name: 'Volunteer Network',
      description: 'Make a difference in your community. We organize volunteer activities, charity events, and community service projects.',
      category: ClubCategory.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a',
      organizerId: organizer.id,
    },
  });

  const club6 = await prisma.club.create({
    data: {
      name: 'Cultural Exchange',
      description: 'Celebrate diversity and learn about different cultures. We organize cultural nights, language exchange sessions, and international food festivals.',
      category: ClubCategory.CULTURAL,
      imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
      organizerId: admin.id,
    },
  });

  // Add members to clubs
  await prisma.clubMembership.create({
    data: {
      userId: student1.id,
      clubId: club1.id,
      role: 'MEMBER',
    },
  });

  await prisma.clubMembership.create({
    data: {
      userId: student2.id,
      clubId: club1.id,
      role: 'MEMBER',
    },
  });

  await prisma.clubMembership.create({
    data: {
      userId: student1.id,
      clubId: club2.id,
      role: 'MEMBER',
    },
  });

  await prisma.clubMembership.create({
    data: {
      userId: student3.id,
      clubId: club3.id,
      role: 'MEMBER',
    },
  });

  await prisma.clubMembership.create({
    data: {
      userId: student2.id,
      clubId: club4.id,
      role: 'MEMBER',
    },
  });

  await prisma.clubMembership.create({
    data: {
      userId: student1.id,
      clubId: club5.id,
      role: 'MEMBER',
    },
  });

  await prisma.clubMembership.create({
    data: {
      userId: student3.id,
      clubId: club6.id,
      role: 'MEMBER',
    },
  });

  console.log('✅ Clubs created');

  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║   🌱 Database seeded successfully!                           ║
  ║                                                              ║
  ║   Test Accounts:                                             ║
  ║   ────────────────────────────────────────────────────────   ║
  ║   Admin:      admin@kazguu.kz                                ║
  ║   Organizer:  organizer@kazguu.kz                            ║
  ║   Moderator:  moderator@kazguu.kz                            ║
  ║   Student 1:  student1@kazguu.kz                             ║
  ║   Student 2:  student2@kazguu.kz                             ║
  ║   Student 3:  student3@kazguu.kz                             ║
  ║   Partner 1:  partner1@itacademy.kz (IT Academy)             ║
  ║   Partner 2:  partner2@coffeehouse.kz (Coffee House)         ║
  ║                                                              ║
  ║   Password for all: Password123!                             ║
  ║                                                              ║
  ║   Created:                                                   ║
  ║   - 8 Users (1 Admin, 1 Organizer, 1 Moderator,             ║
  ║              3 Students, 2 External Partners)                ║
  ║   - 15 Events (10 free + 2 paid + 2 partner + 1 lecture)     ║
  ║   - 7 Free Registrations                                     ║
  ║   - 6 Paid Tickets (3 platform + 3 partner events)           ║
  ║   - 2 Check-ins (student scan mode)                          ║
  ║   - 6 Services (3 general + 3 tutoring)                      ║
  ║   - 4 Advertisements (various positions)                     ║
  ║   - 6 Clubs (various categories)                             ║
  ║   - 7 Club Memberships                                       ║
  ║                                                              ║
  ║   🤝 External Partners System Ready:                         ║
  ║   - 2 External partners with different commission rates      ║
  ║   - Partner 1: IT Academy (10% commission, 2 paid slots)     ║
  ║   - Partner 2: Coffee House (8% custom rate, 0 paid slots)   ║
  ║   - 2 Partner events created and linked                      ║
  ║   - 3 Tickets with commission tracking:                      ║
  ║     • IT Academy event: 15,000₸ (1,500₸ commission)          ║
  ║     • Coffee House event: 2,500₸ (200₸ commission)           ║
  ║   - Platform settings configured                             ║
  ║                                                              ║
  ║   💰 Monetization Features Ready:                            ║
  ║   - Paid events with tickets                                 ║
  ║   - Commission system for external partners                  ║
  ║   - QR check-in (2 modes)                                    ║
  ║   - Services marketplace                                     ║
  ║   - Advertisement system                                     ║
  ║                                                              ║
  ║   🛡️ Moderation System Ready:                                ║
  ║   - Content moderation queue                                 ║
  ║   - Moderator role with access to /moderator dashboard       ║
  ║   - Validation filters for spam prevention                   ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
