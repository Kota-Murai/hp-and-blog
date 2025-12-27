"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// ContactSectionを遅延読み込み（zod, react-hook-formを含むため）
const ContactSection = dynamic(() => import("./ContactSection"), {
  ssr: false,
  loading: () => <ContactSectionSkeleton />,
})

// スケルトンコンポーネント
const ContactSectionSkeleton: React.FC = () => (
  <section className="bg-background py-20 pb-16 md:pb-48">
    <div className="max-w-7xl mx-auto px-4">
      <Skeleton className="h-12 w-48 mx-auto mb-10" />
      <Skeleton className="h-6 w-96 mx-auto mb-10" />
      <div className="max-w-xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </section>
)

const ContactSectionWrapper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px" // 200px手前で読み込み開始
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sectionRef} id="contact-wrapper">
      {isVisible ? <ContactSection /> : <ContactSectionSkeleton />}
    </div>
  )
}

export default ContactSectionWrapper
