import { ArgsType, Field, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dto/core-output.dto";
import { User } from "src/users/entities/user.entity";


@ArgsType()
export class UserProfileInput{
    @Field(()=>Number)
    userId:number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput{
    @Field(()=>User, {nullable:true})
    user?:User
}