import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNotEmpty, Matches, IsBoolean, ValidateIf } from "class-validator";
import { Transform } from "class-transformer";

export class CreateCustomerDto {
    @ApiProperty({
        type: String,
        example: "name",
        required: true
    })
    @Matches(/^[A-Za-z\s]+$/, { message: 'name must contain only alphabets' })
    @Transform(({ value }) => value.trim())
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        type: String,
        example: "demo@gmail.com",
        required: true
    })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({
        type: String,
        example: "02 365 9874",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly mobile: string;

    @ApiProperty({
        type: Boolean,
        example: false,
        required: true
    })
    @IsBoolean()
    @IsNotEmpty()
    readonly isResetPassword: boolean;

    @ApiProperty({
        type: String,
        example: "",
        required: false,
        description: "Password is required only if isResetPassword is true"
    })
    @IsString()
    @IsNotEmpty()
    @ValidateIf((o) => o.isResetPassword === true)
    readonly password: string;
}

