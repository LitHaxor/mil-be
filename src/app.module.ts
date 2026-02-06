import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { Workshop } from './workshop/entities/workshop.entity';
import { UserUnit } from './user-unit/entities/user-unit.entity';
import { SparePartTemplate } from './spare-part/entities/spare-part-template.entity';
import { Inventory } from './inventory/entities/inventory.entity';
import { ConsumeRequest } from './consume-request/entities/consume-request.entity';
import { SourceRequest } from './source-request/entities/source-request.entity';
import { LogBook } from './log-book/entities/log-book.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { WorkshopModule } from './workshop/workshop.module';
import { UserUnitModule } from './user-unit/user-unit.module';
import { InventoryModule } from './inventory/inventory.module';
import { SparePartModule } from './spare-part/spare-part.module';
import { ConsumeRequestModule } from './consume-request/consume-request.module';
import { SourceRequestModule } from './source-request/source-request.module';
import { LogBookModule } from './log-book/log-book.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          Workshop,
          UserUnit,
          SparePartTemplate,
          Inventory,
          ConsumeRequest,
          SourceRequest,
          LogBook,
          ChatMessage,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    SupabaseModule,
    AuthModule,
    WorkshopModule,
    UserUnitModule,
    InventoryModule,
    SparePartModule,
    ConsumeRequestModule,
    SourceRequestModule,
    LogBookModule,
    ChatModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
