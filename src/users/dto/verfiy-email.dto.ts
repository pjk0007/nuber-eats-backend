import { InputType, ObjectType, PickType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dto/core-output.dto";
import { Verification } from "src/users/entities/verification.entity";

@InputType()
export class VerifyEmailInput extends PickType(Verification,["code"]){}

@ObjectType()
export class VerifyEmailOutput extends CoreOutput{}