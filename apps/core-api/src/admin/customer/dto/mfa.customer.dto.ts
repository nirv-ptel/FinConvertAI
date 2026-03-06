import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { IsMongoIdValid } from "src/common/request/validation/mongoid.validation";


export class EnableMFADto {
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
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    @IsNotEmpty()
    readonly enableMFA: boolean;
}