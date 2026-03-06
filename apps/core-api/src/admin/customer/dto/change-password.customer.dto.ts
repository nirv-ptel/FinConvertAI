import { ApiProperty } from "@nestjs/swagger";
import {  IsNotEmpty, IsString } from "class-validator";
import { IsMongoIdValid } from "src/common/request/validation/mongoid.validation";

export class ChangePasswordDto {
    @ApiProperty({
        type: String,
        example: "66fe9734d4c9c63f1a8c6117",
        required: true
    })
    @IsMongoIdValid()
    @IsString()
    @IsNotEmpty()
    readonly userId: string;

    @ApiProperty({
        type: String,
        example: "password",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    readonly password: string;
}