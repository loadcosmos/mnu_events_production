import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype, type }: ArgumentMetadata) {
    // Для query параметров удаляем page и limit перед валидацией
    if (type === 'query' && value && (value.page !== undefined || value.limit !== undefined)) {
      const { page, limit, ...rest } = value;
      if (!metatype || !this.toValidate(metatype)) {
        return rest;
      }
      const object = plainToInstance(metatype, rest);
      const errors = await validate(object);
      if (errors.length > 0) {
        const messages = errors.map((err) => {
          return {
            property: err.property,
            constraints: err.constraints,
          };
        });
        throw new BadRequestException({
          message: 'Validation failed',
          errors: messages,
        });
      }
      return rest;
    }
    
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const messages = errors.map((err) => {
        return {
          property: err.property,
          constraints: err.constraints,
        };
      });
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
