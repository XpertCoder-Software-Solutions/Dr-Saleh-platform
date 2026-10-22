import {
  Currency,
  OrderItemType,
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { AuditLogService } from '../audit-logs/audit-log.service';
import type { FawryConfig } from '../config/fawry.config';
import type { PaypalConfig } from '../config/paypal.config';
import type { PaymobConfig } from '../config/paymob.config';
import { createHmac } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReferralsService } from '../referrals/referrals.service';
import { PaymentsService } from './payments.service';

type TestablePaymentsService = {
  applyFawryStatusUpdate(
    payment: ReturnType<typeof createPendingPayment>,
    fawryPayload: Record<string, unknown>,
  ): Promise<ReturnType<typeof createPendingPayment>>;
};

type MockPrismaClient = {
  $transaction: jest.Mock;
  bookFormat: {
    findMany: jest.Mock;
  };
  order: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  orderItem: {
    findMany: jest.Mock;
  };
  payment: {
    update: jest.Mock;
    findUnique: jest.Mock;
  };
  paymentTransaction: {
    upsert: jest.Mock;
  };
  userBook: {
    upsert: jest.Mock;
  };
  userCourse: {
    upsert: jest.Mock;
  };
};

const userId = 'd0b74385-98df-4ec5-985c-2c980d517a4d';
const orderId = '7276a8ca-ef5d-46f4-8539-5291d49d8ae4';
const paymentId = 'af6f1f58-2e57-44cc-b933-8c76399d195b';
const courseId = '87221848-4c30-44f5-bf03-aa5cfcae6741';

const paymobConfig = {
  baseUrl: 'https://accept.paymob.com',
  checkoutUrl: 'https://accept.paymob.com/unifiedcheckout/',
  secretKey: 'sk',
  publicKey: 'pk',
  hmacSecret: 'test-hmac-secret',
  integrationIdCard: '1',
  integrationIdWallet: '2',
  integrationIdApplePay: '3',
  notificationUrl: 'https://api.example.com/api/payments/paymob/webhook',
  redirectionUrl: 'https://example.com/checkout/result',
} as PaymobConfig;

describe('PaymentsService verified payment flow', () => {
  let prisma: MockPrismaClient;
  let service: PaymentsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    const referralsService = {
      rewardReferralAfterFirstPaidOrder: jest.fn(),
    };
    const notificationsService = {
      sendCourseAccessGranted: jest.fn(),
      sendPaymentFailed: jest.fn(),
      sendPaymentSuccess: jest.fn(),
    };
    const auditLogService = {
      logAction: jest.fn(),
    };

    service = new PaymentsService(
      prisma as unknown as PrismaService,
      {} as FawryConfig,
      {} as PaypalConfig,
      paymobConfig,
      referralsService as unknown as ReferralsService,
      notificationsService as unknown as NotificationsService,
      auditLogService as unknown as AuditLogService,
    );
  });

  it('keeps verified provider PAID flow granting course access', async () => {
    const pendingPayment = createPendingPayment();
    const paidPayment = {
      ...pendingPayment,
      paidAt: new Date('2026-06-14T00:00:00.000Z'),
      providerReferenceNumber: '987654321',
      providerStatus: 'PAID',
      status: PaymentStatus.PAID,
    };
    prisma.payment.update.mockResolvedValue(paidPayment);
    prisma.orderItem.findMany.mockResolvedValue([
      {
        itemId: courseId,
        itemType: OrderItemType.COURSE,
      },
    ]);
    prisma.bookFormat.findMany.mockResolvedValue([]);
    prisma.order.findUnique.mockResolvedValue(createNotificationOrder());

    await (
      service as unknown as TestablePaymentsService
    ).applyFawryStatusUpdate(pendingPayment, {
      fawryRefNumber: '987654321',
      merchantRefNumber: 'DS-2026-000001',
      orderStatus: 'PAID',
      paymentTime: '2026-06-14T00:00:00.000Z',
    });

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: paidPayment.paidAt,
      },
    });
    expect(prisma.paymentTransaction.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transactionReference: 'DS-2026-000001' },
      }),
    );
    expect(prisma.userCourse.upsert).toHaveBeenCalledWith({
      where: {
        userId_courseId: {
          courseId,
          userId,
        },
      },
      update: {},
      create: {
        courseId,
        userId,
      },
    });
  });
});

describe('PaymentsService Paymob callback', () => {
  let prisma: MockPrismaClient;
  let service: PaymentsService;

  const transaction = (overrides: Record<string, unknown> = {}) => ({
    id: 1234,
    amount_cents: 50000,
    created_at: '2026-10-14T10:00:00.000000',
    currency: 'EGP',
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 1,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 999, merchant_order_id: 'DS-2026-000001-PAYMOB-X' },
    owner: 77,
    pending: false,
    source_data: { pan: '2346', sub_type: 'MasterCard', type: 'card' },
    success: true,
    ...overrides,
  });

  const sign = (t: ReturnType<typeof transaction>) =>
    createHmac('sha512', paymobConfig.hmacSecret!)
      .update(
        [
          t.amount_cents,
          t.created_at,
          t.currency,
          t.error_occured,
          t.has_parent_transaction,
          t.id,
          t.integration_id,
          t.is_3d_secure,
          t.is_auth,
          t.is_capture,
          t.is_refunded,
          t.is_standalone_payment,
          t.is_voided,
          t.order.id,
          t.owner,
          t.pending,
          t.source_data.pan,
          t.source_data.sub_type,
          t.source_data.type,
          t.success,
        ].join(''),
      )
      .digest('hex');

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PaymentsService(
      prisma as unknown as PrismaService,
      {} as FawryConfig,
      {} as PaypalConfig,
      paymobConfig,
      {
        rewardReferralAfterFirstPaidOrder: jest.fn(),
      } as unknown as ReferralsService,
      {
        sendCourseAccessGranted: jest.fn(),
        sendPaymentFailed: jest.fn(),
        sendPaymentSuccess: jest.fn(),
      } as unknown as NotificationsService,
      { logAction: jest.fn() } as unknown as AuditLogService,
    );
    const pending = {
      ...createPendingPayment(),
      provider: PaymentProvider.PAYMOB,
      method: PaymentMethod.PAYMOB_CHECKOUT,
      merchantRefNumber: 'DS-2026-000001-PAYMOB-X',
    };
    prisma.payment.findUnique.mockResolvedValue(pending);
    prisma.payment.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...pending, ...data }),
    );
    prisma.order.findUnique.mockImplementation(
      ({ select }: { select?: Record<string, unknown> }) =>
        Promise.resolve(
          select?.user === undefined
            ? { totalAmount: new Prisma.Decimal(500), currency: Currency.EGP }
            : createNotificationOrder(),
        ),
    );
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.bookFormat.findMany.mockResolvedValue([]);
  });

  it('rejects a callback with a wrong HMAC', async () => {
    await expect(
      service.handlePaymobWebhook(
        { type: 'TRANSACTION', obj: transaction() },
        'bad',
      ),
    ).rejects.toThrow('Invalid Paymob signature.');
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('marks the order paid on a signed successful callback', async () => {
    const t = transaction();
    await service.handlePaymobWebhook({ type: 'TRANSACTION', obj: t }, sign(t));

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: orderId },
        data: expect.objectContaining({
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
        }) as unknown,
      }),
    );
  });

  it('does not mark paid when the amount does not match the order', async () => {
    const t = transaction({ amount_cents: 100 });
    await service.handlePaymobWebhook({ type: 'TRANSACTION', obj: t }, sign(t));

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
        }) as unknown,
      }),
    );
    expect(prisma.order.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.PAID,
        }) as unknown,
      }),
    );
  });
});

function createPrismaMock(): MockPrismaClient {
  const prisma: MockPrismaClient = {
    $transaction: jest.fn(),
    bookFormat: {
      findMany: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    payment: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    paymentTransaction: {
      upsert: jest.fn(),
    },
    userBook: {
      upsert: jest.fn(),
    },
    userCourse: {
      upsert: jest.fn(),
    },
  };

  prisma.$transaction.mockImplementation(
    async (
      callback: (transactionClient: MockPrismaClient) => Promise<unknown>,
    ) => callback(prisma),
  );

  return prisma;
}

function createPendingPayment() {
  const timestamp = new Date('2026-06-14T00:00:00.000Z');

  return {
    amount: new Prisma.Decimal(500),
    cancelledAt: null,
    createdAt: timestamp,
    currency: Currency.EGP,
    failureReason: null,
    id: paymentId,
    merchantRefNumber: 'DS-2026-000001',
    method: PaymentMethod.FAWRY_REFERENCE,
    orderId,
    paidAt: null,
    paypalOrderId: null,
    provider: PaymentProvider.FAWRY,
    providerPaymentReference: null,
    providerReferenceNumber: null,
    providerResponse: Prisma.JsonNull,
    providerStatus: 'NEW',
    status: PaymentStatus.PENDING,
    updatedAt: timestamp,
    userId,
  };
}

function createNotificationOrder() {
  return {
    currency: Currency.EGP,
    id: orderId,
    items: [
      {
        itemType: OrderItemType.COURSE,
        titleAr: 'دورة اختبار',
        titleEn: 'Test Course',
      },
    ],
    orderNumber: 'DS-2026-000001',
    totalAmount: new Prisma.Decimal(500),
    user: {
      email: 'student@example.com',
      fullName: 'Student Example',
      id: userId,
    },
  };
}

describe('PaymentsService PayPal', () => {
  let prisma: MockPrismaClient;
  let service: PaymentsService;
  type PaypalTestable = {
    applyPaypalStatusUpdate(
      payment: Record<string, unknown>,
      paypalOrder: Record<string, unknown>,
    ): Promise<{ status: PaymentStatus }>;
    buildPaypalCreateOrderRequest(order: Record<string, unknown>): {
      payment_source: {
        paypal: { experience_context: Record<string, string> };
      };
      purchase_units: Array<{
        amount: { currency_code: string; value: string };
      }>;
    };
    findPaypalApprovalUrl(
      links: Array<{ rel: string; href: string }>,
    ): string | undefined;
  };
  const testable = () => service as unknown as PaypalTestable;

  const pending = () => ({
    ...createPendingPayment(),
    amount: new Prisma.Decimal(25),
    currency: Currency.USD,
    provider: PaymentProvider.PAYPAL,
    method: PaymentMethod.PAYPAL_CHECKOUT,
    paypalOrderId: 'PP-ORDER-1',
  });
  const paypalOrder = (captureStatus: string, value = '25.00') => ({
    id: 'PP-ORDER-1',
    status: 'COMPLETED',
    purchase_units: [
      {
        amount: { currency_code: 'USD', value },
        payments: {
          captures: [
            {
              id: 'CAPTURE-1',
              status: captureStatus,
              amount: { currency_code: 'USD', value },
            },
          ],
        },
      },
    ],
  });

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PaymentsService(
      prisma as unknown as PrismaService,
      {} as FawryConfig,
      {
        mode: 'sandbox',
        clientId: 'id',
        clientSecret: 'secret',
        baseUrl: 'https://api-m.sandbox.paypal.com',
        webhookId: undefined,
        returnUrl: 'https://example.com/checkout/result',
        cancelUrl: 'https://example.com/checkout/result',
        brandName: 'Dr. Saleh Abdelkarim',
      },
      paymobConfig,
      {
        rewardReferralAfterFirstPaidOrder: jest.fn(),
      } as unknown as ReferralsService,
      {
        sendCourseAccessGranted: jest.fn(),
        sendPaymentFailed: jest.fn(),
        sendPaymentSuccess: jest.fn(),
      } as unknown as NotificationsService,
      { logAction: jest.fn() } as unknown as AuditLogService,
    );
    prisma.payment.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...pending(), ...data }),
    );
    prisma.order.findUnique.mockImplementation(
      ({ select }: { select?: Record<string, unknown> }) =>
        Promise.resolve(
          select?.user === undefined
            ? { totalAmount: new Prisma.Decimal(25), currency: Currency.USD }
            : { ...createNotificationOrder(), currency: Currency.USD },
        ),
    );
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.bookFormat.findMany.mockResolvedValue([]);
  });

  it('is configured with only the client id and secret', () => {
    expect(service.isPaypalConfigured()).toBe(true);
  });

  it('sends the buyer back to the result page through experience_context', () => {
    const body = testable().buildPaypalCreateOrderRequest({
      id: orderId,
      orderNumber: 'DS-2026-000001',
      totalAmount: new Prisma.Decimal(25),
    });
    const context = body.payment_source.paypal.experience_context;
    expect(context.return_url).toBe(
      `https://example.com/checkout/result?orderId=${orderId}&provider=paypal`,
    );
    expect(context.user_action).toBe('PAY_NOW');
    expect(body.purchase_units[0].amount).toEqual({
      currency_code: 'USD',
      value: '25.00',
    });
    expect(
      testable().findPaypalApprovalUrl([
        { rel: 'self', href: 'https://x/self' },
        { rel: 'payer-action', href: 'https://paypal/approve' },
      ]),
    ).toBe('https://paypal/approve');
  });

  it('marks the order paid on a completed capture of the full amount', async () => {
    const result = await testable().applyPaypalStatusUpdate(
      pending(),
      paypalOrder('COMPLETED'),
    );
    expect(result.status).toBe(PaymentStatus.PAID);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.PAID }) as unknown,
      }),
    );
  });

  it('does not mark paid when the captured amount differs', async () => {
    const result = await testable().applyPaypalStatusUpdate(
      pending(),
      paypalOrder('COMPLETED', '1.00'),
    );
    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(prisma.order.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.PAID }) as unknown,
      }),
    );
  });

  it('keeps a capture held for review pending', async () => {
    const result = await testable().applyPaypalStatusUpdate(
      pending(),
      paypalOrder('PENDING'),
    );
    expect(result.status).toBe(PaymentStatus.PENDING);
  });
});
