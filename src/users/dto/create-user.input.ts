import { InputType, Int, Field, PickType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/core-output.dto';
import { User } from 'src/users/entities/user.entity';

@InputType()
export class CreateUserInput extends PickType(User, [
  'email',
  'password',
  'role',
]) {
}

@ObjectType()
export class CreateUserOutput extends CoreOutput{}