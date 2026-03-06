import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { IsDateTimeValid } from "src/common/request/validation/date-time.validation";
import { FromDateBeforeToDate } from "src/common/request/validation/from-before-to.validation";
import { IsMongoIdValid } from "src/common/request/validation/mongoid.validation";

@FromDateBeforeToDate()
export class CreateActivityDto {

    @ApiProperty({
        type: String,
        example: "672c8834213dca40992852ff",
        required: true
    })
    @IsMongoIdValid()
    @IsString()
    @IsNotEmpty()
    readonly customerId: string;

    @ApiProperty({
        type: String,
        example: "2024-11-11",
        required: true
    })
    @IsDateTimeValid()
    @IsNotEmpty()
    @IsString()
    from: string;

    @ApiProperty({
        type: String,
        example: "2024-11-12",
        required: true
    })
    @IsDateTimeValid()
    @IsNotEmpty()
    @IsString()
    to: string;
}
