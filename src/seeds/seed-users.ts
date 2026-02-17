import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

// Define test users
const TEST_USERS = [
  {
    email: 'admin@milshop.com',
    password: 'Admin@123',
    full_name: 'Admin User',
    role: UserRole.ADMIN,
  },
  {
    email: 'oc@milshop.com',
    password: 'OC@123',
    full_name: 'Officer in Charge',
    role: UserRole.OC,
  },
  {
    email: 'inspector@milshop.com',
    password: 'Inspector@123',
    full_name: 'Inspector User',
    role: UserRole.INSPECTOR_RI_AND_I,
  },
];

async function seed() {
  console.log('🌱 Starting seed process...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  const supabaseUrl = configService.get<string>('SUPABASE_URL');
  const supabaseServiceKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment');
    console.log('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env file');
    console.log('You can find it in: Supabase Dashboard > Project Settings > API > service_role key\n');
    await app.close();
    process.exit(1);
  }

  // Create Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('📝 Creating users...\n');

  for (const userData of TEST_USERS) {
    try {
      console.log(`Creating ${userData.role}: ${userData.email}`);

      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
          },
        });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists in Supabase, fetching...`);

          // Try to find user by email
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.users?.find((u: any) => u.email === userData.email);

          if (existingUser) {
            // Update or create user in local database
            let localUser = await userRepository.findOne({
              where: { id: existingUser.id },
            });

            if (!localUser) {
              localUser = userRepository.create({
                id: existingUser.id,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                is_active: true,
              });
            } else {
              localUser.role = userData.role;
              localUser.full_name = userData.full_name;
              localUser.is_active = true;
            }

            await userRepository.save(localUser);
            console.log(`  ✅ Updated in local database`);
          }
        } else {
          console.error(`  ❌ Error creating user: ${authError.message}`);
        }
        continue;
      }

      // Create user in local database
      const localUser = userRepository.create({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: true,
      });

      await userRepository.save(localUser);
      console.log(`  ✅ Created successfully`);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✨ Seed completed!\n');
  console.log('📋 Test Users Created:\n');
  console.log('┌─────────────────────────────────────────────────────────┐');
  TEST_USERS.forEach((user) => {
    console.log(`│ Role: ${user.role.padEnd(10)} │ Email: ${user.email.padEnd(22)} │`);
    console.log(`│ Password: ${user.password.padEnd(38)} │`);
    console.log('├─────────────────────────────────────────────────────────┤');
  });
  console.log('└─────────────────────────────────────────────────────────┘\n');

  await app.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
