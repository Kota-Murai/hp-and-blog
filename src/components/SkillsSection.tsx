import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SiTypescript,
  SiJavascript,
  SiReact,
  SiAngular,
  SiFlutter,
  SiNodedotjs,
  SiExpress,
  SiRubyonrails,
  SiPython,
  SiGo,
  SiRust,
  SiAmazonwebservices,
  SiMysql,
  SiPostgresql,
  SiMongodb,
  SiAmazondynamodb,
  SiRedis,
  SiDocker,
} from "react-icons/si"

// スキルデータの型定義
interface SkillData {
  name: string
  years: number
  icons?: React.ReactNode
}

// アイコンコンポーネント
const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex gap-1 ml-1">{children}</span>
)

// フロントエンドのスキルデータ
const frontendData: SkillData[] = [
  {
    name: "TypeScript",
    years: 2,
    icons: <IconWrapper><SiTypescript className="w-4 h-4 text-[#3178C6]" /></IconWrapper>,
  },
  {
    name: "JavaScript",
    years: 5,
    icons: <IconWrapper><SiJavascript className="w-4 h-4 text-[#F7DF1E]" /></IconWrapper>,
  },
  {
    name: "React",
    years: 1.5,
    icons: <IconWrapper><SiReact className="w-4 h-4 text-[#61DAFB]" /></IconWrapper>,
  },
  {
    name: "Angular",
    years: 2,
    icons: <IconWrapper><SiAngular className="w-4 h-4 text-[#DD0031]" /></IconWrapper>,
  },
  {
    name: "Flutter",
    years: 1,
    icons: <IconWrapper><SiFlutter className="w-4 h-4 text-[#02569B]" /></IconWrapper>,
  },
]

// バックエンドのスキルデータ
const backendData: SkillData[] = [
  {
    name: "Node.js",
    years: 6.5,
    icons: <IconWrapper><SiNodedotjs className="w-4 h-4 text-[#339933]" /></IconWrapper>,
  },
  {
    name: "Express",
    years: 4.5,
    icons: <IconWrapper><SiExpress className="w-4 h-4 text-gray-700" /></IconWrapper>,
  },
  {
    name: "Rails",
    years: 2.5,
    icons: <IconWrapper><SiRubyonrails className="w-4 h-4 text-[#CC0000]" /></IconWrapper>,
  },
  {
    name: "Python",
    years: 3,
    icons: <IconWrapper><SiPython className="w-4 h-4 text-[#3776AB]" /></IconWrapper>,
  },
  {
    name: "Go / Rust",
    years: 0.5,
    icons: (
      <IconWrapper>
        <SiGo className="w-4 h-4 text-[#00ADD8]" />
        <SiRust className="w-4 h-4 text-[#000000]" />
      </IconWrapper>
    ),
  },
]

// インフラ/DBのスキルデータ
const infraData: SkillData[] = [
  {
    name: "AWS",
    years: 4,
    icons: <IconWrapper><SiAmazonwebservices className="w-4 h-4 text-[#FF9900]" /></IconWrapper>,
  },
  {
    name: "RDB",
    years: 3,
    icons: (
      <IconWrapper>
        <SiMysql className="w-4 h-4 text-[#4479A1]" />
        <SiPostgresql className="w-4 h-4 text-[#4169E1]" />
      </IconWrapper>
    ),
  },
  {
    name: "NoSQL",
    years: 3.5,
    icons: (
      <IconWrapper>
        <SiAmazondynamodb className="w-4 h-4 text-[#4053D6]" />
        <SiMongodb className="w-4 h-4 text-[#47A248]" />
      </IconWrapper>
    ),
  },
  {
    name: "Redis",
    years: 3,
    icons: <IconWrapper><SiRedis className="w-4 h-4 text-[#DC382D]" /></IconWrapper>,
  },
  {
    name: "Docker",
    years: 2,
    icons: <IconWrapper><SiDocker className="w-4 h-4 text-[#2496ED]" /></IconWrapper>,
  },
]

// 最大年数（バーの100%幅）
const MAX_YEARS = 8

// スキルバーコンポーネント
const SkillBar: React.FC<{ skill: SkillData }> = ({ skill }) => {
  const percentage = (skill.years / MAX_YEARS) * 100

  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-sm text-gray-700 shrink-0 flex items-center">
        {skill.name}
        {skill.icons}
      </span>
      <div className="flex-1 bg-gray-100 rounded h-6 relative overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-r transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-sm text-gray-600 text-right shrink-0">
        {skill.years}年
      </span>
    </div>
  )
}

// スキルチャートコンポーネント
const SkillChart: React.FC<{ data: SkillData[]; title: string }> = ({
  data,
  title,
}) => {
  return (
    <Card className="w-full md:w-1/3">
      <CardHeader className="px-8 border-b">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-6 border-b">
        <div className="space-y-3">
          {data.map((skill) => (
            <SkillBar key={skill.name} skill={skill} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const SkillsSection: React.FC = () => {
  return (
    <section
      id="skills"
      className="bg-background py-20 bg-gradient-to-br from-white via-emerald-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">Skills</h2>

        <div className="mb-12 max-w-xl mx-auto">
          <p className="text-base text-gray-800 leading-relaxed">
            これまで経験したスキルとその経験年数をグラフにしてみました。
            得意分野はバックエンドですが、フロントエンドも簡単なHP/LPの制作や管理画面の作成などは一通りこなせます。
            AWSの知識もありますので、インフラ周りの構築もちょっとだけできます。
            詳細については<Link href="/blog/first-post" className="text-emerald-600 hover:text-emerald-700 underline">自己紹介記事</Link>をご覧ください。
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          <SkillChart data={frontendData} title="Front-end" />
          <SkillChart data={backendData} title="Back-end" />
          <SkillChart data={infraData} title="Infra / DB" />
        </div>
      </div>
    </section>
  )
}

export default SkillsSection
