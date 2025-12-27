/**
 * User-Agent文字列からデバイスタイプを判定
 */

export type DeviceType =
  | 'mobile_ios'
  | 'mobile_android'
  | 'tablet_ios'
  | 'tablet_android'
  | 'desktop_windows'
  | 'desktop_mac'
  | 'desktop_linux'
  | 'bot'
  | 'other'

export interface DeviceStats {
  mobile_ios: number
  mobile_android: number
  tablet_ios: number
  tablet_android: number
  desktop_windows: number
  desktop_mac: number
  desktop_linux: number
  bot: number
  other: number
}

export function createEmptyDeviceStats(): DeviceStats {
  return {
    mobile_ios: 0,
    mobile_android: 0,
    tablet_ios: 0,
    tablet_android: 0,
    desktop_windows: 0,
    desktop_mac: 0,
    desktop_linux: 0,
    bot: 0,
    other: 0,
  }
}

/**
 * User-Agent文字列からデバイスタイプを判定
 */
export function parseDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) {
    return 'other'
  }

  const ua = userAgent.toLowerCase()

  // Bot判定（クローラー等）
  if (
    ua.includes('bot') ||
    ua.includes('crawler') ||
    ua.includes('spider') ||
    ua.includes('googlebot') ||
    ua.includes('bingbot') ||
    ua.includes('slurp') ||
    ua.includes('duckduckbot') ||
    ua.includes('baiduspider') ||
    ua.includes('yandexbot') ||
    ua.includes('facebookexternalhit') ||
    ua.includes('twitterbot') ||
    ua.includes('linkedinbot')
  ) {
    return 'bot'
  }

  // iPad判定（iOSタブレット）
  if (ua.includes('ipad')) {
    return 'tablet_ios'
  }

  // iPhone判定（iOSモバイル）
  if (ua.includes('iphone')) {
    return 'mobile_ios'
  }

  // Android判定
  if (ua.includes('android')) {
    // Androidタブレット判定（Mobileが含まれない場合はタブレット）
    if (!ua.includes('mobile')) {
      return 'tablet_android'
    }
    return 'mobile_android'
  }

  // デスクトップOS判定
  if (ua.includes('windows')) {
    return 'desktop_windows'
  }

  if (ua.includes('macintosh') || ua.includes('mac os')) {
    return 'desktop_mac'
  }

  if (ua.includes('linux') && !ua.includes('android')) {
    return 'desktop_linux'
  }

  // iPod（レガシーだが念のため）
  if (ua.includes('ipod')) {
    return 'mobile_ios'
  }

  return 'other'
}

/**
 * DeviceStatsオブジェクトを合算
 */
export function mergeDeviceStats(a: DeviceStats, b: DeviceStats): DeviceStats {
  return {
    mobile_ios: a.mobile_ios + b.mobile_ios,
    mobile_android: a.mobile_android + b.mobile_android,
    tablet_ios: a.tablet_ios + b.tablet_ios,
    tablet_android: a.tablet_android + b.tablet_android,
    desktop_windows: a.desktop_windows + b.desktop_windows,
    desktop_mac: a.desktop_mac + b.desktop_mac,
    desktop_linux: a.desktop_linux + b.desktop_linux,
    bot: a.bot + b.bot,
    other: a.other + b.other,
  }
}

/**
 * JSON形式のdevice_statsをDeviceStats型に変換
 */
export function parseDeviceStatsJson(json: unknown): DeviceStats {
  const stats = createEmptyDeviceStats()

  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>
    for (const key of Object.keys(stats) as (keyof DeviceStats)[]) {
      if (typeof obj[key] === 'number') {
        stats[key] = obj[key] as number
      }
    }
  }

  return stats
}
