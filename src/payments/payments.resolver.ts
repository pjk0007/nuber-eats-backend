import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from 'src/payments/dto/create-payment.dto';
import { GetPaymentOutput } from 'src/payments/dto/get-payment.dto';
import { Payment } from 'src/payments/entities/payment.entity';
import { PaymentService } from 'src/payments/payments.service';
import { User } from 'src/users/entities/user.entity';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => CreatePaymentOutput)
  @Role(['Owner'])
  createPayment(
    @AuthUser() owner: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    return this.paymentService.createPayment(owner, createPaymentInput);
  }

  @Query(() => GetPaymentOutput)
  @Role(['Owner'])
  getPayment(@AuthUser() user: User): Promise<GetPaymentOutput> {
    return this.paymentService.getPayment(user);
  }
}
