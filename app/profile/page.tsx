"use client";

import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="profile-page">
      <div className="profile-container">
        <div className="profile-badge">
          AI ENGLISH READER
        </div>

        <h1>我的学习空间</h1>

        <p className="subtitle">
          查看你的英语学习信息和学习进度。
        </p>

        <section className="profile-card">
          <div className="avatar">
            AI
          </div>

          <div>
            <h2>英语学习者</h2>

            <p>
              你的个人学习中心
            </p>
          </div>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <strong>0</strong>
            <span>学习文章</span>
          </div>

          <div className="stat-card">
            <strong>0</strong>
            <span>词汇量</span>
          </div>

          <div className="stat-card">
            <strong>0</strong>
            <span>学习天数</span>
          </div>
        </div>

        <div className="links">
          <Link href="/articles">
            我的文章
          </Link>

          <Link href="/study">
            开始学习
          </Link>

          <Link href="/reader">
            AI 阅读器
          </Link>

          <Link href="/">
            返回首页
          </Link>
        </div>
      </div>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          padding: 55px 20px 80px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(99, 102, 241, 0.08),
              transparent 34rem
            ),
            #f7f8fc;
        }

        .profile-container {
          width: min(900px, 100%);
          margin: 0 auto;
        }

        .profile-badge {
          color: #6366f1;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        h1 {
          margin: 10px 0 0;
          font-size: clamp(32px, 5vw, 46px);
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin: 12px 0 28px;
          color: #777d89;
          font-size: 14px;
        }

        .profile-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 25px;
          border: 1px solid #e7e9ef;
          border-radius: 20px;
          background: #ffffff;
        }

        .avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          border-radius: 17px;
          background: #6366f1;
          color: #ffffff;
          font-weight: 900;
        }

        h2 {
          margin: 0;
          font-size: 18px;
        }

        .profile-card p {
          margin: 5px 0 0;
          color: #8a909c;
          font-size: 13px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 14px;
        }

        .stat-card {
          padding: 22px;
          border: 1px solid #e7e9ef;
          border-radius: 17px;
          background: #ffffff;
        }

        .stat-card strong {
          display: block;
          font-size: 26px;
        }

        .stat-card span {
          display: block;
          margin-top: 5px;
          color: #8a909c;
          font-size: 12px;
        }

        .links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 22px;
        }

        .links a {
          padding: 16px;
          border: 1px solid #e5e7ed;
          border-radius: 13px;
          background: #ffffff;
          color: #4f46e5;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .links a:hover {
          border-color: #c7c9dc;
        }

        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .links {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}