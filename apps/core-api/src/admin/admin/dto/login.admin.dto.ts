import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginAdminDto {

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
        example: "password",
        required: true
    })
    @IsNotEmpty()
    @IsString()
    readonly password: string;

}
