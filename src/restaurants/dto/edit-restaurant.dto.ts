import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/core-output.dto';
import { CreateRestaurantInput } from 'src/restaurants/dto/create-restaurant.dto';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
    @Field(()=>Number)
    restaurantId:number;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
