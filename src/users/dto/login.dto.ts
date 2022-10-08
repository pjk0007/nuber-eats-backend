import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { MutationOutput } from 'src/common/dto/mutation-output.dto';
import { User } from 'src/users/entities/user.entity';

@InputType()
export class LoginInput extends PickType(User, ["email", "password"]){}

@ObjectType()
export class LoginOutput extends MutationOutput {
  @Field(() => String, {nullable:true})
  token?: string;
}
