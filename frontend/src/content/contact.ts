import type { IconName } from '@/components/ui/Icon'
import { tx } from '@/lib/i18n'

const ADDRESS = tx(
  '4 ب شارع امتداد قصر الطاهرة، متفرع من شارع سليم الأول، سراي القبة، القاهرة',
  '4B Qasr El-Tahra Extension St., off Selim El-Awal St., Saray El-Qobba, Cairo',
)

// Contact details shown across the site (footer, contact page, CTAs, invoice).
export const CONTACT = {
  whatsapp: { label: '+201025733523', href: 'https://wa.me/201025733523' },
  phonesEgypt: [
    { label: '01143751414', href: 'tel:+201143751414' },
    { label: '0224556060', href: 'tel:+20224556060' },
  ],
  phoneIntl: { label: '+201025733523', href: 'tel:+201025733523' },
  address: {
    label: ADDRESS,
    href: 'https://maps.app.goo.gl/t2BMdDruvZPUynFa7',
  },
  hours: {
    days: tx('من السبت للخميس', 'Saturday to Thursday'),
    time: tx('من 10 الصبح لـ 10 بالليل', '10 am to 10 pm'),
  },
  social: {
    facebook: 'https://www.facebook.com/Dr.Salehabdelkarim/',
    instagram: 'https://www.instagram.com/dr_saleh_abdelkarim/',
    youtube: 'https://www.youtube.com/@DR_SALEH_ABDELKARIM',
    tiktok: 'https://www.tiktok.com/@dr_saleh_abdelkarim',
  },
}

export const SOCIAL: { label: string; icon: IconName; href: string }[] = [
  { label: tx('فيسبوك', 'Facebook'), icon: 'facebook', href: CONTACT.social.facebook },
  { label: tx('إنستجرام', 'Instagram'), icon: 'instagram', href: CONTACT.social.instagram },
  { label: tx('يوتيوب', 'YouTube'), icon: 'youtube', href: CONTACT.social.youtube },
  { label: tx('تيك توك', 'TikTok'), icon: 'tiktok', href: CONTACT.social.tiktok },
  { label: tx('واتساب', 'WhatsApp'), icon: 'whatsapp', href: CONTACT.whatsapp.href },
]
