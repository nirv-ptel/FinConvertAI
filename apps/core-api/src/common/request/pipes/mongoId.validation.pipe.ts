import { BadRequestException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectId } from 'mongodb';

@Injectable()
export class MongoIdValidationPipe implements PipeTransform {
  transform(value: string): any {
    if (ObjectId.isValid(value as string)) {
      return value;
    }

    // throw new BadRequestException({
    //   statusCode: HttpStatus.BAD_REQUEST,
    //   message: `invalid MongoDB ID format.`
    // });
    return value
  }
}
