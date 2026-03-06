import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateAdminDto {

    @ApiProperty({
        type: String,
        example: "repotics@superadmin.com",
        required: true
    })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({
        type: String,
        example: 'admin',
        required: true
    })
    @Matches(/^[A-Za-z\s]+$/, { message: 'name must contain only alphabets' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        type: String,
        example: '9574365038',
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
