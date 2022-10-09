import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModuleOptions } from 'src/jwt/jwt.interfaces';
import { CONFIG_OPTIONS } from 'src/jwt/jwt.constants';
import { JwtService } from 'src/jwt/jwt.service';

@Module({})
@Global()
export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      exports: [JwtService],
    };
  }
}
