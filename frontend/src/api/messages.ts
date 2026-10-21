/**
 * The API answers in English; these are the messages people actually see, in Arabic.
 * Unknown English messages fall back to a short message for their HTTP status.
 */
const MESSAGES: Record<string, string> = {
  // auth & account
  'Invalid email or password.': 'البريد الإلكتروني أو كلمة المرور غلط.',
  'Email is already registered.': 'البريد الإلكتروني ده مسجّل قبل كده. جرّب تسجّل دخول.',
  'Phone number is already registered.': 'رقم الموبايل ده مسجّل قبل كده.',
  'Email must be verified before login.': 'لازم تأكد بريدك الإلكتروني الأول قبل تسجيل الدخول.',
  'Email must be verified.': 'لازم تأكد بريدك الإلكتروني الأول.',
  'Email is already verified.': 'البريد الإلكتروني ده متأكد قبل كده.',
  'Email verification OTP has expired.': 'الكود انتهت صلاحيته. اطلب كود جديد.',
  'Email verification OTP is missing.': 'مفيش كود متبعت للبريد ده. اطلب كود جديد.',
  'Invalid email verification OTP.': 'الكود مش صحيح.',
  'Invalid password reset OTP.': 'الكود مش صحيح.',
  'Password reset OTP has expired.': 'الكود انتهت صلاحيته. اطلب كود جديد.',
  'Password reset OTP is missing.': 'مفيش كود متبعت للبريد ده. اطلب كود جديد.',
  'Password reset OTP expiry is missing.': 'مفيش كود متبعت للبريد ده. اطلب كود جديد.',
  'Maximum password reset OTP attempts exceeded.': 'جرّبت الكود مرات كتير. اطلب كود جديد.',
  'Password reset session is invalid or expired.':
    'انتهت مهلة تغيير كلمة المرور. ابدأ من الأول واطلب كود جديد.',
  'Current password is incorrect.': 'كلمة المرور الحالية غلط.',
  'User account is inactive.': 'الحساب ده موقوف. كلّمنا لو محتاج مساعدة.',
  'User not found.': 'مفيش حساب بالبيانات دي.',
  'Invalid access token.': 'انتهت الجلسة. سجّل دخول تاني.',
  'Invalid refresh token.': 'انتهت الجلسة. سجّل دخول تاني.',
  'Referral code not found.': 'كود الدعوة مش صحيح.',
  'User cannot refer himself.': 'مينفعش تستخدم كود الدعوة بتاعك.',
  'User has already been referred.': 'الحساب ده استخدم كود دعوة قبل كده.',
  'Admin access is required.': 'الصفحة دي للأدمن بس.',
  'Admins cannot deactivate themselves.': 'مينفعش توقف حسابك بنفسك.',
  // cart, orders, payments
  'Cart is empty.': 'السلة فاضية.',
  'Item already exists in cart.': 'العنصر ده موجود في السلة بالفعل.',
  'Item already exists in wishlist.': 'العنصر ده موجود في المفضلة بالفعل.',
  'Course already purchased.': 'إنت مشترك في الدورة دي بالفعل.',
  'Book format already purchased.': 'إنت اشتريت النسخة دي بالفعل.',
  'Book stock is insufficient.': 'الكمية المطلوبة مش متاحة في المخزن.',
  'Product stock is insufficient.': 'الكمية المطلوبة مش متاحة في المخزن.',
  'Course quantity cannot be updated.': 'الدورة بتتشترى نسخة واحدة بس.',
  'Course purchase is required.': 'لازم تشترك في الدورة الأول.',
  'Book purchase is required.': 'لازم تشتري الكتاب الأول.',
  'Coupon has expired.': 'الكوبون انتهت صلاحيته.',
  'Coupon has not started yet.': 'الكوبون لسه مبدأش.',
  'Coupon is inactive.': 'الكوبون ده مش شغال.',
  'Coupon not found or inactive.': 'الكوبون مش صحيح أو مش شغال.',
  'Coupon not found.': 'الكوبون مش صحيح.',
  'Coupon usage limit has been reached.': 'الكوبون ده خلص عدد مرات استخدامه.',
  'Coupons can be used only on unpaid orders.': 'الكوبون بيتطبق على الطلبات اللي لسه متدفعتش بس.',
  'No coupon is applied to this order.': 'مفيش كوبون متطبق على الطلب ده.',
  'Order is already paid.': 'الطلب ده اتدفع بالفعل.',
  'Only pending orders can be paid.': 'الطلب ده مينفعش يتدفع دلوقتي.',
  'Only pending orders can be cancelled.': 'الطلب ده مينفعش يتلغي دلوقتي.',
  'Paid orders cannot be cancelled.': 'الطلبات المدفوعة مينفعش تتلغي.',
  'Order not found.': 'الطلب مش موجود.',
  'Order has no items.': 'الطلب فاضي.',
  'Shipping address not found.': 'عنوان الشحن مش موجود.',
  'Address not found.': 'العنوان مش موجود.',
  'Provide at least one shipping field.': 'اكتب بيانات الشحن.',
  'PayPal payments support USD orders only.': 'الدفع بـ PayPal متاح للطلبات بالدولار بس.',
  'Paymob payments support EGP orders only.': 'الدفع بالكارت أو المحفظة متاح للطلبات بالجنيه بس.',
  'Paymob request failed.': 'بوابة الدفع مش بترد دلوقتي. حاول تاني بعد شوية.',
  // content
  'Course not found.': 'الدورة مش موجودة.',
  'Book not found.': 'الكتاب مش موجود.',
  'Product not found.': 'المنتج مش موجود.',
  'Article not found.': 'المقال مش موجود.',
  'Lesson not found.': 'الدرس مش موجود.',
  'Certificate not found.': 'الشهادة مش موجودة.',
  'Review not found.': 'التقييم مش موجود.',
  'Image must be a jpg, jpeg, png, or webp file.': 'الصورة لازم تكون JPG أو PNG أو WEBP.',
  'Invalid image file content.': 'ملف الصورة ده مش سليم.',
  'Invalid video file content.': 'ملف الفيديو ده مش سليم.',
  'File is empty.': 'الملف فاضي.',
  'File is required.': 'اختار ملف الأول.',
  'At least one field must be provided.': 'مفيش حاجة اتغيرت.',
  'Provide at least one field to update.': 'مفيش حاجة اتغيرت.',
}

const BY_STATUS: Record<number, string> = {
  400: 'البيانات فيها مشكلة. راجعها وحاول تاني.',
  401: 'لازم تسجّل دخول الأول.',
  403: 'مش مسموحلك تعمل الخطوة دي.',
  404: 'العنصر ده مش موجود.',
  409: 'البيانات دي موجودة قبل كده.',
  413: 'الملف كبير أوي.',
  422: 'البيانات فيها مشكلة. راجعها وحاول تاني.',
  429: 'محاولات كتير ورا بعض. استنى دقيقة وحاول تاني.',
  503: 'الخدمة مش متاحة دلوقتي. حاول تاني بعد شوية.',
}

const PASSWORD_POLICY_RE = /^(newPassword|password) must be at least 12 characters/
const HAS_ARABIC = /[؀-ۿ]/

/** Arabic text for an API error message (and its validation details). */
export function translateApiMessage(message: string, statusCode: number, errors: unknown[] = []): string {
  if (HAS_ARABIC.test(message)) return message
  const known = MESSAGES[message.trim()]
  if (known) return known

  if (message === 'Validation failed') {
    const details = errors.filter((e): e is string => typeof e === 'string')
    if (details.some((d) => PASSWORD_POLICY_RE.test(d))) {
      return 'كلمة المرور لازم تكون 12 حرف على الأقل وفيها حرف كابيتال ورقم ورمز.'
    }
    if (details.some((d) => /phone/i.test(d))) return 'رقم الموبايل مش صحيح.'
    if (details.some((d) => /email/i.test(d))) return 'البريد الإلكتروني مش صحيح.'
    if (details.some((d) => /otp/i.test(d))) return 'الكود لازم يكون 6 أرقام.'
  }

  if (statusCode >= 500) return 'حصلت مشكلة عندنا. حاول تاني بعد شوية.'
  return BY_STATUS[statusCode] ?? 'حصلت مشكلة غير متوقعة. حاول تاني بعد شوية.'
}
