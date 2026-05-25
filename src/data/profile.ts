/** 个人资料 — 简介 / 简历 / 项目页共用 */
export const profile = {
  fullName: '吴汉东',
  tagline: '软件工程 · 全栈开发 · 竞赛实践',
  subtitle: '地大在读 · 专业前 10% · 前后端与工程化',
  intro:
    '中国地质大学（武汉）软件工程专业本科在读，综合排名专业前 10%。在校担任班长、学院学生会主席、党支部书记，具备团队协作与项目组织经验。关注 Vue3/React 现代前端与 SpringBoot/Go 后端，持续实践组件化开发与性能优化。',
  info: [
    { label: '姓名', value: '吴汉东' },
    { label: '生日', value: '2004 年 11 月 19 日' },
    { label: '城市', value: '武汉' },
    { label: '邮箱', value: '2303532728@qq.com', href: 'mailto:2303532728@qq.com' },
    { label: '电话', value: '18471609769' },
    { label: '面貌', value: '中共党员' },
    { label: '状态', value: '本科在读 · 寻求实习机会' },
  ],
  features: [
    {
      icon: 'stack',
      title: '全栈开发',
      description:
        '熟悉 Vue3、React、TypeScript 与 SpringBoot、Go/Gin，具备前后端分离架构与 RESTful 接口联调经验。',
    },
    {
      icon: 'bolt',
      title: '实时通信',
      description:
        'WebSocket 即时通讯、Redis 缓存、JWT 鉴权，在 IM 与健康管理系统中落地低延迟与高并发场景。',
    },
    {
      icon: 'chart',
      title: '性能优化',
      description:
        'SQL 索引优化、Redis 缓存、代码分割与虚拟滚动，核心接口与页面响应均有可量化提升。',
    },
    {
      icon: 'award',
      title: '竞赛与工程',
      description:
        'MathorCup 全国一等奖等多项竞赛荣誉，能将竞赛经验转化为可交付的全栈项目实践。',
    },
  ],
  featuredProject: {
    name: 'LIttle-Wechat',
    badge: '代表作',
    description: '即时通讯系统 — WebSocket 实时消息 · Redis 在线状态 · Electron 桌面端',
    href: 'https://github.com/Jenrimark',
    stars: '—',
    forks: '—',
    meta: 'SpringBoot + Vue3 + Electron',
  },
  skills: [
    { name: '前端开发（Vue3 / React / TS）', level: 88 },
    { name: '后端开发（SpringBoot / Go）', level: 82 },
    { name: '数据库与缓存（MySQL / Redis）', level: 80 },
    { name: '工程化与部署（Git / Docker / Nginx）', level: 75 },
    { name: '英语（CET4）', level: 70 },
  ],
  timeline: {
    education: [
      {
        role: '软件工程 · 本科',
        org: '中国地质大学（武汉）',
        period: '2023.09 — 至今',
        desc: '综合排名专业前 10%；班长、学院学生会主席、党支部书记。主修 Java、Go、数据结构、计算机网络、操作系统、软件工程等。',
      },
    ],
    work: [
      {
        role: '前端 / 交互开发实习生',
        org: '武汉美和易思 · 智慧就业 PDT',
        period: '2025.11 — 2026.04',
        desc: '负责「AI 数字人模拟面试」模块前端交互与视觉优化；Vue3 状态路由、Canvas 数字人动画、虚拟滚动等，页面响应提升约 30%。',
      },
    ],
    awards: [
      {
        role: 'MathorCup 数学应用挑战赛',
        org: '全国一等奖',
        period: '2025',
        desc: '大数据竞赛方向。',
      },
      {
        role: '电子商务「三创」挑战赛',
        org: '省赛一等奖',
        period: '2025',
        desc: '创新、创意及创业赛道。',
      },
      {
        role: 'RoboCup 中国赛先进视觉赛',
        org: '省赛二等奖 · 全国三等奖',
        period: '2025',
        desc: '3D 识别项目。',
      },
      {
        role: '全国大学生英语翻译大赛',
        org: '省级二等奖',
        period: '2024',
        desc: 'NETCCS。',
      },
    ],
  },
  selfEval:
    '工作积极认真，细心负责，勇于迎接新挑战。熟悉 Vue3/React 现代前端技术栈，关注 AI 辅助开发（Vibe Coding），具备快速学习并落地到实际项目的能力。',
  projectSections: [
    {
      id: 'opensource',
      title: '开源项目',
      icon: 'code',
      projects: [
        {
          title: 'LIttle-Wechat',
          description: '即时通讯系统，WebSocket 实时消息，Redis 在线状态，Electron 跨平台桌面端。',
          href: 'https://github.com/Jenrimark',
          meta: 'SpringBoot · Vue3 · Electron',
          color: '#e07a4f',
        },
        {
          title: 'Jenrimark 个人站',
          description: 'Astro 静态站，Git push 触发 Webhook 自动部署至家里 Windows + Nginx。',
          href: 'https://github.com/Jenrimark',
          meta: 'Astro · CI/CD',
          color: '#6b8cce',
        },
      ],
    },
    {
      id: 'visualization',
      title: '可视化作品',
      icon: 'chart',
      projects: [
        {
          title: '灵犀旅行',
          description: 'AI 旅游平台，百度地图 + ECharts 路线与景点可视化，Redis 缓存接口响应 300ms 内。',
          href: 'https://github.com/Jenrimark',
          meta: 'Vue3 · ECharts · MySQL',
          color: '#5aab8c',
        },
      ],
    },
    {
      id: 'tools',
      title: '实用工具',
      icon: 'tool',
      projects: [
        {
          title: '蝶启新生 · 健康管理',
          description: 'Vue3 + Go/Gin 全栈，JWT 鉴权，ECharts 多维健康指标，Nginx 反向代理部署。',
          href: 'https://github.com/Jenrimark',
          meta: 'Go · Vue3 · Redis',
          color: '#b07ad9',
        },
        {
          title: 'AI 数字人模拟面试',
          description: '实习期间负责的交互模块，Canvas 表情动画、题库虚拟滚动与面试流程状态机。',
          href: 'https://github.com/Jenrimark',
          meta: 'Vue3 · Canvas',
          color: '#d4a843',
        },
      ],
    },
  ],
} as const;
