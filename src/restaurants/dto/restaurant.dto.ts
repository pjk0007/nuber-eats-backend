import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dto/core-output.dto";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";

@InputType()
export class RestaurantInput{
    @Field(()=>Int)
    restaurantId:number;
}

@ObjectType()
export class RestaurantOutput extends CoreOutput{
    @Field(()=>Restaurant, {nullable:true})
    restaurant?:Restaurant
}