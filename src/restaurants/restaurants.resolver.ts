import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from 'src/restaurants/dtos/create-restaurant.dto';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  @Query(returns => [Restaurant]) // type for graphql
  restaurants(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
    // type for typescript
    return [];
  }
  @Mutation(returns => Boolean)
  createRestaurant(
    @Args() crateRestaurantDto:CreateRestaurantDto
  ): boolean {
    console.log(crateRestaurantDto);
    
    return true;
  }
}
