"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    href: "/reader",
    icon: "AI",
    title: "AI Reading",
    description: "AI English Reader",
  },
  {
    href: "/long-articles",
    icon: "BOOK",
    title: "Long Articles",
    description: "Immersive Reading",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`);

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">
        LEARNING
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "sidebar-link sidebar-link-active"
                  : "sidebar-link"
              }
            >
              <div className="sidebar-icon">
                {item.icon}
              </div>

              <div className="sidebar-item-copy">
                <div className="sidebar-item-title">
                  {item.title}
                </div>

                <div className="sidebar-item-description">
                  {item.description}
                </div>
              </div>

              {active && (
                <span className="sidebar-active-indicator" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-separator" />

      <div className="sidebar-section-label">
        LIBRARY
      </div>

      <nav className="sidebar-nav">
        <Link
          href="/articles"
          className={
            isActive("/articles")
              ? "sidebar-link sidebar-link-active"
              : "sidebar-link"
          }
        >
          <div className="sidebar-icon">
            LIB
          </div>

          <div className="sidebar-item-copy">
            <div className="sidebar-item-title">
              Article Library
            </div>

            <div className="sidebar-item-description">
              Reading History
            </div>
          </div>

          {isActive("/articles") && (
            <span className="sidebar-active-indicator" />
          )}
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-line">
          <span className="footer-dot" />
          <span>AI English Reader</span>
        </div>

        <div className="sidebar-version">
          Reading Edition
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 248px;
          min-width: 248px;
          flex-shrink: 0;

          min-height: calc(100vh - 64px);

          display: flex;
          flex-direction: column;

          padding: 28px 16px 20px;

          background: #ffffff;
          border-right: 1px solid #e8eaf0;
        }

        .sidebar-section-label {
          padding: 0 12px;
          margin: 0 0 10px;

          color: #a1a6b1;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: 0.16em;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sidebar-link {
          position: relative;

          display: flex;
          align-items: center;

          min-height: 64px;

          padding: 9px 12px;

          gap: 12px;

          border-radius: 14px;

          color: #69707d;
          text-decoration: none;

          transition:
            background 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;
        }

        .sidebar-link:hover {
          background: #f7f8fb;
          color: #303542;
        }

        .sidebar-link-active {
          background: linear-gradient(
            135deg,
            #f1f2ff,
            #f7f7ff
          );

          color: #4f46e5;
        }

        .sidebar-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: #f4f5f8;

          color: #747b88;

          font-size: 9px;
          font-weight: 900;

          letter-spacing: 0.02em;

          transition:
            background 0.18s ease,
            color 0.18s ease;
        }

        .sidebar-link-active .sidebar-icon {
          background: #ffffff;
          color: #5b55e8;

          box-shadow:
            0 3px 10px
            rgba(79, 70, 229, 0.08);
        }

        .sidebar-item-copy {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 4px;
        }

        .sidebar-item-title {
          font-size: 12px;
          font-weight: 800;

          line-height: 1.2;
        }

        .sidebar-item-description {
          color: #9da2ad;

          font-size: 9px;

          line-height: 1.2;

          white-space: nowrap;
        }

        .sidebar-link-active
          .sidebar-item-description {
          color: #8588b9;
        }

        .sidebar-active-indicator {
          width: 5px;
          height: 5px;

          flex-shrink: 0;

          margin-left: auto;

          border-radius: 50%;

          background: #6366f1;

          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.08);
        }

        .sidebar-separator {
          height: 1px;

          margin: 24px 10px;

          background: #eef0f4;
        }

        .sidebar-footer {
          margin-top: auto;

          padding: 16px 12px 4px;

          border-top: 1px solid #f0f1f4;
        }

        .sidebar-footer-line {
          display: flex;
          align-items: center;

          gap: 7px;

          color: #7f8591;

          font-size: 9px;
          font-weight: 700;
        }

        .footer-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: #6366f1;
        }

        .sidebar-version {
          margin-top: 6px;

          color: #b0b4bd;

          font-size: 8px;
        }

        @media (max-width: 800px) {
          .sidebar {
            width: 100%;
            min-width: 0;
            min-height: auto;

            padding: 10px;

            border-right: 0;
            border-bottom: 1px solid #e8eaf0;
          }

          .sidebar-section-label,
          .sidebar-footer,
          .sidebar-separator {
            display: none;
          }

          .sidebar-nav {
            flex-direction: row;

            overflow-x: auto;

            padding-bottom: 2px;
          }

          .sidebar-link {
            min-width: 180px;
          }
        }
      `}</style>
    </aside>
  );
}
