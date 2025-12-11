import { PrismaClient, Role, ServiceType, ServiceCategory, PriceType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Real Services Seeding...');

    // 1. Delete ALL existing Services (The "Mock" ones)
    console.log('🗑️  Deleting existing services...');
    await prisma.service.deleteMany({});

    // Optional: Clean up our specific test users if they exist to avoid unique constraint, 
    // or catch error. Simplest is to strict delete them.
    const testEmails = ['aikerim.tutor@kazguu.kz', 'alikhan.english@kazguu.kz', 'dina.design@kazguu.kz'];
    await prisma.user.deleteMany({
        where: { email: { in: testEmails } }
    });

    console.log('✅ Cleaned up old data.');

    // 2. Create Real Students
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // User 1: Aikerim (Math Tutor) - Economy
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

    // User 2: Alikhan (English/Writing) - Translation Studies
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

    // User 3: Dina (Design) - IT
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

    console.log('✅ Created 3 Real Student Profiles');

    // 3. Create Real Services

    // Aikerim's Services
    await prisma.service.create({
        data: {
            providerId: aikerim.id,
            type: ServiceType.TUTORING,
            title: 'Calculus & Linear Algebra Tutoring',
            description: `Struggling with Math? I can help you master Calculus I, II and Linear Algebra. 
      
      I have a GPA of 4.0 in all math courses and 2 years of tutoring experience. 
      We will go through practice problems, homework help, and exam preparation.
      
      Available: Mon-Fri after 16:00.`,
            category: ServiceCategory.MATH,
            price: 3000,
            priceType: PriceType.HOURLY,
            rating: 4.9,
            reviewCount: 15,
            isActive: true,
            imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    });

    await prisma.service.create({
        data: {
            providerId: aikerim.id,
            type: ServiceType.TUTORING,
            title: 'Python for Data Science - Beginner Friendly',
            description: `Learn Python from scratch! Perfect for Economics and Finance students who need it for data analysis.
      
      We will cover:
      - Basic syntax and data structures
      - Pandas and NumPy
      - Data visualization with Matplotlib
      
      No prior coding experience required.`,
            category: ServiceCategory.PROGRAMMING,
            price: 4000,
            priceType: PriceType.HOURLY,
            rating: 5.0,
            reviewCount: 4,
            isActive: true,
            imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    });

    // Alikhan's Services
    await prisma.service.create({
        data: {
            providerId: alikhan.id,
            type: ServiceType.TUTORING,
            title: 'IELTS Preparation - Speaking & Writing Focus',
            description: `Get your target Band score! I scored 8.5 overall (9.0 in Reading/Listening).
      
      I specialize in boosting your Speaking and Writing scores with personalized feedback and mock tests.
      Material included.`,
            category: ServiceCategory.ENGLISH,
            price: 3500,
            priceType: PriceType.HOURLY,
            rating: 4.8,
            reviewCount: 22,
            isActive: true,
            imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    });

    await prisma.service.create({
        data: {
            providerId: alikhan.id,
            type: ServiceType.GENERAL,
            title: 'Academic Essay Editing & Proofreading',
            description: `I will proofread your essays, research papers, and motivation letters.
      
      Service includes:
      - Grammar and spelling check
      - Flow and structure improvement
      - Vocabulary enhancement
      - APA/MLA formatting check
      
      Fast turnaround (24-48 hours).`,
            category: ServiceCategory.COPYWRITING,
            price: 2000, // Per 1000 words logic implies fixed/per-session usually, but let's say "Fixed" base price
            priceType: PriceType.FIXED,
            rating: 4.7,
            reviewCount: 8,
            isActive: true,
            imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    });

    // Dina's Services
    await prisma.service.create({
        data: {
            providerId: dina.id,
            type: ServiceType.GENERAL,
            title: 'Modern PPT Presentation Design',
            description: `Impress your professors and classmates with stunning presentations.
      
      I create clean, modern, and engaging slides for your projects/defense. 
      You provide the text, I provide the visual magic.
      
      Includes: Infographics, custom icons, and animations.`,
            category: ServiceCategory.DESIGN,
            price: 5000,
            priceType: PriceType.PER_SESSION, // Per presentation
            rating: 5.0,
            reviewCount: 3,
            isActive: true,
            imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    });

    console.log('✅ Created 5 Real Services');
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
