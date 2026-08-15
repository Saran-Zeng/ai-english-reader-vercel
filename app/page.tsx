import Link from "next/link";

const features = [
  {
    href: "/reader",
    icon: "🤖",
    title: "AI 阅读",
    description: "输入英文文章，让 AI 帮你理解、分析和学习。",
    action: "开始阅读 →",
  },
  {
    href: "/long-reading",
    icon: "📚",
    title: "长篇阅读",
    description: "阅读完整英文文章，支持分段朗读和中英文对照。",
    action: "浏览文章 →",
  },
  {
    href: "/notes",
    icon: "📝",
    title: "我的笔记本",
    description: "保存阅读过程中遇到的单词和重要学习内容。",
    action: "打开笔记本 →",
  },
  {
    href: "/profile",
    icon: "👤",
    title: "我的",
    description: "查看个人信息和你的英语阅读学习记录。",
    action: "进入我的 →",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="hero-badge">
          ✨ AI-powered English Reading
        </div>

        <h1>
          让英语阅读
          <br />
          <span>真正变得简单</span>
        </h1>

        <p>
          AI 英语阅读器帮助你理解英文文章、分析句子、
          学习单词，并通过自然朗读提升英语阅读能力。
        </p>
      </section>

      {/* 2 × 2 Features */}
      <section className="feature-section">
        <div className="feature-grid">
          {features.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="feature-card"
            >
              <div className="feature-icon">
                {item.icon}
              </div>

              <h2>{item.title}</h2>

              <p>{item.description}</p>

              <div className="feature-action">
                {item.action}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Reading Flow */}
      <section className="reading-flow">
        <div className="flow-inner">
          <div className="flow-header">
            <div className="flow-label">
              SIMPLE READING FLOW
            </div>

            <h2>三步开始你的英语阅读</h2>
          </div>

          <div className="steps">
            <Step
              number="01"
              title="选择文章"
              description="输入自己的英文文章，或者从长篇阅读中选择一篇文章。"
            />

            <Step
              number="02"
              title="理解文章"
              description="AI 帮你分析句子、单词、中文翻译和文章内容。"
            />

            <Step
              number="03"
              title="听与读"
              description="使用文章原声或 AI 朗读，边听边读，逐步提高英语能力。"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <span>© 2026 AI English Reader</span>

        <div>
          <Link href="/reader">AI 阅读</Link>
          <Link href="/long-reading">长篇阅读</Link>
          <Link href="/notes">笔记本</Link>
          <Link href="/profile">我的</Link>
        </div>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="step">
      <div className="step-number">{number}</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}