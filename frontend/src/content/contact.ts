import type { IconName } from '@/components/ui/Icon'

const ADDRESS = '4 ب شارع امتداد قصر الطاهرة، متفرع من شارع سليم الأول، سراي القبة، القاهرة'

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
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
  },
  hours: { days: 'من السبت للخميس', time: 'من 10 الصبح لـ 10 بالليل' },
  social: {
    facebook: 'https://www.facebook.com/Dr.Salehabdelkarim/',
    instagram: 'https://www.instagram.com/dr_saleh_abdelkarim/',
    youtube: 'https://www.youtube.com/@DR_SALEH_ABDELKARIM',
    tiktok: 'https://www.tiktok.com/@dr_saleh_abdelkarim',
  },
}

export const SOCIAL: { label: string; icon: IconName; href: string }[] = [
  { label: 'فيسبوك', icon: 'facebook', href: CONTACT.social.facebook },
  { label: 'إنستجرام', icon: 'instagram', href: CONTACT.social.instagram },
  { label: 'يوتيوب', icon: 'youtube', href: CONTACT.social.youtube },
  { label: 'تيك توك', icon: 'tiktok', href: CONTACT.social.tiktok },
  { label: 'واتساب', icon: 'whatsapp', href: CONTACT.whatsapp.href },
]
