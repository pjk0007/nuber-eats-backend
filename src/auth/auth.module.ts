import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[UsersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }], // 모든 resolver에서 AuthGuard 발동
})
export class AuthModule {}
