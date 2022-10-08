import { InputType, Int, Field, PickType, ObjectType } from '@nestjs/graphql';
import { MutationOutput } from 'src/common/dto/mutation-output.dto';
import { User } from 'src/users/entities/user.entity';

@InputType()
export class CreateUserInput extends PickType(User, [
  'email',
  'password',
  'role',
]) {
}

@ObjectType()
export class CreateUserOutput extends MutationOutput{}