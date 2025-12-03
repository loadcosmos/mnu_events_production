const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceDeleteUser(email) {
    console.log(`Searching for user with email: "${email}"...`);

    // Find user (case insensitive)
    const users = await prisma.user.findMany({
        where: {
            email: {
                equals: email,
                mode: 'insensitive',
            },
        },
    });

    if (users.length === 0) {
        console.log('❌ No user found with this email.');
        return;
    }

    console.log(`Found ${users.length} user(s). Deleting...`);

    for (const user of users) {
        try {
            // Delete related records first if needed (though cascade should handle it)
            // Just to be safe, we delete the user directly
            await prisma.user.delete({
                where: { id: user.id },
            });
            console.log(`✅ Deleted user: ${user.email} (ID: ${user.id})`);
        } catch (error) {
            console.error(`❌ Failed to delete user ${user.id}:`, error);
        }
    }
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address');
    process.exit(1);
}

forceDeleteUser(email)
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
