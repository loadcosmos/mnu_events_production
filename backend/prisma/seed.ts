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
  // Note: deleting valid entities in reverse dependency order
  await prisma.serviceReview.deleteMany({}).catch(() => { }); // Catch if table doesn't exist yet
  await prisma.checkIn.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.advertisement.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.clubMembership.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.externalPartner.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Database cleaned');

  // Create users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Core Platform Users
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

  // 2. Real Service Providers (New additions)
  const aikerim = await prisma.user.create({
    data: {
      email: 'aikerim.tutor@kazguu.kz',
      password: hashedPassword,
      firstName: 'Aikerim',
      lastName: 'Sadvakasova',
      role: Role.STUDENT,
      emailVerified: true,
      faculty: 'Economics',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
      level: 'ACTIVE',
      points: 250
    },
  });

  const alikhan = await prisma.user.create({
    data: {
      email: 'alikhan.english@kazguu.kz',
      password: hashedPassword,
      firstName: 'Alikhan',
      lastName: 'Nurmagambetov',
      role: Role.STUDENT,
      emailVerified: true,
      faculty: 'Translation Studies',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
      level: 'LEADER',
      points: 600
    },
  });

  const dina = await prisma.user.create({
    data: {
      email: 'dina.design@kazguu.kz',
      password: hashedPassword,
      firstName: 'Dina',
      lastName: 'Kamaliyeva',
      role: Role.STUDENT,
      emailVerified: true,
      faculty: 'Information Technology',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
      level: 'NEWCOMER',
      points: 80
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: 'reviewer.student@kazguu.kz',
      password: hashedPassword,
      firstName: 'Sanzhar',
      lastName: 'Kudaibergenov',
      role: Role.STUDENT,
      emailVerified: true,
      faculty: 'Law',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    }
  });

  console.log('✅ Users created (Core + Real Providers)');

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
  const currentYear = new Date().getFullYear();
  const eventYear = currentYear;

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

    // Use a default secret for seeding if not present
    const secret = process.env.PAYMENT_SECRET || 'default-seed-secret';
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
  const partnerTicket1Id = 'ticket-seed-' + Date.now() + '-partner1';
  const partnerQrCode1 = await generateTicketQRCode(partnerTicket1Id, partnerEvent1.id, student1.id);

  const partnerTicket1 = await prisma.ticket.create({
    data: {
      id: partnerTicket1Id,
      eventId: partnerEvent1.id,
      userId: student1.id,
      price: 15000,
      platformFee: 0,
      status: TicketStatus.PAID,
      paymentMethod: 'kaspi',
      transactionId: 'KASPI_TXN_' + Date.now() + '_P1',
      qrCode: partnerQrCode1,
      purchasedAt: new Date(),
      commissionRate: 0.10,
      commissionAmount: 1500,
      partnerAmount: 13500,
      ticketCode: 'TICKET-SEED001',
      commissionPaidByPartner: false,
    },
  });

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
      commissionRate: 0.08,
      commissionAmount: 200,
      partnerAmount: 2300,
      ticketCode: 'TICKET-SEED002',
      commissionPaidByPartner: false,
    },
  });

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
      commissionRate: 0.10,
      commissionAmount: 1500,
      partnerAmount: 13500,
      ticketCode: 'TICKET-SEED003',
      commissionPaidByPartner: true,
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

  // Create REAL SERVICES (Services were replaced here)

  // Aikerim's Service
  const service1 = await prisma.service.create({
    data: {
      providerId: aikerim.id,
      type: ServiceType.TUTORING,
      title: 'Calculus & Linear Algebra Tutoring',
      description: `Struggling with Math? I can help you master Calculus I, II and Linear Algebra. 
      I have a GPA of 4.0 in all math courses and 2 years of tutoring experience.`,
      category: ServiceCategory.MATH,
      price: 3000,
      priceType: PriceType.HOURLY,
      rating: 5.0,
      reviewCount: 1,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    }
  });

  // Alikhan's Service
  const service2 = await prisma.service.create({
    data: {
      providerId: alikhan.id,
      type: ServiceType.TUTORING,
      title: 'IELTS Preparation - Speaking & Writing',
      description: `Get your target Band score! I scored 8.5 overall.`,
      category: ServiceCategory.ENGLISH,
      price: 3500,
      priceType: PriceType.HOURLY,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }
  });

  // Dina's Service
  const service3 = await prisma.service.create({
    data: {
      providerId: dina.id,
      type: ServiceType.GENERAL,
      title: 'Modern PPT Presentation Design',
      description: `I create clean, modern, and engaging slides for your projects/defense.`,
      category: ServiceCategory.DESIGN,
      price: 5000,
      priceType: PriceType.PER_SESSION,
      rating: 0,
      reviewCount: 0,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }
  });

  // Create Review
  await prisma.serviceReview.create({
    data: {
      serviceId: service1.id,
      authorId: reviewer.id,
      rating: 5,
      comment: "Aikerim saved my Calculus grade! She explains everything so clearly. Highly prepared."
    }
  });
  console.log('✅ Created Real Services and Reviews');


  // Create advertisements
  const adEndDate = new Date();
  adEndDate.setDate(adEndDate.getDate() + 30); // Valid for 30 days
  const now = new Date();

  await prisma.advertisement.create({
    data: {
      title: 'Coffee House Promo',
      companyName: 'Coffee House Central',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
      linkUrl: 'https://www.instagram.com/coffeehouse.almaty',
      position: AdPosition.SIDEBAR,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 1250,
      clicks: 84,
    },
  });

  await prisma.advertisement.create({
    data: {
      title: 'IT Academy Bootcamp',
      companyName: 'IT Academy',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998',
      linkUrl: 'https://itacademy.kz',
      position: AdPosition.NATIVE_FEED,
      paymentStatus: PaymentStatus.PAID,
      isActive: true,
      startDate: now,
      endDate: adEndDate,
      impressions: 2500,
      clicks: 142,
    },
  });

  console.log('✅ Advertisements created');

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

  console.log('✅ Clubs created');

  // Add members to clubs
  await prisma.clubMembership.create({
    data: {
      userId: student1.id,
      clubId: club1.id,
      role: 'MEMBER',
    },
  });

  // IMPORTANT: Log all credentials
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║   🌱 Database seeded successfully!                           ║
  ║                                                              ║
  ║   CORE ACCOUNTS:                                             ║
  ║   Admin:        admin@kazguu.kz                              ║
  ║   Organizer:    organizer@kazguu.kz                          ║
  ║   Student 1:    student1@kazguu.kz                           ║
  ║   (Default Pwd: Password123!)                                ║
  ║                                                              ║
  ║   REAL SERVICE PROVIDERS (For Marketplace Testing):          ║
  ║   Aikerim:      aikerim.tutor@kazguu.kz (Math Tutor)         ║
  ║   Alikhan:      alikhan.english@kazguu.kz (English)          ║
  ║   Dina:         dina.design@kazguu.kz (Design)               ║
  ║   Sanzhar:      reviewer.student@kazguu.kz (Reviewer)        ║
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
