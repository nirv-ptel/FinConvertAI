import { ApiProperty, PickType } from "@nestjs/swagger";
import { CreateUserDto } from "./create.customer.dto";
import { IsNotEmpty, IsString, Length, Matches, maxLength } from "class-validator";

export class LoginOtpCustomerDto extends PickType(CreateUserDto, ['email'] as const) {

    @ApiProperty({
        type: String,
        example: 'password',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly password: string;

    @ApiProperty({
        type: String,
        example: '123456',
        required: true
    })
    @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
    @Length(6, 6, { message: 'OTP must be exactly 6 digits long' })
    @IsString()
    @IsNotEmpty()
    readonly otp: string;


}
