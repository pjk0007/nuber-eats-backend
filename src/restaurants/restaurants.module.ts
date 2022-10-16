import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CategoryResolver, RestaurantsResolver } from './restaurants.resolver';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Category } from 'src/restaurants/entities/category.entity';
import { CategoryRepository } from 'src/restaurants/repositories/category.repository';
import { TypeOrmExModule } from 'src/typeorm-ex/typeorm-ex.module';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant]),TypeOrmExModule.forCustomRepository([CategoryRepository])],
  providers: [RestaurantsResolver, RestaurantsService,CategoryResolver],
})
export class RestaurantsModule {}
