"use client"

import { useEffect, useState } from 'react'

export const useElementHeight = (selector: string) => {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const updateHeight = () => {
      const element = document.querySelector(selector)
      if (element) {
        const height = element.getBoundingClientRect().height
        setHeight(height)
        document.documentElement.style.setProperty(
          `--${selector.replace(/[^a-zA-Z]/g, '')}-height`,
          `${height}px`
        )
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [selector])

  return height
}