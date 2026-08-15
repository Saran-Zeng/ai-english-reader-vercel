"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("请输入邮箱和密码。");
      return;
    }

    setMessage("登录功能正在完善中。");
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">AI ENGLISH READER</div>

        <h1>欢迎回来</h1>

        <p className="auth-description">
          登录你的 AI 英语学习空间。
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">邮箱</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your@email.com"
          />

          <label htmlFor="password">密码</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
          />

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button type="submit">
            登录
          </button>
        </form>

        <p className="auth-footer">
          还没有账号？{" "}
          <Link href="/register">
            创建账号
          </Link>
        </p>

        <Link href="/" className="back-link">
          ← 返回首页
        </Link>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(99, 102, 241, 0.08),
              transparent 34rem
            ),
            #f7f8fc;
        }

        .auth-card {
          width: min(420px, 100%);
          padding: 34px;
          border: 1px solid #e8eaf0;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 15px 50px rgba(22, 28, 45, 0.06);
        }

        .auth-badge {
          color: #6366f1;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
          margin-bottom: 12px;
        }

        h1 {
          margin: 0;
          font-size: 30px;
        }

        .auth-description {
          margin: 10px 0 28px;
          color: #858b98;
          font-size: 14px;
        }

        label {
          display: block;
          margin: 16px 0 7px;
          color: #444957;
          font-size: 13px;
          font-weight: 700;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          height: 48px;
          padding: 0 13px;
          border: 1px solid #dfe2e9;
          border-radius: 11px;
          outline: none;
          font-size: 14px;
        }

        input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
        }

        button {
          width: 100%;
          height: 48px;
          margin-top: 22px;
          border: 0;
          border-radius: 11px;
          background: #4f46e5;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .auth-message {
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 9px;
          background: #fff7f7;
          color: #b45353;
          font-size: 12px;
        }

        .auth-footer {
          margin: 22px 0 0;
          text-align: center;
          color: #777d89;
          font-size: 13px;
        }

        .auth-footer a {
          color: #4f46e5;
          font-weight: 700;
          text-decoration: none;
        }

        .back-link {
          display: block;
          margin-top: 20px;
          text-align: center;
          color: #9297a3;
          font-size: 12px;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}