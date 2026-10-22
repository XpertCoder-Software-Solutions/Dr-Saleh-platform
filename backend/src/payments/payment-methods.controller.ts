import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentMethodsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({
    summary: 'Which payment providers are set up.',
    description:
      'Public. The checkout shows a provider only once its keys are configured on the server.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Payment methods',
        data: { paypal: true, paymob: true },
      },
    },
  })
  methods() {
    return {
      message: 'Payment methods',
      data: {
        paypal: this.paymentsService.isPaypalConfigured(),
        paymob: this.paymentsService.isPaymobConfigured(),
      },
    };
  }
}
