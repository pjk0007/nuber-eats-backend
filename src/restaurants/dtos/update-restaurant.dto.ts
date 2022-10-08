import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateRestaurantDto } from "src/restaurants/dtos/create-restaurant.dto";

@InputType()
class UpdateRestaurantInputType extends PartialType(CreateRestaurantDto){}

@InputType()
export class UpdateRestaurantDto{

    @Field(type => Number)
    id: number

    @Field(type => UpdateRestaurantInputType)
    data:UpdateRestaurantInputType
}