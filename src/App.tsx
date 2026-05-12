import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Handshake,
  Home,
  Landmark,
  LineChart,
  Mail,
  Mountain,
  Network,
  PieChart,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import './App.css'

const baseUrl = '/PatrickOttleyPortfolio/'
const portraitUrl = `${baseUrl}assets/patrick-ottley.jpg`
const resumeUrl = `${baseUrl}JPO.Resume.pdf`

const navItems = [
  { id: 'hero', label: 'Home', icon: Home },
  { id: 'about', label: 'About', icon: User },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'work', label: 'Work', icon: LineChart },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'builds', label: 'Builds', icon: FolderOpen },
  { id: 'writing', label: 'Writing', icon: FileText },
  { id: 'contact', label: 'Contact', icon: Mail },
]

const sectionIds = navItems.map((item) => item.id)

const metrics = [
  { value: '2', label: 'Years in financial services' },
  { value: '$2M', label: 'Average prospective AUM pipeline' },
  { value: '250+', label: 'Daily targeted outreach calls' },
]

const availabilityRoles = [
  'Available for analyst opportunities',
  'Available for Paraplanning and Registered Client Service Associate roles',
  'Available for Entry-Level Project Manager roles',
]

const experiences = [
  {
    company: 'Northwestern Mutual',
    role: 'Financial Advisor / Financial Representative',
    period: '2023 - 2025',
    location: 'New York, NY',
    icon: Landmark,
    summary:
      'Built planning models, prepared client materials, and supported private wealth conversations for high-net-worth prospects and clients.',
    details: [
      'Created retirement, education, brokerage, tax, and estate planning scenarios with proprietary financial tools.',
      'Prepared asset allocation, alternative investment, fixed income, and working capital materials for advisor meetings.',
      'Generated a $2M average pipeline in prospective assets under management through disciplined daily outreach.',
    ],
  },
  {
    company: 'Vail Resorts',
    role: 'Professional Ski Instructor',
    period: '2025 - 2026',
    location: 'Vail, CO',
    icon: Mountain,
    summary:
      'Delivered precise, confidence-building instruction in a service environment defined by discretion, trust, and high standards.',
    details: [
      'Translated complex technical feedback into calm, individualized progression for guests.',
      'Maintained a professional standard aligned with a world-class guest experience.',
    ],
  },
  {
    company: 'Operations and Analytics',
    role: 'Startup, local business, and hospitality roles',
    period: '2018 - 2023',
    location: 'Vail Valley, CO',
    icon: BarChart3,
    summary:
      'Used data, client management, and service operations to improve delivery performance, customer engagement, and local business workflows.',
    details: [
      'Built KPI views with Excel, SQL, Tableau, and Power BI for a grocery delivery concierge startup.',
      'Supported sales, client engagement, website design, cash handling, and hospitality service operations.',
    ],
  },
]

const caseStudies = [
  {
    title: 'Private Wealth Planning Models',
    eyebrow: 'Financial modeling',
    icon: PieChart,
    description:
      'Translated client goals into retirement, brokerage, education, tax, and estate scenarios that advisors could use in planning conversations.',
    tags: ['401(k)', 'Roth IRA', 'Brokerage', 'Tax exposure'],
  },
  {
    title: 'Prospecting and Pipeline Discipline',
    eyebrow: 'Market development',
    icon: Network,
    description:
      'Built a high-touch prospecting process across hedge funds, consulting, private equity, and financial institutions.',
    tags: ['$2M pipeline', '135 prospects', 'HNWI outreach'],
  },
  {
    title: 'Operational Analytics',
    eyebrow: 'Business intelligence',
    icon: LineChart,
    description:
      'Created KPI reporting around delivery speed, holiday spend, customer demographics, and duration of stay for local operations.',
    tags: ['Excel', 'SQL', 'Tableau', 'Power BI'],
  },
]

const publicBuilds = [
  {
    title: 'The Forge',
    type: 'Browser workspace compiler',
    description:
      'A browser-safe compiler for guided templates, presets, previews, and downloadable ZIP workspaces.',
    sourceUrl: 'https://github.com/grogusungjinwoo/The-Forge',
    liveUrl: 'https://grogusungjinwoo.github.io/The-Forge/',
    tags: ['Templates', 'Presets', 'ZIP export'],
  },
  {
    title: 'Pokedex',
    type: 'Interactive reference app',
    description:
      'A clean, searchable Pokemon reference experience built as a public front-end project.',
    sourceUrl: 'https://github.com/grogusungjinwoo/Pokedex',
    liveUrl: 'https://grogusungjinwoo.github.io/Pokedex/',
    tags: ['API UI', 'Search', 'Front end'],
  },
  {
    title: 'DobbyDogzNYC.com',
    type: 'Local business website',
    description:
      'A client-facing web presence for a New York dog daycare brand, built around clear services and trust signals.',
    sourceUrl: 'https://github.com/grogusungjinwoo/dobbydogz-website',
    liveUrl: 'https://www.dobbydogznyc.com/',
    tags: ['Business site', 'Brand presence', 'Responsive'],
  },
  {
    title: 'Brokerage Simulator',
    type: 'Finance simulator',
    description:
      'A public brokerage-style simulation for practicing portfolio decisions, market views, and transaction workflows.',
    sourceUrl: 'https://github.com/grogusungjinwoo/Brokerage-Simulator',
    liveUrl: 'https://grogusungjinwoo.github.io/Brokerage-Simulator/',
    tags: ['Finance UI', 'Portfolio', 'Simulation'],
  },
]

const writingSamples = [
  {
    title: 'Philosophy of Animals: Morality of Zoos',
    description:
      'An ethics paper evaluating zoos through animal sentience, public education, conservation, and moral responsibility.',
    href: `${baseUrl}writing/writing-sample-ottley.pdf`,
    tags: ['Ethics', 'Animal philosophy', 'Argument'],
  },
  {
    title: 'Foucault and Information Technologies: The Owl of Minerva',
    description:
      'A political philosophy essay connecting discipline, surveillance, and information technologies through Foucault.',
    href: `${baseUrl}writing/writing-sample-ii-ottley-james.pdf`,
    tags: ['Political theory', 'Technology', 'Foucault'],
  },
  {
    title: 'Transcendence of Film to Art through Content-Imagination',
    description:
      'A philosophy of art paper examining how film can create content-imagination and simulated belief.',
    href: `${baseUrl}writing/writing-sample-iii-ottley-james.pdf`,
    tags: ['Aesthetics', 'Film', 'Analysis'],
  },
]

const skillGroups = [
  {
    title: 'Finance and Analysis',
    icon: Search,
    skills: ['Financial modeling', 'Asset allocation', 'Fundamental research', 'SEC and FINRA policy', 'Client planning'],
  },
  {
    title: 'Tools',
    icon: BarChart3,
    skills: ['Excel', 'Python', 'SQL', 'Tableau', 'Power BI', 'Adobe Photoshop'],
  },
  {
    title: 'Communication',
    icon: Handshake,
    skills: ['Client relationships', 'Investor materials', 'Targeted outreach', 'Writing tutoring', 'Presentation'],
  },
  {
    title: 'Credentials',
    icon: ShieldCheck,
    skills: ['Securities Industry Essentials', 'Series 6', 'Series 63', 'PSIA Alpine Level 1'],
  },
]

const credentials = [
  {
    icon: GraduationCap,
    title: 'Williams College',
    detail: 'B.A. Philosophy and Political Science, 2022',
  },
  {
    icon: BadgeCheck,
    title: 'FINRA Credentials',
    detail: 'Securities Industry Essentials, Series 6, and Series 63',
  },
  {
    icon: FileText,
    title: 'Analytical Foundation',
    detail: 'Critical thinking, research, writing, and quantitative decision support',
  },
]

function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible?.target.id) {
          setActiveSection(visible.target.id)
        }
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0.2, 0.45, 0.7] },
    )

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return activeSection
}

function Section({
  id,
  label,
  title,
  intro,
  children,
}: {
  id: string
  label: string
  title: string
  intro?: string
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      id={id}
      className="section"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="section-heading">
        <span>{label}</span>
        <h2>{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children}
    </motion.section>
  )
}

function App() {
  const activeSection = useActiveSection(sectionIds)
  const reduceMotion = useReducedMotion()

  return (
    <main className="portfolio-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="site-brand" aria-label="Patrick Ottley">
        <a href="#hero" className="brand-link">
          <span className="brand-mark">PO</span>
          <span>
            <strong>Patrick</strong>
            <em>Ottley</em>
          </span>
        </a>
      </header>

      <nav className="floating-nav" aria-label="Portfolio navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className={activeSection === id ? 'is-active' : undefined}
            aria-current={activeSection === id ? 'page' : undefined}
            title={label}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <section id="hero" className="hero-section">
        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="role-line">Financial Analyst - Philosophy and Political Science</p>
          <h1>Patrick Ottley</h1>
          <p className="hero-statement">
            I turn complex information into clear judgment for finance, strategy, and client-facing decisions.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href={resumeUrl} target="_blank" rel="noreferrer">
              <Download size={17} aria-hidden="true" />
              Download Resume
            </a>
            <a className="secondary-button" href="mailto:ottley.work@gmail.com" aria-label="Email Patrick Ottley">
              <Mail size={17} aria-hidden="true" />
              Email
            </a>
          </div>
        </motion.div>

        <motion.div
          className="portrait-panel"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={portraitUrl} alt="Patrick Ottley in a suit with a city view behind him" />
          <div className="portrait-caption">
            <span>Williams College</span>
            <strong>Finance, policy, and analytical judgment.</strong>
          </div>
        </motion.div>
      </section>

      <div className="metrics-strip" aria-label="Career highlights">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>

      <Section
        id="about"
        label="About"
        title="Analysis with a liberal arts spine"
        intro="A Williams College graduate who pairs financial services experience with philosophy, political science, and a practical eye for decision-making."
      >
        <div className="about-grid">
          <div className="about-copy">
            <p>
              Patrick brings two years of financial services experience at Northwestern Mutual, where he supported
              financial planning, private wealth conversations, prospect development, and advisor-facing materials.
            </p>
            <p>
              His background in philosophy and political science sharpens how he frames problems: define the question,
              test assumptions, weigh evidence, and communicate the decision clearly.
            </p>
          </div>
          <div className="credential-list">
            {credentials.map(({ icon: Icon, title, detail }) => (
              <article key={title}>
                <Icon size={20} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="experience"
        label="Experience"
        title="Roles that shaped the analytical toolkit"
        intro="Financial services, client trust, operational analytics, and high-standard service environments."
      >
        <div className="timeline">
          {experiences.map(({ company, role, period, location, icon: Icon, summary, details }) => (
            <article className="experience-card" key={`${company}-${period}`}>
              <div className="experience-meta">
                <Icon size={20} aria-hidden="true" />
                <div>
                  <span>{period}</span>
                  <small>{location}</small>
                </div>
              </div>
              <div className="experience-body">
                <h3>{company}</h3>
                <p className="experience-role">{role}</p>
                <p>{summary}</p>
                <ul>
                  {details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="work"
        label="Selected Work"
        title="Concise case studies from real experience"
        intro="No fake repositories. Just distilled examples of the kind of analysis, judgment, and execution Patrick brings to a team."
      >
        <div className="case-grid">
          {caseStudies.map(({ title, eyebrow, icon: Icon, description, tags }) => (
            <article className="case-card" key={title}>
              <div className="card-topline">
                <Icon size={22} aria-hidden="true" />
                <span>{eyebrow}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="tag-row">
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="skills"
        label="Skills"
        title="A compact professional toolkit"
        intro="Finance, research, data tools, communication, and credentials arranged for quick scanning."
      >
        <div className="skills-grid">
          {skillGroups.map(({ title, icon: Icon, skills }) => (
            <article className="skill-card" key={title}>
              <div className="skill-title">
                <Icon size={19} aria-hidden="true" />
                <h3>{title}</h3>
              </div>
              <div className="skill-tags">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="builds"
        label="Public Builds"
        title="Public builds"
        intro="A few public projects and sites that show the same bias toward practical, polished execution."
      >
        <div className="build-grid">
          {publicBuilds.map(({ title, type, description, sourceUrl, liveUrl, tags }) => (
            <article className="build-card" key={title}>
              <div className="card-topline">
                <FolderOpen size={22} aria-hidden="true" />
                <span>{type}</span>
              </div>
              <a className="card-title-link" href={sourceUrl} target="_blank" rel="noreferrer">
                <h3>{title}</h3>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <p>{description}</p>
              <div className="tag-row">
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="resource-actions">
                <a href={liveUrl} target="_blank" rel="noreferrer" aria-label={`${title} live site`}>
                  <ArrowUpRight size={16} aria-hidden="true" />
                  Live site
                </a>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="writing"
        label="Writing Samples"
        title="Writing samples"
        intro="Selected academic writing that reflects Patrick's research discipline, argument structure, and analytical range."
      >
        <div className="writing-grid">
          {writingSamples.map(({ title, description, href, tags }) => (
            <article className="writing-card" key={title}>
              <div className="writing-card-main">
                <div className="card-topline">
                  <FileText size={22} aria-hidden="true" />
                  <span>PDF sample</span>
                </div>
                <a className="card-title-link" href={href} target="_blank" rel="noreferrer">
                  <h3>{title}</h3>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </a>
                <p>{description}</p>
                <div className="tag-row">
                  {tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <section id="contact" className="contact-section">
        <div className="availability">
          <span className="availability-dot" aria-hidden="true" />
          <ul className="availability-list" aria-label="Role availability">
            {availabilityRoles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
        <h2>Let's work together.</h2>
        <p>
          For analyst, strategy, finance, or research-oriented opportunities, reach out directly or review the full
          resume.
        </p>
        <div className="contact-actions">
          <a href="mailto:ottley.work@gmail.com" aria-label="Email Patrick Ottley">
            <Mail size={18} aria-hidden="true" />
            Email
          </a>
          <a href="https://www.linkedin.com/in/j-patrick-o-73101473/" target="_blank" rel="noreferrer">
            <ArrowUpRight size={18} aria-hidden="true" />
            LinkedIn
          </a>
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            <Download size={18} aria-hidden="true" />
            Download Resume
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <span>Copyright 2026 Patrick Ottley</span>
        <span>Built with Vite, React, and Framer Motion</span>
      </footer>
    </main>
  )
}

export default App
