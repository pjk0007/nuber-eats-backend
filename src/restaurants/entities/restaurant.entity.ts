import { Field, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@ObjectType()   // Graphql
@Entity()       // Database
export class Restaurant {
  @Field(type => Number)    // Graphql
  @PrimaryGeneratedColumn() // Database
  id: number;

  @Field(type => String)    // Graphql
  @Column()                 // Database
  @IsString()
  @Length(5)
  name: string;

  @Field(type => Boolean, { nullable: true })   // Graphql
  @Column({ default: true })                    // Database
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Field(type => String, {defaultValue:"강남"})  // Graphql
  @Column()                                     // Database
  @IsString()
  address: string;
}
