import { PrismaClient, Role, ServiceType, ServiceCategory, PriceType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Real Services Seeding...');

  // 1. Delete ALL existing Services and Reviews
  console.log('🗑️  Deleting existing services...');
  // Note: ServiceReview delete is cascaded by Service delete theoretically, but explicit is good if we could.
  // But ServiceReview type might not exist in the generated client yet! 
  // We should rely on standard deleteMany for services.
  await prisma.service.deleteMany({});

  const testEmails = ['aikerim.tutor@kazguu.kz', 'alikhan.english@kazguu.kz', 'dina.design@kazguu.kz'];
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } }
  });

  console.log('✅ Cleaned up old data.');

  // 2. Create Real Students
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // User 1: Aikerim (Math Tutor)
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

  // User 2: Alikhan (English/Writing)
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

  // User 3: Dina (Design)
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

  // Reviewer User
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


  console.log('✅ Created Real Student Profiles');

  // 3. Create Real Services

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

  // Add Review for Service 1 using the 'reviews' relation if Client was updated, 
  // but since we are running this script *before* the client might be fully regenerated in some envs, 
  // we can use the explicit model creation if we were sure. 
  // For now, let's assuming `prisma.serviceReview` exists by the time likely.
  // Actually, we need to use `prisma.serviceReview.create` BUT TypeScript might complain if types aren't generated.
  // Use `any` cast to avoid TS build errors during the seed run if types are stale.

  const prismaAny = prisma as any;

  if (prismaAny.serviceReview) {
    await prismaAny.serviceReview.create({
      data: {
        serviceId: service1.id,
        authorId: reviewer.id,
        rating: 5,
        comment: "Aikerim saved my Calculus grade! She explains everything so clearly. Highly prepared."
      }
    });
    console.log('✅ Added review for Service 1');
  }


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

  console.log('✅ Created Real Services');
  console.log('🚀 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
