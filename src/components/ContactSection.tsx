"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger
} from "@/components/ui/dialog"
import { z } from "zod"

const formSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: z
    .string()
    .min(1, "お名前を入力してください")
    .max(100, "100文字以内で入力してください"),
  company: z
    .string()
    .max(100, "100文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(1, "お問い合わせ内容を入力してください")
    .max(1000, "お問い合わせ内容は1000文字以内で入力してください"),
})

type FormData = z.infer<typeof formSchema>

const ContactSection: React.FC = () => {
  const [isConsentGiven, setIsConsentGiven] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      company: "",
      message: "",
    },
  })

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true)
    setIsSuccess(false)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        setIsSuccess(true)
        form.reset()
      } else {
        const data = await response.json().catch(() => ({}))
        setErrorMessage(data.error?.message || 'エラーが発生しました。再度お試しください。')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      setErrorMessage('ネットワークエラーが発生しました。接続を確認してください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="bg-background py-20 pb-16 md:pb-48">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-10">Contact</h2>
        <p className="text-center text-gray-700 mb-10">
          下記問い合わせフォームもしくはSNSのDMからお問い合わせください。
        </p>

        <div className="max-w-xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input placeholder="example@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>お名前</FormLabel>
                    <FormControl>
                      <Input placeholder="氏名もしくはハンドルネームやニックネーム" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>企業名・法人名（任意）</FormLabel>
                    <FormControl>
                      <Input placeholder="企業名や法人名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* お問い合わせ内容の追加 */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>お問い合わせ内容</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="お問い合わせ内容を入力してください（最大1000文字）"
                        {...field}
                        className="w-full p-2 border rounded-md"
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0">
                      個人情報の取扱い(確認・同意の上、送信してください)
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="privacy-policy-description">
                    <DialogHeader>
                      <DialogTitle>個人情報の取り扱いについて</DialogTitle>
                      <DialogDescription id="privacy-policy-description">
                        <p>
                          このお問い合わせフォームでは、皆様から提供いただく個人情報（氏名、メールアドレス等）について、以下の方針に基づき取り扱いさせていただきます。内容をご確認いただき、同意いただける場合のみ「個人情報の取扱に同意する」ボタンを押してください。
                        </p>
                        <ol className="list-decimal list-inside mt-4 space-y-2">
                          <li>
                            <strong>個人情報の収集目的</strong>
                            <ul className="list-disc list-inside">
                              <li>お問い合わせ内容への対応や、必要なご連絡を差し上げるために利用いたします。</li>
                            </ul>
                          </li>
                          <li>
                            <strong>個人情報の管理責任者</strong>
                            <ul className="list-disc list-inside">
                              <li>
                                管理責任者の氏名: 村井洸太<br />
                                ご連絡先: <a href="mailto:toppomurai@gmail.com" className="text-blue-500">toppomurai@gmail.com</a>
                              </li>
                            </ul>
                          </li>
                          <li>
                            <strong>個人情報の第三者提供</strong>
                            <ul className="list-disc list-inside">
                              <li>提供いただいた個人情報は、ご本人の同意がある場合を除き、第三者に提供することはございません。</li>
                            </ul>
                          </li>
                          <li>
                            <strong>個人情報の開示・訂正・削除</strong>
                            <ul className="list-disc list-inside">
                              <li>ご提供いただいた個人情報について、開示・訂正・削除の請求をいただくことができます。ご希望の場合は、上記の連絡先までご連絡ください。</li>
                            </ul>
                          </li>
                          <li>
                            <strong>安全管理措置</strong>
                            <ul className="list-disc list-inside">
                              <li>ご提供いただいた個人情報は、適切な管理のもと安全に保管いたします。</li>
                            </ul>
                          </li>
                        </ol>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-end">
                      <DialogClose asChild>
                        <Button
                          onClick={() => setIsConsentGiven(true)}
                          disabled={isConsentGiven}
                          className="bg-emerald-600"
                        >
                          個人情報の取扱に同意する
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Button
                type="submit"
                disabled={!isConsentGiven || isSubmitting}
                className="w-full"
              >
                送信する
              </Button>
            </form>
          </Form>

          {isSuccess && (
            <p className="mt-4 text-green-600 text-center">お問い合わせが正常に送信されました。</p>
          )}
          {errorMessage && (
            <p className="mt-4 text-red-600 text-center">{errorMessage}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default ContactSection