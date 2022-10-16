import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/core-output.dto';
import { PaginationInput, PaginationOutput } from 'src/common/dto/pagination.dto';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@InputType()
export class SearchRestaurantInput extends PaginationInput{
  @Field(() => String)
  query: string;
}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
