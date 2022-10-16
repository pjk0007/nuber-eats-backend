import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/core-output.dto';

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput{
  @Field(() => Int, {nullable:true})
  totalPages?: number;

  @Field(() => Int, {nullable:true})
  totalResults?: number;
}
