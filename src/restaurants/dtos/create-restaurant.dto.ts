import { InputType, OmitType } from '@nestjs/graphql';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@InputType()
export class CreateRestaurantDto extends OmitType(Restaurant, ["id"], InputType){}
//Restaurant Type은 ObjectType인데 Dto가 InputType이라서 InputType으로 바꿔줌
