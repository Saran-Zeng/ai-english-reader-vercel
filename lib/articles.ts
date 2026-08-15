export type ArticleParagraph = {
  id: string;
  english: string;
  chinese: string;
};

export type LongArticle = {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  category: string;
  cover: string;
  description: string;
  paragraphs: ArticleParagraph[];
};

export const longArticles: LongArticle[] = [
  {
    id: "future-of-work",
    title: "The Future of Work",
    subtitle: "How technology is changing the way we work",
    level: "Intermediate",
    category: "Technology",
    cover: "💻",
    description:
      "Technology is changing the workplace faster than ever. Learn how artificial intelligence, remote work, and automation are creating new opportunities and challenges.",
    paragraphs: [
      {
        id: "p1",
        english:
          "The way people work has changed dramatically over the past few decades. Computers, smartphones, and the internet have transformed offices and made it possible for people to communicate across the world in seconds.",
        chinese:
          "过去几十年里，人们工作的方式发生了巨大变化。电脑、智能手机和互联网改变了办公室的工作方式，也让人们能够在几秒钟内与世界各地的人进行交流。",
      },
      {
        id: "p2",
        english:
          "Today, artificial intelligence is becoming another important part of the workplace. AI can analyze large amounts of information, answer questions, write reports, and help people make better decisions.",
        chinese:
          "如今，人工智能正在成为工作场所中的另一个重要组成部分。AI 可以分析大量信息、回答问题、撰写报告，并帮助人们做出更好的决定。",
      },
      {
        id: "p3",
        english:
          "Some people worry that automation will replace human workers. However, history shows that new technology often creates new kinds of jobs while changing existing ones. The important question is whether people can learn new skills quickly enough.",
        chinese:
          "一些人担心自动化会取代人类劳动者。然而，历史表明，新技术往往会创造新的工作，同时改变原有的工作。真正重要的问题是，人们能否足够快地学习新的技能。",
      },
      {
        id: "p4",
        english:
          "Remote work has also become increasingly common. Employees can work from home, communicate through video meetings, and collaborate with colleagues who live in different countries.",
        chinese:
          "远程办公也变得越来越普遍。员工可以在家工作，通过视频会议进行沟通，还可以与生活在不同国家的同事合作。",
      },
      {
        id: "p5",
        english:
          "This flexibility can improve people's lives, but it also creates new challenges. Workers may find it difficult to separate their professional and personal lives, and companies need new ways to build trust and maintain communication.",
        chinese:
          "这种灵活性可以改善人们的生活，但也带来了新的挑战。员工可能会发现很难把工作和个人生活分开，而企业也需要寻找新的方式来建立信任并保持沟通。",
      },
      {
        id: "p6",
        english:
          "The future of work will probably combine human creativity with powerful digital tools. Instead of simply competing with machines, successful workers may learn how to use technology as a partner.",
        chinese:
          "未来的工作很可能会把人类的创造力与强大的数字工具结合起来。成功的劳动者可能不会简单地与机器竞争，而是学会把技术当作合作伙伴来使用。",
      },
      {
        id: "p7",
        english:
          "For individuals, continuous learning will become increasingly important. The ability to adapt, communicate, solve problems, and learn new technologies may be more valuable than knowing how to perform one specific task.",
        chinese:
          "对于个人来说，持续学习将变得越来越重要。适应变化、沟通、解决问题以及学习新技术的能力，可能会比掌握某一项具体任务更加有价值。",
      },
      {
        id: "p8",
        english:
          "Technology will continue to change the workplace, but people will remain at the center of it. The most successful future may not be one where machines replace humans, but one where humans and machines work together.",
        chinese:
          "技术将继续改变工作场所，但人仍然会处于其中的核心位置。最成功的未来可能并不是机器取代人类，而是人类和机器共同工作。",
      },
    ],
  },

  {
    id: "power-of-reading",
    title: "The Power of Reading",
    subtitle: "Why reading every day can change your life",
    level: "Intermediate",
    category: "Education",
    cover: "📚",
    description:
      "Reading is one of the simplest ways to improve knowledge, language ability, and critical thinking.",
    paragraphs: [
      {
        id: "p1",
        english:
          "Reading is one of the oldest ways humans have used to learn from one another. A good book can introduce us to new ideas, different cultures, and experiences that we may never have in our own lives.",
        chinese:
          "阅读是人类互相学习的最古老方式之一。一本好书可以让我们接触新的思想、不同的文化，以及我们自己可能永远不会经历的人生体验。",
      },
      {
        id: "p2",
        english:
          "Regular reading can also improve language ability. When learners read English frequently, they naturally encounter useful vocabulary, sentence structures, and expressions many times.",
        chinese:
          "经常阅读还可以提高语言能力。当学习者经常阅读英语时，他们会自然地反复遇到有用的词汇、句型和表达方式。",
      },
      {
        id: "p3",
        english:
          "Another benefit of reading is that it develops concentration. In a world full of short videos and constant notifications, spending twenty or thirty minutes with a book can train the mind to focus on one thing.",
        chinese:
          "阅读的另一个好处是能够培养专注力。在一个充满短视频和不断提醒的世界里，每天花二三十分钟阅读一本书，可以训练大脑专注于一件事情。",
      },
      {
        id: "p4",
        english:
          "Reading does not need to be difficult. The most important thing is to choose material that is interesting enough to keep you reading. As your ability improves, you can gradually move to more challenging texts.",
        chinese:
          "阅读不需要很难。最重要的是选择足够有趣、能够让你坚持阅读的材料。随着能力提高，你可以逐渐阅读更有挑战性的文章。",
      },
      {
        id: "p5",
        english:
          "The key is consistency. Reading ten pages every day may seem small, but the result becomes significant after several months or years.",
        chinese:
          "关键在于坚持。每天阅读十页看起来很少，但坚持几个月甚至几年之后，效果会非常明显。",
      },
    ],
  },

  {
    id: "small-habits",
    title: "Small Habits, Big Changes",
    subtitle: "How small actions can create lasting results",
    level: "Intermediate",
    category: "Life",
    cover: "🌱",
    description:
      "Major changes often begin with small habits. This article explores why consistency is more powerful than motivation.",
    paragraphs: [
      {
        id: "p1",
        english:
          "People often believe that success requires a dramatic change. They imagine waking up one morning with unlimited motivation and completely changing their lives.",
        chinese:
          "人们常常认为成功需要一次巨大的改变。他们想象自己某天早晨醒来，拥有无限的动力，然后彻底改变自己的生活。",
      },
      {
        id: "p2",
        english:
          "In reality, lasting change usually begins with something much smaller. A person who wants to become healthier might begin by walking for ten minutes every day.",
        chinese:
          "实际上，持久的改变通常从更小的事情开始。一个想变得更健康的人，可以先从每天散步十分钟开始。",
      },
      {
        id: "p3",
        english:
          "Small habits are powerful because they are easy to repeat. When an action becomes part of a daily routine, it requires less effort and less motivation.",
        chinese:
          "小习惯之所以强大，是因为它们很容易重复。当一个行为成为日常习惯后，它需要的努力和动力都会减少。",
      },
      {
        id: "p4",
        english:
          "Over time, these small actions can produce surprisingly large results. The most important step is not making a perfect plan, but starting with an action that you can continue.",
        chinese:
          "随着时间推移，这些微小的行动可以产生惊人的结果。最重要的并不是制定一个完美的计划，而是从一个你能够坚持下去的行动开始。",
      },
    ],
  },
];

export function getArticle(id: string) {
  return longArticles.find((article) => article.id === id);
}