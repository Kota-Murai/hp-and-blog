"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// フロントエンドのスキルデータ
const frontendData = [
  { name: "javaScript", years: 6.5 },
  { name: "jquery", years: 3 },
  { name: "React", years: 3 },
  { name: "Next.js", years: 1 },
  { name: "Angular", years: 0.5 },
]

// バックエンドのスキルデータ
const backendData = [
  { name: "Node.js", years: 4 },
  { name: "Express", years: 3 },
  { name: "Python", years: 3 },
  { name: "Ruby on Rails", years: 1.5 },
  { name: "C/C++", years: 4 },
  { name: "RDB", years: 2.5 },
]

// DevOpsのスキルデータ
const devopsData = [
  { name: "AWS", years: 2 },
  { name: "Git/GitHub", years: 3 },
  { name: "Subversion", years: 4 },
  { name: "Docker", years: 2 },
  { name: "Jenkins", years: 1 },
]

const chartConfig = {
  years: {
    label: "Years",
    color: "hsl(var(--chart-1))",
  }
} satisfies ChartConfig

const SkillChart: React.FC<{ data: any[], title: string }> = ({ data, title }) => {
  return (
    <Card className="w-full md:w-1/3">
      <CardHeader className="px-8 border-b">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pr-8 py-6 border-b">
        <ChartContainer config={chartConfig} className="w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            width={400}
            height={300}
          >
            <CartesianGrid horizontal={true} vertical={false} />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              width={100}
              dx={-10}
            />
            <XAxis
              type="number"
              domain={[0, 6]}
              tickLine={false}
              axisLine={false}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="years"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const SkillsSection: React.FC = () => {
  return (
    <section id="skills" className="bg-background py-20 bg-gradient-to-br from-white via-emerald-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">Skills</h2>
        
        <div className="mb-12 max-w-xl mx-auto">
          <p className="text-base text-gray-800 leading-relaxed">
            これまで経験したスキルとその経験年数をグラフにしてみました。
            得意分野はバックエンドですが、フロントエンドも簡単なHP/LPの制作や管理画面の作成などは一通りこなせます。
            AWSの知識もありますので、インフラ周りの構築もちょっとだけできます。
            詳細については別途こちらの記事をご覧ください。
            <b>(記事は準備中)</b>
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          <SkillChart data={frontendData} title="Front-end" />
          <SkillChart data={backendData} title="Back-end" />
          <SkillChart data={devopsData} title="DevOps" />
        </div>
      </div>
    </section>
  )
}

export default SkillsSection