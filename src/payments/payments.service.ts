import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from 'src/payments/dto/create-payment.dto';
import { GetPaymentOutput } from 'src/payments/dto/get-payment.dto';
import { Payment } from 'src/payments/entities/payment.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };

      if (restaurant.ownerId !== owner.id)
        return { ok: false, error: 'You are not allowed to do this' };

      restaurant.isPromoted = true;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;

      await this.paymentRepository.save(
        this.paymentRepository.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );

      await this.restaurants.save(restaurant);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create payment' };
    }
  }

  async getPayment(user: User): Promise<GetPaymentOutput> {
    try {
      const payments = await this.paymentRepository.find({
        where: { user: { id: user.id } },
      });

      return { ok: true, payments };
    } catch (error) {
      console.log(error);

      return { ok: false, error: 'Could not load payments' };
    }
  }

  @Interval(2000)
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({
      where: { isPromoted: true, promotedUntil: LessThan(new Date()) },
    });
    console.log(restaurants);
    
    restaurants.forEach(async restaurant => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurants.save(restaurant);
    });
  }
}
