import { Field, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dto/core-output.dto";
import { Category } from "src/restaurants/entities/category.entity";

@ObjectType()
export class AllCategoriesOutput extends CoreOutput{
    @Field(()=>[Category], {nullable:true})
    categories?:Category[]
}