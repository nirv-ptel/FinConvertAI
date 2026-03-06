import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({
        type: String,
        example: 'oldPassword',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly oldPassword: string;

    @ApiProperty({
        type: String,
        example: 'newPassword',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly newPassword: string;
}