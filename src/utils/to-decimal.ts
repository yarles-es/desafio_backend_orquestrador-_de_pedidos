import { Prisma } from '@prisma/client';

export function toDecimal(n: number | string | Prisma.Decimal) {
  return n instanceof Prisma.Decimal ? n : new Prisma.Decimal(n ?? 0);
}
