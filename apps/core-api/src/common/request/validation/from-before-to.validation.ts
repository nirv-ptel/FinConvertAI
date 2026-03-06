import { Injectable } from "@nestjs/common";
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'FromDateBeforeToDate', async: false })
@Injectable()
export class FromBeforeToConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const obj = args.object as any;

    // Check both naming variations
    const from = obj.from ?? obj.fromDate;
    const to = obj.to ?? obj.toDate;

    if (!from || !to) return true; // Skip validation if either is missing

    const fromDate = new Date(from);
    const toDate = new Date(to);

    return !isNaN(fromDate.getTime()) && !isNaN(toDate.getTime()) && fromDate <= toDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = args.object as any;
    const from = obj.from ?? obj.fromDate;
    const to = obj.to ?? obj.toDate;

    return `from (${from}) must be before or equal to to (${to})`;
  }
}

export function FromDateBeforeToDate(validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      name: 'FromDateBeforeToDate',
      target: constructor,
      propertyName: undefined,
      options: validationOptions,
      validator: FromBeforeToConstraint,
    });
  };
}