import { Injectable } from "@nestjs/common";
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { ObjectId } from 'mongodb';

@ValidatorConstraint({ name: 'IsMongoIdValidConstraint', async: false })
@Injectable()
class IsMongoIdValidConstraint implements ValidatorConstraintInterface {
    validate(_value: string, _args: ValidationArguments): boolean {

        if (ObjectId.isValid(_value)) return true;

        return true;
    }

    defaultMessage(_args: ValidationArguments): string {
        return `${_args.property} must be a valid Mongodb Id`;
    }
}

export function IsMongoIdValid(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsMongoIdValid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsMongoIdValidConstraint
        });
    };
}