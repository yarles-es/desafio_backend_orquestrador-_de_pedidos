import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Prisma } from '@prisma/client';
import { toDecimal } from 'src/utils/to-decimal';
import { toNormIso4217 } from 'src/utils/to-norm-iso-4217';

type ConvertResult = {
  converted: Prisma.Decimal;
  rate: Prisma.Decimal;
  from: string;
  to: string;
  meta: { provider: string; date?: string; base?: string };
};

type ResponseData = {
  rates: Record<string, number>;
  date: string;
  base: string;
};

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);
  private readonly axios: AxiosInstance;
  private readonly defaultTarget: string;

  constructor() {
    const baseURL =
      process.env.EXCHANGE_API_BASE || 'https://api.frankfurter.dev/v1';
    this.defaultTarget = (process.env.EXCHANGE_TARGET || 'BRL').toUpperCase();

    this.axios = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async convert(
    from: string,
    amount: number | string | Prisma.Decimal,
    to: string = this.defaultTarget,
  ): Promise<ConvertResult> {
    const fromCcy = toNormIso4217(from);
    const toCcy = toNormIso4217(to);

    if (!fromCcy || !toCcy) {
      throw new Error(`Moedas inválidas: from='${from}', to='${to}'`);
    }

    const amt = toDecimal(amount);

    if (amt.lessThan(0)) {
      throw new Error('O valor deve ser >= 0');
    }

    if (fromCcy === toCcy) {
      return {
        converted: amt,
        rate: new Prisma.Decimal(1),
        from: fromCcy,
        to: toCcy,
        meta: { provider: 'frankfurter', date: new Date().toISOString() },
      };
    }

    try {
      const { data } = await this.axios.get<ResponseData>('latest', {
        params: { from: fromCcy, to: toCcy },
      });

      const rateNum = data?.rates?.[toCcy];

      if (rateNum == null) {
        throw new Error(
          `Taxa de câmbio não encontrada para ${fromCcy}->${toCcy}`,
        );
      }

      const rate = toDecimal(rateNum);
      const converted = amt.mul(rate);

      return {
        converted,
        rate,
        from: fromCcy,
        to: toCcy,
        meta: { provider: 'frankfurter', date: data?.date, base: data?.base },
      };
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        this.logger.error(
          `FX convert error ${fromCcy}->${toCcy} amount=${amt.toString()} status=${e.response?.status} data=${JSON.stringify(e.response?.data)}`,
        );
        throw new Error(
          `FX_CONVERT_FAILED:${fromCcy}->${toCcy}:${amt.toString()}:${e.message}`,
        );
      }
      this.logger.error(
        `FX convert unexpected error ${fromCcy}->${toCcy}: ${String(e)}`,
      );
      throw e;
    }
  }
}
