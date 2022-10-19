import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/core-output.dto';
import { Payment } from 'src/payments/entities/payment.entity';

@InputType()
export class CreatePaymentInput extends PickType(Payment, [
  'transactionId',
  'restaurantId',
]) {}

@ObjectType()
export class CreatePaymentOutput extends CoreOutput {}
