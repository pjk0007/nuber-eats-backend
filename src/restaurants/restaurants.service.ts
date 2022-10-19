import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { CoreOutput } from 'src/common/dto/core-output.dto';
import { AllCategoriesOutput } from 'src/restaurants/dto/all-categories.dto';
import {
  CategoryInput,
  CategoryOutput,
} from 'src/restaurants/dto/category.dto';
import {
  CreateDishInput,
  CreateDishOutput,
} from 'src/restaurants/dto/create-dish.dto';
import {
  DeleteDishInput,
  DeleteDishOutput,
} from 'src/restaurants/dto/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from 'src/restaurants/dto/delete-restaurant.dto';
import {
  EditDishInput,
  EditDishOutput,
} from 'src/restaurants/dto/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from 'src/restaurants/dto/edit-restaurant.dto';
import {
  RestaurantInput,
  RestaurantOutput,
} from 'src/restaurants/dto/restaurant.dto';
import {
  RestaurantsInput,
  RestaurantsOutput,
} from 'src/restaurants/dto/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from 'src/restaurants/dto/search-restaurant.dto';
import { Category } from 'src/restaurants/entities/category.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { CategoryRepository } from 'src/restaurants/repositories/category.repository';
import { User } from 'src/users/entities/user.entity';
import { ILike, Like, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dto/create-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    private readonly categories: CategoryRepository,
  ) {}

  async checkRestaurant(
    owner: User,
    restaurantId: number,
  ): Promise<CoreOutput> {
    const restaurant = await this.restaurants.findOne({
      where: { id: restaurantId },
      loadRelationIds: true,
    });
    if (!restaurant) return { ok: false, error: 'Restaurant not found' };
    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: 'You are not owner of the restaurant',
      };
    }
  }

  async createRestaurant(
    createRestaurantInput: CreateRestaurantInput,
    owner: User,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create restuarant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const { ok, error } = await this.checkRestaurant(
        owner,
        editRestaurantInput.restaurantId,
      );
      if (!ok) return { ok, error };

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const { ok, error } = await this.checkRestaurant(
        owner,
        deleteRestaurantInput.restaurantId,
      );
      if (!ok) return { ok, error };

      await this.restaurants.delete(deleteRestaurantInput.restaurantId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete restaurant' };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find({
        relations: ['restaurants'],
      });
      return {
        ok: true,
        categories,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories',
      };
    }
  }

  countRestaurants(category: Category) {
    return this.restaurants.count({ where: { category: { id: category.id } } });
  }

  async findCategoryBySlug(
    categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug: categoryInput.slug },
      });
      if (!category) return { ok: false, error: 'Category not found' };
      const restaurants = await this.restaurants.find({
        where: { category: { id: category.id } },
        take: 25,
        skip: (categoryInput.page - 1) * 25,
        order: {
          isPromoted: 'DESC',
        },
      });

      const totalResults = await this.countRestaurants(category);
      console.log(restaurants);

      return {
        ok: true,
        category,
        restaurants,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return { ok: false, error: 'Could not load category' };
    }
  }

  async allRestaurants(
    restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        take: 25,
        skip: (restaurantsInput.page - 1) * 25,
        relations: ['menu'],
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 25),
        totalResults,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load restaurants',
      };
    }
  }

  async findRestaurantById(
    restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantInput.restaurantId },
        relations: ['menu'],
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      return { ok: true, restaurant };
    } catch (error) {
      return { ok: false, error: 'Could not find restaurant' };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: { name: ILike(`%${query}%`) },
      });
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return { ok: false, error: 'Could not search for restaurants' };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createDishInput.restaurantId },
      });
      if (!restaurant) return { ok: false, error: 'Restaurant not found' };
      if (owner.id !== restaurant.ownerId)
        return { ok: false, error: "You can't do that" };
      const dish = await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      console.log(dish);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create dish' };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: editDishInput.dishId },
        relations: ['restaurant'],
      });
      if (!dish) return { ok: false, error: 'Dish not found' };
      if (dish.restaurant.ownerId !== owner.id)
        return { ok: false, error: "You can't do that" };
      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit dish' };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: dishId },
        relations: ['restaurant'],
      });
      if (!dish) return { ok: false, error: 'Dish not found' };
      if (dish.restaurant.ownerId !== owner.id)
        return { ok: false, error: "You can't do that" };
      await this.dishes.delete(dishId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete dish' };
    }
  }
}
