import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Verification]), ],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
