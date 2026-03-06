import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNotEmpty, Matches } from "class-validator";

export class CreateUserDto {
    @ApiProperty({
        type: String,
        example: 'croma',
        required: true
    })
    @Matches(/^[A-Za-z\s]+$/,{ message: 'name must contain only alphabets'})
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        type: String,
        example: 'croma@superadmin.com',
        required: true
    })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    readonly email: string;

    // @IsMobilePhone()
    @ApiProperty({
        type: String,
        example: '77998 84422',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly mobile: string;

    
    @ApiProperty({
        type: String,
        example: "password",
        required: true
    })
    @IsNotEmpty()
    @IsString()
    readonly password: string;
}

