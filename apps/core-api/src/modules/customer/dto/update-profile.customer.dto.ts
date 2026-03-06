import { PickType } from "@nestjs/swagger";
import { CreateUserDto } from "./create.customer.dto";

export class UpdateProfileDto extends PickType(CreateUserDto,['name','mobile', 'email'] as const) {}
