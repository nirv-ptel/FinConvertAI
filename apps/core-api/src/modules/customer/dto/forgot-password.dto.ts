import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ForgotPasswordDto {

    @ApiProperty({
        type: String,
        example: 'croma@superadmin.com',
        required: true
    })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    readonly email: string;
}