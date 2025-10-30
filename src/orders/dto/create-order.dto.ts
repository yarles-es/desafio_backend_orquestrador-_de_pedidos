import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';

class CustomerDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

class ItemDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(1)
  qty: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  idempotency_key: string;
}
