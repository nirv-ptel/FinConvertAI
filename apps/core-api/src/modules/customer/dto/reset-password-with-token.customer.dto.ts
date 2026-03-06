import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordWithToken {
    @ApiProperty({
        type: String,
        example: '66f679e6fb1924198bffdaef',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly password: string;

    @ApiProperty({
        type: String,
        example: '3b434b4a8f2512365c37e72aa2c01a9da.c82c5f39bb8e100e56e78c6b4c016a76.ec29b00ad9e0227d2e5',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly token: string;


}