import { buildNotificationEmailTemplate } from './notification-email.template';

const base = {
  brandName: 'منصة د. صالح عبد الكريم',
  logoUrl: 'https://api.example.com/brand/logo.png',
  platformUrl: 'https://example.com',
  supportEmail: 'support@example.com',
};

describe('buildNotificationEmailTemplate', () => {
  it('renders the logo, the one-time code and the call to action', () => {
    const { htmlContent, textContent } = buildNotificationEmailTemplate({
      ...base,
      title: 'تفعيل الحساب',
      blocks: [{ type: 'code', code: '482913', caption: 'صالح 10 دقايق' }],
      ctaLabel: 'افتح المنصة',
      ctaUrl: 'https://example.com/login',
    });

    expect(htmlContent).toContain(
      'src="https://api.example.com/brand/logo.png"',
    );
    expect(htmlContent).toContain('482913');
    expect(htmlContent).toContain('href="https://example.com/login"');
    expect(htmlContent).toContain('dir="rtl"');
    expect(textContent).toContain('482913');
    expect(textContent).toContain('افتح المنصة: https://example.com/login');
  });

  it('renders the invoice lines and totals', () => {
    const { htmlContent, textContent } = buildNotificationEmailTemplate({
      ...base,
      title: 'تم الدفع',
      blocks: [
        {
          type: 'invoice',
          invoice: {
            number: 'DS-2026-000123',
            date: '22 أكتوبر 2026',
            paymentMethod: 'PayPal',
            lines: [
              {
                title: 'دورة التربية',
                kind: 'دورة',
                quantity: 1,
                unitPrice: '350 ج.م',
                total: '350 ج.م',
              },
            ],
            subtotal: '350 ج.م',
            discount: '50 ج.م',
            total: '300 ج.م',
          },
        },
      ],
    });

    expect(htmlContent).toContain('DS-2026-000123');
    expect(htmlContent).toContain('دورة التربية');
    expect(htmlContent).toContain('300 ج.م');
    expect(htmlContent).toContain('PayPal');
    expect(textContent).toContain('الإجمالي: 300 ج.م');
  });

  it('escapes user-provided text', () => {
    const { htmlContent } = buildNotificationEmailTemplate({
      ...base,
      title: 'test',
      greeting: '<script>alert(1)</script>',
      blocks: [{ type: 'details', rows: [['الموضوع', '<b>x</b>']] }],
    });

    expect(htmlContent).not.toContain('<script>');
    expect(htmlContent).toContain('&lt;script&gt;');
    expect(htmlContent).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
