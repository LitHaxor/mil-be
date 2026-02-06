import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

async function checkUserRole() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  console.log('\n📋 Current Users in Database:\n');

  const users = await userRepository.find({
    select: ['id', 'email', 'full_name', 'role', 'is_active'],
  });

  if (users.length === 0) {
    console.log('❌ No users found in database');
  } else {
    console.log('┌─────────────────────────────────────────────────────────────────────────┐');
    users.forEach((user) => {
      console.log(`│ Email: ${user.email.padEnd(30)} │ Role: ${user.role.padEnd(10)} │`);
      console.log(`│ Active: ${user.is_active ? 'Yes' : 'No '}                                                          │`);
      console.log('├─────────────────────────────────────────────────────────────────────────┤');
    });
    console.log('└─────────────────────────────────────────────────────────────────────────┘\n');
  }

  await app.close();
  process.exit(0);
}

checkUserRole().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
