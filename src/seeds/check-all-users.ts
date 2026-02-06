import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

async function checkAllUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  console.log('\n📋 ALL Users in Database (including inactive):\n');

  const users = await userRepository.find({
    select: ['id', 'email', 'full_name', 'role', 'workshop_id', 'is_active'],
  });

  if (users.length === 0) {
    console.log('❌ No users found in database');
  } else {
    console.log(`Found ${users.length} users:\n`);
    console.log('┌────────────────────────────────────────────────────────────────────────────────┐');
    users.forEach((user, index) => {
      console.log(`│ #${(index + 1).toString().padEnd(2)} Email: ${user.email.padEnd(35)} │`);
      console.log(`│     Role: ${user.role.padEnd(12)} Active: ${user.is_active ? 'YES' : 'NO '} Workshop: ${(user.workshop_id || 'None').padEnd(15).substring(0, 15)} │`);
      console.log('├────────────────────────────────────────────────────────────────────────────────┤');
    });
    console.log('└────────────────────────────────────────────────────────────────────────────────┘\n');

    const activeUsers = users.filter(u => u.is_active);
    console.log(`Summary: ${activeUsers.length} active users, ${users.length - activeUsers.length} inactive users\n`);
  }

  await app.close();
  process.exit(0);
}

checkAllUsers().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
