import type { ImageSource } from 'expo-image'

// React Native requires static require() calls — no dynamic paths
const COUPON_IMAGES = {
  cafe: require('../assets/coupons/coupon_cafe.png'),
  medialuna: require('../assets/coupons/coupon_medialuna.png'),
  croissant: require('../assets/coupons/coupon_croissant.png'),
  jugos: require('../assets/coupons/coupon_jugos.png'),
  desayunotradi: require('../assets/coupons/coupon_desayunotradi.png'),
  desayunopani: require('../assets/coupons/coupon_desayunopani.png'),
  cafeytorta: require('../assets/coupons/coupon_cafeytorta.png'),
  packcafe: require('../assets/coupons/coupon_packcafe.png'),
  helado_dos: require('../assets/coupons/coupon_helado_dos.jpeg'),
  helado_cuarto: require('../assets/coupons/coupon_helado_cuarto.jpeg'),
  bolsa: require('../assets/coupons/coupon_bolsa.png'),
} as const

// Map reward value strings → coupon image key
const VALUE_TO_COUPON: Record<string, keyof typeof COUPON_IMAGES> = {
  'FREE COFFEE': 'cafe',
  'FREE CAFÉ': 'cafe',
  'FREE CAFE': 'cafe',
  'MEDIALUNA': 'medialuna',
  'CROISSANT': 'croissant',
  'JUGO NATURAL': 'jugos',
  'DESAYUNO': 'desayunotradi',
  'HELADO': 'helado_dos',
  '1/4 KG HELADO': 'helado_cuarto',
  '200 PANICAFE': 'bolsa',
}

// Fallback: map token cost → coupon image key
const COST_TO_COUPON: Record<number, keyof typeof COUPON_IMAGES> = {
  10000: 'bolsa',
  20000: 'medialuna',
  30000: 'cafe',
  40000: 'croissant', // croissant & jugos share cost — croissant as default
  50000: 'helado_dos',
  70000: 'desayunotradi',
  80000: 'helado_cuarto',
  90000: 'desayunopani',
  100000: 'cafeytorta',
  150000: 'packcafe',
}

export function getPanicafeCouponImage(value?: string, cost?: number): ImageSource {
  if (value) {
    const key = VALUE_TO_COUPON[value.toUpperCase()]
    if (key) return COUPON_IMAGES[key]
  }
  if (cost != null) {
    const key = COST_TO_COUPON[cost]
    if (key) return COUPON_IMAGES[key]
  }
  return COUPON_IMAGES.cafe
}

export function isPanicafeReward(brand?: string): boolean {
  return brand === 'PaniCafe'
}
