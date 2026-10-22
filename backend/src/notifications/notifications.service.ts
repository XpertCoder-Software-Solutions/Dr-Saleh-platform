import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { redactSensitiveText } from '../common/utils/safe-logging';
import { BrevoEmailService } from '../email/brevo-email.service';
import { PrismaService } from '../database/prisma.service';
import {
  NOTIFICATIONS_QUEUE,
  SEND_NOTIFICATION_JOB,
} from './notifications.constants';
import { NotificationJobData } from './notification-job.types';
import {
  EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES,
  PASSWORD_RESET_OTP_EXPIRY_MINUTES,
} from '../auth/constants/email-verification.constants';
import {
  BuiltNotificationEmail,
  EmailBlock,
  EmailInvoice,
  EmailTone,
  buildNotificationEmailTemplate,
} from './templates/notification-email.template';

const WHATSAPP_URL = 'https://wa.me/201025733523';

type NotificationDispatchOptions = {
  critical?: boolean;
};

type RecipientNotificationInput = {
  userId?: string | null;
  email: string;
  fullName?: string;
};

type OtpNotificationInput = RecipientNotificationInput & {
  otp: string;
};

/** One line of an order, as stored on the order (prices already in the order currency). */
export type NotificationOrderItem = {
  /** COURSE, BOOK or PRODUCT. */
  itemType: string;
  titleAr: string;
  quantity: number;
  unitPrice: number | string;
  discountPrice?: number | string | null;
  totalPrice: number | string;
};

type OrderNotificationInput = RecipientNotificationInput & {
  orderId?: string;
  orderNumber: string;
  totalAmount: number | string;
  currency: string;
  /** With these the email carries the full invoice; without them, a short summary. */
  items?: NotificationOrderItem[];
  subtotal?: number | string;
  discountAmount?: number | string;
  shippingCost?: number | string;
  createdAt?: Date;
  paidAt?: Date | null;
  paymentMethod?: string | null;
  shippingAddress?: string | null;
};

type PaymentNotificationInput = OrderNotificationInput & {
  failureReason?: string | null;
};

type CourseNotificationInput = RecipientNotificationInput & {
  courseId?: string;
  /** Course completed: whether a certificate was issued. */
  hasCertificate?: boolean;
  courseTitleAr: string;
  courseTitleEn?: string | null;
};

type ConsultationNotificationInput = RecipientNotificationInput & {
  topic?: string | null;
};

type ContactNotificationInput = RecipientNotificationInput;

type NotificationTemplateInput = {
  subject: string;
  preheader?: string;
  badge?: string;
  tone?: EmailTone;
  title: string;
  greeting?: string;
  blocks: EmailBlock[];
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  footerNote?: string;
};

type AdminNotificationQuery = {
  type?: NotificationType;
  status?: NotificationStatus;
  email?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly brandName: string;
  private readonly logoUrl: string;
  private readonly platformUrl: string;
  private readonly supportEmail: string;
  private readonly adminNotificationEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly brevoEmailService: BrevoEmailService,
    private readonly configService: ConfigService,
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<NotificationJobData>,
  ) {
    this.brandName = this.configService.getOrThrow<string>('BRAND_NAME');
    this.platformUrl =
      this.configService.getOrThrow<string>('APP_PLATFORM_URL');
    this.logoUrl = this.buildPublicUrl(
      this.configService.getOrThrow<string>('APP_PUBLIC_URL'),
      this.configService.getOrThrow<string>('BRAND_LOGO_PATH'),
    );
    this.supportEmail = this.normalizeEmail(
      this.configService.getOrThrow<string>('SUPPORT_EMAIL'),
    );
    this.adminNotificationEmail = this.normalizeEmail(
      this.configService.get<string>('ADMIN_NOTIFICATION_EMAIL') ||
        this.supportEmail,
    );
  }

  sendEmailVerificationOtp(
    input: OtpNotificationInput,
    options: NotificationDispatchOptions = {},
  ) {
    return this.dispatch(
      NotificationType.EMAIL_VERIFICATION_OTP,
      input,
      this.buildEmailVerificationOtp(input),
      options,
    );
  }

  sendPasswordResetOtp(
    input: OtpNotificationInput,
    options: NotificationDispatchOptions = {},
  ) {
    return this.dispatch(
      NotificationType.PASSWORD_RESET_OTP,
      input,
      this.buildPasswordResetOtp(input),
      options,
    );
  }

  sendPasswordChanged(input: RecipientNotificationInput) {
    return this.dispatch(
      NotificationType.PASSWORD_CHANGED,
      input,
      this.buildPasswordChanged(input),
    );
  }

  sendOrderCreated(input: OrderNotificationInput) {
    return this.dispatch(
      NotificationType.ORDER_CREATED,
      input,
      this.buildOrderCreated(input),
    );
  }

  sendPaymentSuccess(input: OrderNotificationInput) {
    return this.dispatch(
      NotificationType.PAYMENT_SUCCESS,
      input,
      this.buildPaymentSuccess(input),
    );
  }

  sendPaymentFailed(input: PaymentNotificationInput) {
    return this.dispatch(
      NotificationType.PAYMENT_FAILED,
      input,
      this.buildPaymentFailed(input),
    );
  }

  sendRefundProcessed(input: OrderNotificationInput) {
    return this.dispatch(
      NotificationType.REFUND_PROCESSED,
      input,
      this.buildRefundProcessed(input),
    );
  }

  sendCourseAccessGranted(input: CourseNotificationInput) {
    return this.dispatch(
      NotificationType.COURSE_ACCESS_GRANTED,
      input,
      this.buildCourseAccessGranted(input),
    );
  }

  sendCourseCompleted(input: CourseNotificationInput) {
    return this.dispatch(
      NotificationType.COURSE_COMPLETED,
      input,
      this.buildCourseCompleted(input),
    );
  }

  sendConsultationRequestSubmitted(input: ConsultationNotificationInput) {
    return this.dispatch(
      NotificationType.CONSULTATION_REQUEST_SUBMITTED,
      input,
      this.buildConsultationSubmitted(input),
    );
  }

  sendAdminConsultationRequestSubmitted(
    input: ConsultationNotificationInput & { requesterEmail: string },
  ) {
    return this.dispatch(
      NotificationType.CONSULTATION_REQUEST_ADMIN,
      {
        email: this.adminNotificationEmail,
        fullName: this.brandName,
      },
      this.buildAdminConsultationSubmitted(input),
    );
  }

  sendContactMessageReceived(input: ContactNotificationInput) {
    return this.dispatch(
      NotificationType.CONTACT_MESSAGE_RECEIVED,
      input,
      this.buildContactMessageReceived(input),
    );
  }

  async sendQueuedNotification(data: NotificationJobData): Promise<void> {
    try {
      await this.brevoEmailService.sendTransactionalEmail({
        toEmail: data.email,
        toName: data.toName,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
      });

      await this.prisma.notificationLog.update({
        where: { id: data.logId },
        data: {
          status: NotificationStatus.SENT,
          errorMessage: null,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const safeMessage = this.toSafeErrorMessage(error);

      await this.safeMarkLogFailed(data.logId, safeMessage);
      this.logger.error(
        [
          'Notification delivery failed',
          `logId=${data.logId}`,
          `type=${data.type}`,
          `email=${this.maskEmail(data.email)}`,
          `message=${safeMessage}`,
        ].join(' '),
      );

      throw error;
    }
  }

  async findLogs(query: AdminNotificationQuery) {
    const where = this.buildLogWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          email: true,
          type: true,
          status: true,
          errorMessage: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      message: 'Notification logs returned successfully',
      data: {
        items: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  private async dispatch(
    type: NotificationType,
    recipient: RecipientNotificationInput,
    template: NotificationTemplateInput,
    options: NotificationDispatchOptions = {},
  ) {
    const email = this.normalizeEmail(recipient.email);
    const builtTemplate = this.buildEmail(template);
    const log = await this.createPendingLog({
      userId: recipient.userId,
      email,
      type,
      critical: options.critical,
    });

    if (!log) {
      return null;
    }

    try {
      await this.notificationsQueue.add(
        SEND_NOTIFICATION_JOB,
        {
          logId: log.id,
          type,
          email,
          toName: recipient.fullName,
          subject: template.subject,
          htmlContent: builtTemplate.htmlContent,
          textContent: builtTemplate.textContent,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 30_000,
          },
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      );

      return log;
    } catch (error) {
      const safeMessage = this.toSafeErrorMessage(error);

      await this.safeMarkLogFailed(log.id, safeMessage);
      this.logger.warn(
        [
          'Notification enqueue failed',
          `logId=${log.id}`,
          `type=${type}`,
          `email=${this.maskEmail(email)}`,
          `message=${safeMessage}`,
        ].join(' '),
      );

      if (options.critical) {
        throw new ServiceUnavailableException(
          'Notification could not be queued. Please try again later.',
        );
      }

      return log;
    }
  }

  private async createPendingLog({
    userId,
    email,
    type,
    critical,
  }: {
    userId?: string | null;
    email: string;
    type: NotificationType;
    critical?: boolean;
  }) {
    try {
      return await this.prisma.notificationLog.create({
        data: {
          userId: userId ?? undefined,
          email,
          type,
          status: NotificationStatus.PENDING,
        },
      });
    } catch (error) {
      const safeMessage = this.toSafeErrorMessage(error);

      this.logger.warn(
        [
          'Notification log creation failed',
          `type=${type}`,
          `email=${this.maskEmail(email)}`,
          `message=${safeMessage}`,
        ].join(' '),
      );

      if (critical) {
        throw new ServiceUnavailableException(
          'Notification could not be logged. Please try again later.',
        );
      }

      return null;
    }
  }

  private async markLogFailed(logId: string, errorMessage: string) {
    await this.prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: NotificationStatus.FAILED,
        errorMessage,
      },
    });
  }

  private async safeMarkLogFailed(
    logId: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.markLogFailed(logId, errorMessage);
    } catch (error) {
      this.logger.warn(
        [
          'Notification failure status update failed',
          `logId=${logId}`,
          `message=${this.toSafeErrorMessage(error)}`,
        ].join(' '),
      );
    }
  }

  private buildEmail(input: NotificationTemplateInput): BuiltNotificationEmail {
    return buildNotificationEmailTemplate({
      brandName: this.brandName,
      logoUrl: this.logoUrl,
      platformUrl: this.platformUrl,
      supportEmail: this.supportEmail,
      whatsappUrl: WHATSAPP_URL,
      preheader: input.preheader,
      badge: input.badge,
      tone: input.tone,
      title: input.title,
      greeting: input.greeting,
      blocks: input.blocks,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      secondaryLabel: input.secondaryLabel,
      secondaryUrl: input.secondaryUrl,
      footerNote: input.footerNote,
    });
  }

  private url(path: string): string {
    return `${this.platformUrl.replace(/\/+$/, '')}${path}`;
  }

  private buildEmailVerificationOtp(
    input: OtpNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: `${input.otp} كود تفعيل حسابك`,
      preheader: `كود التفعيل: ${input.otp} — صالح ${EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES} دقايق`,
      badge: 'تفعيل الحساب',
      title: 'خطوة واحدة وحسابك يبقى جاهز',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'اكتب الكود ده في صفحة التفعيل عشان نتأكد إن الإيميل ده بتاعك:',
        },
        {
          type: 'code',
          code: input.otp,
          caption: `الكود صالح لمدة ${EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES} دقايق`,
        },
        {
          type: 'note',
          tone: 'info',
          text: 'متشاركش الكود ده مع أي حد، حتى لو قال إنه من فريق المنصة.',
        },
      ],
      footerNote:
        'لو مش انت اللي عملت الحساب ده، تجاهل الرسالة ومفيش حاجة هتحصل.',
    };
  }

  private buildPasswordResetOtp(
    input: OtpNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: `${input.otp} كود تغيير كلمة المرور`,
      preheader: `كود تغيير كلمة المرور: ${input.otp}`,
      badge: 'كلمة المرور',
      title: 'نسيت كلمة المرور؟ ولا يهمك',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'اكتب الكود ده في صفحة استرجاع كلمة المرور، وبعدها اختار كلمة مرور جديدة:',
        },
        {
          type: 'code',
          code: input.otp,
          caption: `الكود صالح لمدة ${PASSWORD_RESET_OTP_EXPIRY_MINUTES} دقايق`,
        },
      ],
      footerNote:
        'لو مش انت اللي طلبت تغيير كلمة المرور، تجاهل الرسالة وحسابك هيفضل زي ما هو.',
    };
  }

  private buildPasswordChanged(
    input: RecipientNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: 'كلمة المرور بتاعتك اتغيّرت',
      preheader: 'تأكيد تغيير كلمة المرور لحسابك',
      badge: 'أمان الحساب',
      tone: 'success',
      title: 'كلمة المرور اتغيّرت بنجاح',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'بنأكدلك إن كلمة مرور حسابك على المنصة اتغيّرت دلوقتي.',
        },
        {
          type: 'note',
          tone: 'danger',
          text: 'لو مش انت اللي غيّرتها، كلّمنا فورًا وغيّر كلمة المرور من "نسيت كلمة المرور".',
        },
      ],
      ctaLabel: 'الدخول لحسابي',
      ctaUrl: this.url('/login'),
    };
  }

  private buildOrderCreated(
    input: OrderNotificationInput,
  ): NotificationTemplateInput {
    const invoice = this.buildInvoice(input, 'في انتظار الدفع');
    return {
      subject: `طلبك رقم ${input.orderNumber} اتسجّل`,
      preheader: `الإجمالي ${this.formatAmount(input.totalAmount, input.currency)} — كمّل الدفع في أي وقت`,
      badge: 'طلب جديد',
      title: 'طلبك اتسجّل',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'شكرًا إنك اخترت المنصة! طلبك محفوظ، ولما الدفع يتم هيوصلك إيميل بالفاتورة النهائية.',
        },
        invoice
          ? { type: 'invoice', invoice }
          : {
              type: 'details',
              rows: [
                ['رقم الطلب', input.orderNumber],
                [
                  'الإجمالي',
                  this.formatAmount(input.totalAmount, input.currency),
                ],
              ],
            },
      ],
      ctaLabel: 'كمّل الدفع',
      ctaUrl: input.orderId
        ? this.url(`/checkout/pay/${input.orderId}`)
        : this.url('/account/orders'),
      secondaryLabel: 'طلباتي',
      secondaryUrl: this.url('/account/orders'),
    };
  }

  private buildPaymentSuccess(
    input: OrderNotificationInput,
  ): NotificationTemplateInput {
    const invoice = this.buildInvoice(input, 'مدفوعة');
    const items = input.items ?? [];
    const hasCourse = items.some((i) => i.itemType === 'COURSE');
    const blocks: EmailBlock[] = [
      {
        type: 'text',
        text: 'الدفع تم بنجاح، وده إيصال طلبك. احتفظ بالإيميل ده كفاتورة.',
      },
      invoice
        ? { type: 'invoice', invoice }
        : {
            type: 'details',
            rows: [
              ['رقم الطلب', input.orderNumber],
              [
                'المبلغ المدفوع',
                this.formatAmount(input.totalAmount, input.currency),
              ],
            ],
          },
    ];
    if (input.shippingAddress) {
      blocks.push({
        type: 'note',
        tone: 'info',
        text: 'المنتجات الورقية بتتجهّز وهتوصلك خلال 2 لـ 4 أيام عمل، وهنبعتلك رقم الشحنة أول ما تخرج.',
      });
    }
    if (hasCourse || items.length === 0) {
      blocks.push({
        type: 'note',
        tone: 'success',
        text: 'الدورات والنسخ الرقمية اتفتحت في حسابك دلوقتي، تقدر تبدأ على طول.',
      });
    }
    return {
      subject: `تم الدفع ✓ فاتورة طلبك ${input.orderNumber}`,
      preheader: `دفعت ${this.formatAmount(input.totalAmount, input.currency)} — الفاتورة جوه`,
      badge: 'تم الدفع',
      tone: 'success',
      title: 'شكرًا! طلبك اتأكد',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks,
      ctaLabel: hasCourse ? 'ابدأ التعلّم' : 'الذهاب لحسابي',
      ctaUrl: hasCourse ? this.url('/account/courses') : this.url('/account'),
      secondaryLabel: input.orderId ? 'طباعة الفاتورة' : undefined,
      secondaryUrl: input.orderId
        ? this.url(`/invoice/${input.orderId}`)
        : undefined,
    };
  }

  private buildPaymentFailed(
    input: PaymentNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: `الدفع ما كملش لطلب ${input.orderNumber}`,
      preheader:
        'طلبك لسه محفوظ، وتقدر تجرّب تاني بنفس الطريقة أو بطريقة تانية',
      badge: 'الدفع ما كملش',
      tone: 'danger',
      title: 'حصلت مشكلة في الدفع',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'متقلقش، طلبك لسه محفوظ. ولو ظهر خصم مؤقت على حسابك، البنك بيرجّعه تلقائيًا.',
        },
        {
          type: 'details',
          rows: [
            ['رقم الطلب', input.orderNumber],
            ['المبلغ', this.formatAmount(input.totalAmount, input.currency)],
            [
              'السبب',
              input.failureReason
                ? redactSensitiveText(input.failureReason)
                : '',
            ],
          ],
        },
        {
          type: 'text',
          muted: true,
          text: 'جرّب تاني بنفس الطريقة، أو اختار طريقة دفع تانية (كارت، محفظة، Apple Pay أو PayPal).',
        },
      ],
      ctaLabel: 'جرّب الدفع تاني',
      ctaUrl: input.orderId
        ? this.url(`/checkout/pay/${input.orderId}`)
        : this.url('/account/orders'),
    };
  }

  private buildRefundProcessed(
    input: OrderNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: `المبلغ اترد لطلب ${input.orderNumber}`,
      preheader: `رجّعنالك ${this.formatAmount(input.totalAmount, input.currency)}`,
      badge: 'استرداد',
      tone: 'info',
      title: 'فلوسك في الطريق ليك',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'رجّعنا مبلغ الطلب ده لنفس طريقة الدفع اللي استخدمتها.',
        },
        {
          type: 'details',
          rows: [
            ['رقم الطلب', input.orderNumber],
            ['المبلغ', this.formatAmount(input.totalAmount, input.currency)],
          ],
        },
        {
          type: 'note',
          tone: 'info',
          text: 'المبلغ بيظهر عادةً خلال 7 لـ 14 يوم عمل حسب البنك أو المحفظة.',
        },
      ],
      ctaLabel: 'طلباتي',
      ctaUrl: this.url('/account/orders'),
    };
  }

  private buildCourseAccessGranted(
    input: CourseNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: `دورة «${input.courseTitleAr}» اتفتحت في حسابك`,
      preheader: 'ابدأ أول درس دلوقتي من أي جهاز',
      badge: 'دورة جديدة',
      tone: 'success',
      title: `«${input.courseTitleAr}» بقت في حسابك`,
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'مبروك! الدورة اتفتحت ليك بالكامل. شوية حاجات هتساعدك تستفيد منها:',
        },
        {
          type: 'list',
          items: [
            'اتفرج من الموبايل أو الكمبيوتر، والمنصة بتفتكر وقفت فين.',
            'خلّص كل درس للآخر عشان يتحسب ضمن تقدّمك.',
            'أول ما تخلّص الدورة، شهادتك بتطلع تلقائيًا في حسابك.',
          ],
        },
      ],
      ctaLabel: 'ابدأ الدورة',
      ctaUrl: input.courseId
        ? this.url(`/learn/${input.courseId}`)
        : this.url('/account/courses'),
    };
  }

  private buildCourseCompleted(
    input: CourseNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: `مبروك! خلّصت دورة «${input.courseTitleAr}»`,
      preheader: input.hasCertificate
        ? 'شهادتك جاهزة في حسابك'
        : 'خطوة جديدة في رحلتك مع ولادك',
      badge: 'مبروك',
      tone: 'success',
      title: 'خلّصت الدورة… برافو عليك!',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: `خلّصت كل دروس «${input.courseTitleAr}». ده مجهود يستاهل نحتفل بيه.`,
        },
        input.hasCertificate
          ? {
              type: 'note',
              tone: 'success',
              text: 'شهادة الإتمام بتاعتك جاهزة في حسابك، وليها رقم أي حد يقدر يتحقق منه.',
            }
          : {
              type: 'text',
              text: 'تقدر ترجع لأي درس في أي وقت من صفحة دوراتي.',
            },
      ],
      ctaLabel: input.hasCertificate ? 'شهاداتي' : 'دوراتي',
      ctaUrl: this.url(
        input.hasCertificate ? '/account/certificates' : '/account/courses',
      ),
      secondaryLabel: 'دورات تانية',
      secondaryUrl: this.url('/courses'),
    };
  }

  private buildConsultationSubmitted(
    input: ConsultationNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: 'وصلنا طلب الاستشارة بتاعك',
      preheader: 'هنتواصل معاك على واتساب عشان نحدد الميعاد',
      badge: 'استشارة',
      title: 'طلبك وصل للدكتور صالح',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'details',
          rows: [['موضوع الاستشارة', input.topic ?? '']],
        },
        { type: 'text', text: 'الخطوات الجاية:' },
        {
          type: 'list',
          items: [
            'فريقنا بيراجع طلبك.',
            'هنكلّمك على واتساب نحدد الميعاد المناسب ليك.',
            'لو الجلسة أونلاين، اللينك بيوصلك قبل الميعاد.',
          ],
        },
        {
          type: 'text',
          muted: true,
          text: 'كل اللي كتبته في الطلب سري ومحدش بيطّلع عليه غير الدكتور والفريق المسؤول عن المواعيد.',
        },
      ],
      ctaLabel: 'استشاراتي',
      ctaUrl: this.url('/account/consultations'),
    };
  }

  private buildAdminConsultationSubmitted(
    input: ConsultationNotificationInput & { requesterEmail: string },
  ): NotificationTemplateInput {
    return {
      subject: `طلب استشارة جديد من ${input.fullName ?? 'زائر'}`,
      badge: 'لوحة التحكم',
      title: 'طلب استشارة جديد',
      blocks: [
        {
          type: 'details',
          rows: [
            ['الاسم', input.fullName ?? 'زائر المنصة'],
            ['الإيميل', input.requesterEmail],
            ['الموضوع', input.topic ?? ''],
          ],
        },
      ],
      ctaLabel: 'فتح الطلبات',
      ctaUrl: this.url('/admin/consult-requests'),
    };
  }

  private buildContactMessageReceived(
    input: ContactNotificationInput,
  ): NotificationTemplateInput {
    return {
      subject: 'رسالتك وصلتنا',
      preheader: 'هنرد عليك في أقرب وقت',
      badge: 'تواصل معنا',
      title: 'شكرًا إنك كلّمتنا',
      greeting: this.buildArabicGreeting(input.fullName),
      blocks: [
        {
          type: 'text',
          text: 'رسالتك وصلت لفريقنا، وهنرد عليك في أقرب وقت (عادةً خلال يوم عمل).',
        },
        {
          type: 'text',
          muted: true,
          text: 'لو الموضوع مستعجل، كلّمنا على واتساب من اللينك اللي تحت.',
        },
      ],
      ctaLabel: 'تصفّح الدورات',
      ctaUrl: this.url('/courses'),
    };
  }

  /** Full invoice when the order lines came with the notification. */
  private buildInvoice(
    input: OrderNotificationInput,
    status: string,
  ): EmailInvoice | undefined {
    if (!input.items?.length) return undefined;
    const money = (v: number | string | null | undefined) =>
      this.formatAmount(v ?? 0, input.currency);
    const num = (v: number | string | null | undefined) =>
      typeof v === 'number' ? v : Number.parseFloat(v ?? '0') || 0;
    const kind: Record<string, string> = {
      COURSE: 'دورة',
      BOOK: 'كتاب',
      PRODUCT: 'منتج',
    };
    return {
      number: input.orderNumber,
      date: this.formatDate(input.paidAt ?? input.createdAt ?? new Date()),
      status,
      paymentMethod: input.paymentMethod ?? undefined,
      lines: input.items.map((item) => ({
        title: item.titleAr,
        kind: kind[item.itemType],
        quantity: item.quantity,
        unitPrice: money(item.discountPrice ?? item.unitPrice),
        total: money(item.totalPrice),
      })),
      subtotal: money(input.subtotal ?? input.totalAmount),
      discount:
        num(input.discountAmount) > 0 ? money(input.discountAmount) : undefined,
      shipping:
        num(input.shippingCost) > 0 ? money(input.shippingCost) : undefined,
      total: money(input.totalAmount),
      shippingAddress: input.shippingAddress ?? undefined,
    };
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Cairo',
    }).format(date);
  }

  private buildLogWhere(
    query: AdminNotificationQuery,
  ): Prisma.NotificationLogWhereInput {
    const where: Prisma.NotificationLogWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.email) {
      where.email = {
        contains: this.normalizeEmail(query.email),
        mode: 'insensitive',
      };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: query.dateFrom } : {}),
        ...(query.dateTo ? { lte: query.dateTo } : {}),
      };
    }

    return where;
  }

  private buildArabicGreeting(fullName?: string): string | undefined {
    const firstName = fullName?.trim().split(/\s+/)[0];
    return firstName ? `أهلًا يا ${firstName}،` : 'أهلًا بيك،';
  }

  private formatAmount(amount: number | string, currency: string): string {
    const numericAmount =
      typeof amount === 'number' ? amount : Number.parseFloat(amount);

    if (!Number.isFinite(numericAmount)) {
      return `${amount} ${currency}`;
    }

    const fixed = numericAmount.toFixed(2).replace(/\.00$/, '');
    if (currency === 'EGP') return `${fixed} ج.م`;
    if (currency === 'USD') return `$${numericAmount.toFixed(2)}`;
    return `${fixed} ${currency}`;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');

    if (!localPart || !domain) {
      return '[redacted-email]';
    }

    return `${localPart.slice(0, 2)}***@${domain}`;
  }

  private toSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return redactSensitiveText(error.message).slice(0, 1000);
    }

    return 'Unknown notification error';
  }

  private buildPublicUrl(appPublicUrl: string, brandLogoPath: string): string {
    const normalizedPublicUrl = appPublicUrl.replace(/\/$/, '');
    const normalizedLogoPath = brandLogoPath.startsWith('/')
      ? brandLogoPath
      : `/${brandLogoPath}`;

    return `${normalizedPublicUrl}${normalizedLogoPath}`;
  }
}
