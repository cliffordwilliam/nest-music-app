import { PrismaClient } from '@prisma/client';
import { genSalt, hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const salt = await genSalt();
  const password = await hash('Password!123', salt);

  // Seed Users
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@example.com' },
    update: {},
    create: {
      email: 'instructor@example.com',
      name: 'John Doe',
      password,
      role: 'INSTRUCTOR',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Jane Smith',
      password,
      role: 'STUDENT',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password,
      role: 'ADMIN',
    },
  });

  // Seed Course
  const course = await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Beginner Piano Course',
      description:
        'Learn fundamental piano techniques, reading sheet music, and basic chords.',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-04-01'),
      price: 120.0,
      instructorId: instructor.id,
    },
  });

  // Seed Enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: student.id,
      courseId: course.id,
    },
  });

  // Seed Payment
  const payment = await prisma.payment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      amount: 120.0,
      status: 'COMPLETED',
      userId: student.id,
      courseId: course.id,
    },
  });

  console.log({ instructor, student, admin, course, enrollment, payment });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
