import { ref } from 'vue'

export function useTailwindColor() {
  const colorCache = new Map()

  const getTailwindColor = (colorClass, defaultColor = '#818cf8') => { // Default indigo-400
    if (!colorClass) return defaultColor
    if (colorClass.startsWith('#') || colorClass.startsWith('rgb')) return colorClass

    if (colorCache.has(colorClass)) {
      return colorCache.get(colorClass)
    }

    const tempEl = document.createElement('div')
    tempEl.className = `text-${colorClass}`
    document.body.appendChild(tempEl)

    const computedColor = getComputedStyle(tempEl).color
    document.body.removeChild(tempEl)

    // Jika hasil compute adalah hitam (rgb(0,0,0)) karena class tidak di-build Tailwind,
    // maka berikan fallback nilai hex/rgb agar tidak hitam pekat.
    const isInvalid = computedColor === 'rgb(0, 0, 0)' || !computedColor
    const finalColor = isInvalid ? defaultColor : computedColor

    colorCache.set(colorClass, finalColor)
    return finalColor
  }

  const getMenuStyles = (menu, isCurrentRoute) => {
    if (isCurrentRoute) return {}

    const rgbColor = getTailwindColor(menu.color)

    const rgbaBg = rgbColor.startsWith('rgb')
      ? rgbColor.replace('rgb', 'rgba').replace(')', ', 0.12)')
      : `${rgbColor}1F`

    return {
      borderColor: rgbColor,
      color: rgbColor,
      backgroundColor: rgbaBg
    }
  }

  return {
    getTailwindColor,
    getMenuStyles
  }
}