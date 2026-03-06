import { ArgumentMetadata, BadRequestException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { Multer } from 'multer';
import { IFileValidationOptions } from '../interface/file.interface';

@Injectable()
export class FilesValidationPipe implements PipeTransform {

  private readonly options: Required<IFileValidationOptions>;

  constructor(options: IFileValidationOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? 1 * 1024 * 1024,
      allowedTypes: options.allowedTypes ?? ['image/jpg'],
      requireFilesInEachField: options.requireFilesInEachField ?? true,
      limit: options.limit ?? 5
    };
  }

  private isSingleFile(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      'fieldname' in value &&
      'originalname' in value &&
      'mimetype' in value &&
      'size' in value
    );
  }

  private getTypeName(mime: string): string {
    const map: Record<string, string> = {
      'image/jpg': 'JPG',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG'
    };
    return map[mime] || mime;
  }

  private validateSingleFile(file: any, _arr?: any[]) {
    const { maxSize, allowedTypes } = this.options;

    // choose KB vs MB
    let limitLabel: string;
    if (maxSize < 1024 * 1024) {
      const kb = Math.round(maxSize / 1024);
      limitLabel = `${kb} KB`;
    } else {
      const mb = Math.round((maxSize / 1024 / 1024) * 10) / 10;
      limitLabel = `${mb} MB`;
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `'${file.originalname}' exceeds ${limitLabel}`,
      );
    }

    if (!allowedTypes.includes(file.mimetype)) {
      const types = allowedTypes.map(t => this.getTypeName(t)).join(', ');
      throw new BadRequestException(
        `'${file.originalname}' must be one of: ${types}`
      );
    }
  }

  transform(value: any | any[], metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `at least one file is required`
      });
    }

    if (Array.isArray(value) && (value.length > this.options.limit)) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `at time '${this.options.limit}' file uploded`
      });
    }

    // 1️⃣ Single-file
    if (this.isSingleFile(value)) {
      this.validateSingleFile(value);
      return value;
    }

    // 2️⃣ Array of files for one field (FilesInterceptor)
    if (Array.isArray(value)) {
      if (this.options.requireFilesInEachField && value.length === 0) {
        throw new BadRequestException(`at least one file is required`);
      }
      // validate each as a single file
      value.forEach((file) => {
        if (!this.isSingleFile(file)) {
          throw new BadRequestException('invalid file in array');
        }
        this.validateSingleFile(file);
      });
      return value;
    }

    return value;
  }
}
