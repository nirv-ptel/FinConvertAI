import { ApiProperty, PickType } from "@nestjs/swagger";
import { CreateUserDto } from "./create.customer.dto";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginCustomerDto extends PickType(CreateUserDto,['email'] as const) {
    
     @ApiProperty({
        type: String,
        example: 'xpandRocks1234',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly password: string;

}
