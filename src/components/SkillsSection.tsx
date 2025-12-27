import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// スキルデータの型定義
interface SkillData {
  name: string
  years: number
}

// フロントエンドのスキルデータ
const frontendData: SkillData[] = [
  { name: "JavaScript", years: 6.5 },
  { name: "jQuery", years: 3 },
  { name: "React", years: 3 },
  { name: "Next.js", years: 1 },
  { name: "Angular", years: 0.5 },
]

// バックエンドのスキルデータ
const backendData: SkillData[] = [
  { name: "Node.js", years: 4 },
  { name: "Express", years: 3 },
  { name: "Python", years: 3 },
  { name: "Ruby on Rails", years: 1.5 },
  { name: "C/C++", years: 4 },
  { name: "RDB", years: 2.5 },
]

// DevOpsのスキルデータ
const devopsData: SkillData[] = [
  { name: "AWS", years: 2 },
  { name: "Git/GitHub", years: 3 },
  { name: "Subversion", years: 4 },
  { name: "Docker", years: 2 },
  { name: "Jenkins", years: 1 },
]

// 最大年数（バーの100%幅）
const MAX_YEARS = 7

// スキルバーコンポーネント
const SkillBar: React.FC<{ skill: SkillData }> = ({ skill }) => {
  const percentage = (skill.years / MAX_YEARS) * 100

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-sm text-gray-700 shrink-0">{skill.name}</span>
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
