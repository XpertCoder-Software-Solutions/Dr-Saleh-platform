import type { Policy, PolicyId } from './policies'

export const POLICIES_UPDATED_EN = 'October 14, 2026'

/** English version of the policies; same sections, in the same order, as the Arabic text. */
export const POLICIES_EN: Record<PolicyId, Policy> = {
  terms: {
    title: 'Terms and conditions',
    icon: 'file',
    summary:
      "The rules that govern your use of Dr. Saleh Abdelkarim's platform and your purchases of courses, books and products.",
    sections: [
      {
        title: 'Accepting the terms',
        body: [
          'By using the platform, creating an account or buying anything from it, you agree to these terms and to the privacy policy, the shipping policy and the exchange and returns policy.',
          'If you do not agree with any part of them, please do not use the platform.',
        ],
      },
      {
        title: 'Your account',
        body: [
          'Your account is personal and for you alone. You are responsible for keeping your password secret and for any activity on your account.',
        ],
        list: [
          'The details you register (name, email and mobile number) must be accurate.',
          'If you are under 18, a parent or guardian must agree to and supervise your use of the platform.',
          'Sharing or selling an account, or letting more than one person use it, is not allowed.',
          'We may suspend any account that breaks these terms, and we will tell the owner why.',
        ],
      },
      {
        title: 'Courses and digital content',
        body: [
          'When you buy a course or a digital or audio book, you get a personal, non-transferable licence to use it. The course stays available in your account on any device for as long as the platform operates.',
        ],
        list: [
          'Recording, filming or downloading the videos in any way is not allowed.',
          'Republishing, selling or sharing the content in groups or on other sites is not allowed.',
          'We may update, reorganize or add to course content to benefit learners.',
        ],
      },
      {
        title: 'Prices and payment',
        body: [
          'Prices are shown in Egyptian pounds, and payment is made online before the order is confirmed through secure payment gateways: bank cards, mobile wallets and Apple Pay, plus PayPal for digital orders in US dollars.',
          'An order is confirmed only once payment succeeds. Courses and digital editions unlock immediately; products and print books ship according to the shipping policy.',
          'We may change prices at any time; changes do not affect orders already paid for.',
        ],
      },
      {
        title: 'Coupons and referrals',
        body: [
          'Discount coupons have their own conditions and expiry dates, apply once per order and cannot be exchanged for cash. “Invite a friend” rewards count genuine invitations only, and we may cancel them in case of abuse.',
        ],
      },
      {
        title: 'Certificates',
        body: [
          'A completion certificate is issued automatically once you finish a course. Each certificate has a number that anyone can check on the “Verify a certificate” page.',
          'A certificate shows that you attended and completed the course; it is not a professional licence or an academic degree.',
        ],
      },
      {
        title: 'Consultations',
        body: [
          'Consultations are private sessions with Dr. Saleh, booked through the consultation request form. Our team contacts you to set the time and details.',
          'Consultations offer parenting and psychological guidance and are not a substitute for emergency services or specialist medical or psychological treatment. If anyone is in danger, call emergency services or go to the nearest hospital immediately.',
        ],
      },
      {
        title: 'Reviews and contributions',
        body: [
          'Your course review must reflect your real experience and must not be abusive. We may hide any review that contains offensive language, advertising or personal data.',
        ],
      },
      {
        title: 'Intellectual property',
        body: [
          'All courses, books, articles, videos, designs and the logo on the platform belong to Dr. Saleh Abdelkarim and the platform and are protected by intellectual property laws. Any use without written permission is prohibited.',
        ],
      },
      {
        title: 'Limitation of liability',
        body: [
          'We try to keep the platform running at all times and free of errors, but it may be temporarily unavailable for maintenance or for reasons beyond our control. The content is for guidance, and applying it is up to your judgement of your family’s circumstances.',
        ],
      },
      {
        title: 'Changes and governing law',
        body: [
          'We may change these terms and will publish the change here with the last-updated date. Continuing to use the platform after a change means you accept it.',
          'These terms are governed by the laws of the Arab Republic of Egypt, and the courts of Cairo have jurisdiction over any dispute.',
        ],
      },
    ],
  },
  shipping: {
    title: 'Shipping policy',
    icon: 'truck',
    summary: 'How and when print books and products reach you, shipping fees, and order tracking.',
    sections: [
      {
        title: 'What ships',
        body: [
          'Only print books and products are shipped. Courses and digital and audio books unlock in your account right after payment and need no shipping.',
        ],
      },
      {
        title: 'Where we ship',
        body: [
          'We ship to every governorate in Egypt. We do not ship outside Egypt at the moment, but you can buy courses and digital editions from any country.',
        ],
      },
      {
        title: 'Shipping fees',
        body: [
          'Shipping fees depend on the governorate and are shown on the payment page before you confirm the order. Each order ships once, whatever the number of items.',
        ],
      },
      {
        title: 'Preparation and delivery time',
        body: [
          'We start preparing your order once payment is confirmed, and it is usually handed to the courier within one to two business days.',
          'Delivery usually takes 2 to 4 business days in Cairo and Giza, and up to 7 business days in other governorates. Fridays and public holidays are not counted.',
        ],
      },
      {
        title: 'Tracking your order',
        body: [
          'You can follow your order status at any time on the “My orders” page: preparing, shipped, delivered. Once it ships, you will see the courier’s name and tracking number and receive a notification on the platform.',
        ],
      },
      {
        title: 'Receiving your order',
        body: ['The courier will contact you on the mobile number in your address before delivery.'],
        list: [
          'Make sure your address and mobile number are correct before confirming the order.',
          'Inspect the package in front of the courier; if there is visible damage, note it and contact us the same day.',
          'If delivery fails more than once because of no answer or a wrong address, the package may be returned to us, and reshipping will incur new fees.',
        ],
      },
      {
        title: 'Delays',
        body: [
          'If your order is later than expected, contact us with your order number from the “Contact us” page and we will follow up with the courier and get back to you.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    icon: 'shield',
    summary: 'What data we collect, what we use it for, how we protect it, and your rights over it.',
    sections: [
      {
        title: 'The data we collect',
        body: ['We collect only the data we need to provide the service:'],
        list: [
          'Account data: name, email, mobile number, gender (optional), and a profile photo if you add one.',
          'Order data: what you bought, your shipping address, and payment status.',
          'Learning data: lessons you watched, your course progress, certificates, and reviews you wrote.',
          'Consultation data: what you write in the consultation request form and the session times.',
          'Basic technical data such as device and browser type, to secure your account and fix problems.',
        ],
      },
      {
        title: 'What we use it for',
        body: [],
        list: [
          'To unlock the content you bought and save your progress.',
          'To fulfil and ship your orders and send you confirmations and notifications.',
          'To arrange consultation times and contact you about them.',
          'To issue certificates and make them verifiable.',
          'To improve the platform and protect accounts from unauthorized use.',
        ],
      },
      {
        title: 'Payment',
        body: [
          'We never store card or wallet details. Payment is made directly on secure payment gateways (Paymob and PayPal), and we only receive the result of the transaction.',
        ],
      },
      {
        title: 'Who we share your data with',
        body: ['We do not sell your data to anyone. We share only what is necessary with:'],
        list: [
          'The courier: your name, mobile number and address, to deliver your order.',
          'Payment gateways: the details needed to complete the payment.',
          'Our email service: to send you account and order messages.',
          'Official authorities: where required by law.',
        ],
      },
      {
        title: 'Confidentiality of consultations',
        body: [
          'Everything you share in a consultation request or during a session is confidential. Only the doctor and the team that schedules sessions can see it, and it is never published or shared in any way.',
        ],
      },
      {
        title: 'Storage and security',
        body: [
          'Your data is kept on secured servers, your connection to the platform is encrypted, and your password is stored in an encrypted form that no one can read. Your browser stores a few small items, such as your sign-in and notification state, to keep you signed in.',
        ],
      },
      {
        title: 'Your rights',
        body: [
          'You can view and edit your data on your profile page, ask for a copy of it, or ask us to delete your account and data from the “Contact us” page. Some data, such as invoices, may be kept for as long as the law requires.',
          'We handle your data in line with Egypt’s Personal Data Protection Law No. 151 of 2020.',
        ],
      },
      {
        title: 'Changes',
        body: [
          'If we change this policy, we will publish the change here with the last-updated date, and we will email you about significant changes.',
        ],
      },
    ],
  },
  refunds: {
    title: 'Exchange and returns policy',
    icon: 'refresh',
    summary:
      'When and how you can exchange or return a product, or get a refund for a course or consultation.',
    sections: [
      {
        title: 'Print books and products',
        body: [
          'You can exchange or return a book or product within 14 days of receiving it, provided it is in its original condition, unused and in its original packaging.',
        ],
        list: [
          'If the item is defective, wrong or damaged: we replace it or refund it in full, and we cover shipping. Tell us within 3 days of delivery and send a photo of the problem.',
          'If you return it because you changed your mind: we refund the item price, and you cover shipping both ways.',
          'Exchanges for another item depend on availability; any price difference is paid or refunded.',
        ],
      },
      {
        title: 'Courses',
        body: [
          'You can request a course refund within 7 days of purchase, provided you have watched no more than 20% of the course and its certificate has not been issued.',
          'After that, courses are non-refundable, since the full content unlocks as soon as you buy.',
        ],
      },
      {
        title: 'Digital and audio books',
        body: [
          'Digital and audio editions are non-refundable once opened or downloaded. If there is a technical problem with the file that we cannot fix, we refund you in full.',
        ],
      },
      {
        title: 'Consultations',
        body: [],
        list: [
          'You can reschedule once at no charge if you tell us at least 24 hours in advance.',
          'If you cancel 48 hours or more before the session, you get a full refund.',
          'Cancelling less than 48 hours before, or not attending, is non-refundable.',
          'If we cancel the session, you choose between a new time or a full refund.',
        ],
      },
      {
        title: 'Cancelling before shipping',
        body: [
          'You can cancel an order for physical items before it ships and get a full refund. Once it ships, the normal returns policy applies.',
        ],
      },
      {
        title: 'How to request an exchange or return',
        body: [],
        list: [
          'Contact us from the “Contact us” page or on WhatsApp with your order number and the reason.',
          'Our team replies within one business day and arranges collection of the item if needed.',
          'Once we receive and check the item, we confirm the approval.',
        ],
      },
      {
        title: 'Refunds',
        body: [
          'Refunds go back to the payment method you used, within 7 to 14 business days of approval, depending on your bank or wallet.',
        ],
      },
    ],
  },
}
