import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ValidationError } from 'class-validator';

@Injectable()
export class ErrorService {
    
    extractFirstError(errors: ValidationError[]): string {
        for (const error of errors) {
          if (error.constraints) {
            // Return the first error message
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                error: Object.values(error.constraints)[0],
              }, HttpStatus.NOT_FOUND);
            // return Object.values(error.constraints)[0];
          }
          if (error.children?.length) {
            // Recursively handle nested errors
            return this.extractFirstError(error.children);
          }
        }
        return 'Validation failed'; // Default fallback
      }
}
