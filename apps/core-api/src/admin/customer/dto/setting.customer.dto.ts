import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from "class-validator";

export class UpdateSettingDto {

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    readonly dashExport: boolean;

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    readonly groupExport: boolean;

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    readonly pdf: boolean;

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    readonly excel: boolean;

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    readonly csv: boolean;

    @ApiProperty({
        type: Boolean,
        example: true,
        required: true
    })
    @IsBoolean()
    readonly predictiveAnalytics: boolean;

    @ApiProperty({
        type: Number,
        example: 1,
        required: true
    })
    @IsNumber()
    @IsNotEmpty()
    readonly startOfWeek: number;

}