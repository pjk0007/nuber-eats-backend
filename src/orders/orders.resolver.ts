import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import {
  CreateOrderInput,
  CreateOrderOutput,
} from 'src/orders/dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from 'src/orders/dtos/edit-order.dto';
import { GetOrderInput } from 'src/orders/dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from 'src/orders/dtos/get-orders.dto';
import { Order } from 'src/orders/entities/order.entity';
import { OrderService } from 'src/orders/orders.service';
import { User } from 'src/users/entities/user.entity';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly ordersService: OrderService) {}

  @Mutation(() => CreateOrderOutput)
  @Role(['Client'])
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query(()=>GetOrdersOutput)
  @Role(["Any"])
  getOrders(@AuthUser() user:User, @Args('input') getOrdersInput:GetOrdersInput):Promise<GetOrdersOutput>{
    return this.ordersService.getOrders(user,getOrdersInput)
  }

  @Query(()=>GetOrdersOutput)
  @Role(["Any"])
  getOrder(@AuthUser() user:User, @Args('input') getOrderInput:GetOrderInput):Promise<GetOrdersOutput>{
    return this.ordersService.getOrder(user,getOrderInput)
  }

  @Mutation(()=>EditOrderOutput)
  @Role(["Owner", "Delivery"])
  editOrder(@AuthUser() user:User, @Args('input') editOrderInput:EditOrderInput):Promise<EditOrderOutput>{
    return this.ordersService.editOrder(user, editOrderInput);
  }
}
