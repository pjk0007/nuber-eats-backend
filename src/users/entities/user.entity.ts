import {
  ObjectType,
  Field,
  Int,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEmail, IsEnum } from 'class-validator';

enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsEmail()
  email: string;

  @Field(() => String)
  @Column()
  password: string;

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(aPassword, this.password);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
