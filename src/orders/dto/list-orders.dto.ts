import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class ListOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
