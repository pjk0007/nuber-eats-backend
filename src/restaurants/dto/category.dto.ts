import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/core-output.dto';
import { PaginationInput, PaginationOutput } from 'src/common/dto/pagination.dto';
import { Category } from 'src/restaurants/entities/category.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@InputType()
export class CategoryInput extends PaginationInput{
  @Field(() => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field(()=>[Restaurant], {nullable:true})
  restaurants?:Restaurant[]
}
