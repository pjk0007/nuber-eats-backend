import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/core-output.dto';
import { Payment } from 'src/payments/entities/payment.entity';

@ObjectType()
export class GetPaymentOutput extends CoreOutput {
  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];
}
