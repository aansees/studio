export type ProjectMetaGroup = {
  label: string;
  items: string[];
};

export type ProjectItem = {
  id: number;
  slug: string;
  categories: string[];
  image: string;
  detailImage1: string;
  detailImage2: string;
  date: string;
  name: string;
  subtitle: string;
  clientImage: string;
  clientName: string;
  route: string;
  featuredInfo: string;
  featuredDescription: string;
  region: string;
  intro: string[];
  completed: string;
  engagement: string[];
  collaborators: string[];
  stack: string[];
  storyLabel: string;
  story: string[];
  qualitiesLabel: string;
  qualityGroups: ProjectMetaGroup[];
  closing: string;
};

export const projectsData: ProjectItem[] = [
  {
    id: 1,
    slug: "nova-commerce",
    categories: ["Website", "Commerce"],
    image: "/spaces/space-1.jpg",
    detailImage1: "/sample-space/sample-space-1.jpg",
    detailImage2: "/sample-space/sample-space-2.jpg",
    date: "Q1 2025",
    name: "Nova Commerce",
    subtitle: "Brand website and campaign CMS for a premium commerce team",
    clientImage: "/spaces/client-1.jpeg",
    clientName: "Nova Retail",
    route: "/projects/nova-commerce",
    featuredInfo: "A conversion-focused website built for launches, drops, and paid traffic",
    featuredDescription:
      "We replaced a brittle marketing stack with a sharp, reusable Next.js site that lets the team ship campaigns, land product stories, and keep performance under control.",
    region: "Remote / Global",
    intro: [
      "Nova Commerce needed a site that could carry product storytelling without slowing campaign launches down. We redesigned the information hierarchy, tightened page performance, and built a modular CMS workflow for launch weeks.",
      "The result is a marketing surface that feels editorial but behaves like a system. Landing pages, collection pages, and promotional moments now ship from reusable blocks instead of one-off builds.",
    ],
    completed: "March 2025",
    engagement: [
      "Strategy and messaging alignment",
      "Next.js marketing website",
      "Reusable campaign CMS",
    ],
    collaborators: [
      "ANCS product strategy",
      "Brand design direction",
      "Frontend engineering",
    ],
    stack: ["Next.js 16", "Motion systems", "CMS modeling", "Analytics instrumentation"],
    storyLabel: "Launch Architecture",
    story: [
      "The main challenge was scale without clutter. Nova's team needed room for product drops, evergreen storytelling, and paid traffic landing pages without rebuilding the same layouts every sprint.",
      "We solved that by defining a page grammar: modular sections, predictable motion rules, and a content model that supports experimentation while keeping the front-end fast and coherent.",
    ],
    qualitiesLabel: "Delivery Notes",
    qualityGroups: [
      {
        label: "Experience",
        items: ["Fast page loads", "Clear product hierarchy", "Editorial storytelling"],
      },
      {
        label: "Delivery",
        items: ["Launch-ready templates", "Reusable campaign sections", "SEO-safe structure"],
      },
      {
        label: "Platform",
        items: ["App Router setup", "Componentized sections", "Analytics hooks"],
      },
      {
        label: "Outcome",
        items: ["Faster launches", "Cleaner handoff", "Better campaign control"],
      },
    ],
    closing:
      "Nova now runs launches from a system the internal team understands. The site looks premium, but more importantly it behaves predictably under deadline pressure.",
  },
  {
    id: 2,
    slug: "pulse-ops",
    categories: ["System", "Operations"],
    image: "/spaces/space-2.jpg",
    detailImage1: "/sample-space/sample-space-1.jpg",
    detailImage2: "/sample-space/sample-space-2.jpg",
    date: "Q4 2024",
    name: "Pulse Ops",
    subtitle: "Operations system for approvals, handoffs, and reporting",
    clientImage: "/spaces/client-2.jpeg",
    clientName: "Pulse Logistics",
    route: "/projects/pulse-ops",
    featuredInfo: "A staff-facing platform that replaced spreadsheets and status ping-pong",
    featuredDescription:
      "Pulse Ops unified approvals, task ownership, and live reporting into one internal product so operations teams could stop stitching together spreadsheets, chat threads, and manual updates.",
    region: "North America",
    intro: [
      "Pulse Logistics was managing real work across too many disconnected tools. Teams were repeating data entry, approvals were buried in messages, and reporting only existed after someone cleaned the spreadsheet.",
      "We mapped the actual workflow, designed a role-based interface around it, and delivered a system that makes current status, blockers, and next actions obvious without extra admin overhead.",
    ],
    completed: "November 2024",
    engagement: [
      "Workflow discovery",
      "Internal system design",
      "Approval and reporting flows",
    ],
    collaborators: [
      "Operations leadership",
      "ANCS product design",
      "System implementation",
    ],
    stack: ["Permission models", "Structured forms", "Reporting surfaces", "Audit-friendly flows"],
    storyLabel: "Operational Clarity",
    story: [
      "Rather than digitizing every broken habit, we focused on the points where information changed hands. Requests, approvals, and reporting all became first-class states in the interface.",
      "That shift reduced ambiguity. Managers can review queues in one place, teams can see ownership instantly, and reporting now reflects the live system instead of an end-of-week cleanup exercise.",
    ],
    qualitiesLabel: "System Qualities",
    qualityGroups: [
      {
        label: "Interface",
        items: ["Role-based dashboards", "Clear approval states", "Low-friction data entry"],
      },
      {
        label: "Governance",
        items: ["Audit visibility", "Ownership tracking", "Structured permissions"],
      },
      {
        label: "Reporting",
        items: ["Live status views", "Decision-ready summaries", "Shared source of truth"],
      },
      {
        label: "Outcome",
        items: ["Less admin debt", "Fewer missed handoffs", "Faster operational reviews"],
      },
    ],
    closing:
      "Pulse Ops gave the team a working system instead of another dashboard. The difference is that every screen now supports a real operational decision.",
  },
  {
    id: 3,
    slug: "fieldsync-android",
    categories: ["Android", "Offline"],
    image: "/spaces/space-3.jpg",
    detailImage1: "/sample-space/sample-space-1.jpg",
    detailImage2: "/sample-space/sample-space-2.jpg",
    date: "Q3 2024",
    name: "FieldSync Android",
    subtitle: "Offline-first Android app for field teams working on site",
    clientImage: "/spaces/client-3.jpeg",
    clientName: "FieldSync",
    route: "/projects/fieldsync-android",
    featuredInfo: "An Android product built for real conditions, not perfect connectivity",
    featuredDescription:
      "We designed FieldSync around the reality of low-signal environments, repetitive tasks, and fast on-site decisions so crews could capture work once and sync later.",
    region: "Field teams / Multi-site",
    intro: [
      "FieldSync needed an Android experience that respected actual field conditions: patchy connectivity, short task windows, glare-heavy environments, and users who do not have time for decorative interfaces.",
      "We focused on speed, resilience, and legibility. Core actions are large, flows are sequential, and offline handling is explicit so teams always know what has synced and what has not.",
    ],
    completed: "August 2024",
    engagement: [
      "Android UX architecture",
      "Offline-first task flows",
      "Sync-safe data states",
    ],
    collaborators: [
      "Field operations leads",
      "ANCS mobile design",
      "Android engineering",
    ],
    stack: ["Android patterns", "Offline queue states", "Large-target interactions", "Status feedback"],
    storyLabel: "Built For The Field",
    story: [
      "The product needed to reduce cognitive load during active work, so we stripped interactions down to what crews actually need on site: check in, update progress, attach proof, move on.",
      "By designing for interruption and sync uncertainty from the start, the app feels trustworthy. Users always know what happened, what is pending, and what action is safe to take next.",
    ],
    qualitiesLabel: "Mobile Delivery",
    qualityGroups: [
      {
        label: "Usability",
        items: ["Large tap targets", "High-contrast states", "Fast repeat actions"],
      },
      {
        label: "Reliability",
        items: ["Offline persistence", "Visible sync states", "Conflict-aware flows"],
      },
      {
        label: "Platform",
        items: ["Android-first layouts", "Permission-aware capture", "Field-ready forms"],
      },
      {
        label: "Outcome",
        items: ["Better data quality", "Less re-entry", "Stronger crew adoption"],
      },
    ],
    closing:
      "FieldSync Android works because it was shaped around the rhythm of the job, not around a generic mobile template.",
  },
  {
    id: 4,
    slug: "signal-live",
    categories: ["Interactive", "Campaign"],
    image: "/spaces/space-4.jpg",
    detailImage1: "/sample-space/sample-space-1.jpg",
    detailImage2: "/sample-space/sample-space-2.jpg",
    date: "Q2 2024",
    name: "Signal Live",
    subtitle: "Interactive launch experience for a music-tech product drop",
    clientImage: "/spaces/client-4.jpeg",
    clientName: "Signal Audio",
    route: "/projects/signal-live",
    featuredInfo: "A motion-heavy interactive site that still stays readable and fast",
    featuredDescription:
      "Signal Live combined product storytelling, motion choreography, and launch-timed interaction to create a digital release experience with energy but without visual noise.",
    region: "Launch campaign / Global",
    intro: [
      "Signal Audio wanted a launch surface that felt alive without collapsing into gimmick. The site had to carry anticipation, show the product clearly, and support traffic spikes during release.",
      "We designed a narrative flow built on pacing: motion where it matters, stillness where clarity is needed, and modular sections that let the campaign team update content around launch day.",
    ],
    completed: "June 2024",
    engagement: [
      "Interactive concept direction",
      "Launch storytelling design",
      "Motion-led front-end build",
    ],
    collaborators: [
      "Campaign direction",
      "ANCS interaction design",
      "Front-end motion engineering",
    ],
    stack: ["GSAP motion", "Sequenced storytelling", "Launch-ready CMS hooks", "Performance tuning"],
    storyLabel: "Controlled Motion",
    story: [
      "The challenge was balance. Too little movement and the launch felt flat. Too much and the message disappeared. We treated motion as structure, not decoration, so it guided attention instead of competing with it.",
      "That discipline kept the site sharp under pressure. Product detail, pacing, and conversion moments stay intact even while the experience carries a distinct sense of atmosphere.",
    ],
    qualitiesLabel: "Experience Notes",
    qualityGroups: [
      {
        label: "Motion",
        items: ["Sequenced reveals", "Scroll-led pacing", "Purposeful transitions"],
      },
      {
        label: "Structure",
        items: ["Clear storytelling arc", "Reusable campaign modules", "Readable hierarchy"],
      },
      {
        label: "Build",
        items: ["Optimized assets", "Stable interaction states", "Launch-safe implementation"],
      },
      {
        label: "Outcome",
        items: ["Memorable release", "Sharpened product story", "Stronger audience engagement"],
      },
    ],
    closing:
      "Signal Live proved that interactive work performs best when it is tightly edited. The result feels energetic, not excessive.",
  },
  {
    id: 5,
    slug: "atlas-hq",
    categories: ["System", "Portal"],
    image: "/spaces/space-5.jpg",
    detailImage1: "/sample-space/sample-space-1.jpg",
    detailImage2: "/sample-space/sample-space-2.jpg",
    date: "Q1 2024",
    name: "Atlas HQ",
    subtitle: "Client portal and internal workspace for a growing service business",
    clientImage: "/spaces/client-5.jpeg",
    clientName: "Atlas Partners",
    route: "/projects/atlas-hq",
    featuredInfo: "A shared system for clients, delivery teams, and account leads",
    featuredDescription:
      "Atlas HQ brought scattered updates, files, and timelines into one product so clients could self-serve progress while the internal team worked from the same operational view.",
    region: "Agency operations",
    intro: [
      "Atlas Partners needed one system that could serve two audiences at once: clients who wanted visibility and internal teams who needed operational control.",
      "We designed a layered product with clear permissions, shared timelines, and content surfaces that feel transparent to clients without exposing unnecessary complexity underneath.",
    ],
    completed: "February 2024",
    engagement: [
      "Portal UX design",
      "Operational workspace architecture",
      "Shared timeline and file surfaces",
    ],
    collaborators: [
      "Delivery management",
      "ANCS systems design",
      "Platform implementation",
    ],
    stack: ["Portal permissions", "Shared workspaces", "File and timeline modules", "Notification rules"],
    storyLabel: "Shared Visibility",
    story: [
      "The project succeeded by separating visibility from control. Clients receive timely, readable progress. Internal teams keep the depth they need to actually run the work.",
      "That distinction reduced update overhead and made the portal feel useful instead of performative. Every screen has a clear owner and a practical reason to exist.",
    ],
    qualitiesLabel: "Portal Design",
    qualityGroups: [
      {
        label: "Clients",
        items: ["Readable project status", "Self-serve updates", "Clear next steps"],
      },
      {
        label: "Internal Teams",
        items: ["Operational detail", "Assignment clarity", "Shared notes and files"],
      },
      {
        label: "Platform",
        items: ["Permission layers", "Timeline modules", "Notification logic"],
      },
      {
        label: "Outcome",
        items: ["Less manual reporting", "Cleaner client experience", "Stronger delivery rhythm"],
      },
    ],
    closing:
      "Atlas HQ became a practical layer between account communication and actual delivery work, which is exactly where it needed to sit.",
  },
  {
    id: 6,
    slug: "lattice-learn",
    categories: ["Website", "Platform"],
    image: "/spaces/space-6.jpg",
    detailImage1: "/sample-space/sample-space-1.jpg",
    detailImage2: "/sample-space/sample-space-2.jpg",
    date: "Q4 2023",
    name: "Lattice Learn",
    subtitle: "Learning platform with onboarding, progress tracking, and support flows",
    clientImage: "/spaces/client-6.jpeg",
    clientName: "Lattice Academy",
    route: "/projects/lattice-learn",
    featuredInfo: "A learning experience built to reduce drop-off after signup",
    featuredDescription:
      "Lattice Learn combined marketing entry points, onboarding design, and platform structure into one connected journey so users did not fall out between signup and activation.",
    region: "Education / Product-led growth",
    intro: [
      "Lattice Academy had strong content but weak continuity. Marketing pages, onboarding, and the learning product felt like separate experiences stitched together after the fact.",
      "We rebuilt the journey as one system. Messaging, interface hierarchy, and support states now move users from first click to active progress without the usual disconnect between acquisition and product.",
    ],
    completed: "October 2023",
    engagement: [
      "Lifecycle mapping",
      "Platform interface design",
      "Onboarding and progress systems",
    ],
    collaborators: [
      "Growth team",
      "ANCS UX design",
      "Front-end product build",
    ],
    stack: ["Lifecycle flows", "Progress components", "Learning states", "Support surfaces"],
    storyLabel: "Connected Journey",
    story: [
      "The focus was continuity. Users should not feel like they entered one product to sign up and another product to learn. That required tighter language, stronger state design, and clearer progress cues.",
      "By aligning those layers, the platform feels simpler even though it supports more states, more content, and more support pathways than before.",
    ],
    qualitiesLabel: "Platform Notes",
    qualityGroups: [
      {
        label: "Onboarding",
        items: ["Clear first actions", "Guided setup", "Immediate value cues"],
      },
      {
        label: "Learning Flow",
        items: ["Progress visibility", "Structured modules", "Low-friction navigation"],
      },
      {
        label: "Support",
        items: ["Helpful empty states", "Contextual prompts", "Reduced confusion"],
      },
      {
        label: "Outcome",
        items: ["Lower drop-off", "Better activation", "More consistent product story"],
      },
    ],
    closing:
      "Lattice Learn now feels like one product with a clear pace, not a collection of disconnected screens.",
  },
  {
    id: 7,
    slug: "orbit-experience",
    categories: ["Interactive", "Exhibit"],
    image: "/spaces/space-7.jpg",
    detailImage1: "/sample-space/sample-space-1.jpg",
    detailImage2: "/sample-space/sample-space-2.jpg",
    date: "Q3 2023",
    name: "Orbit Experience",
    subtitle: "Interactive kiosk and live dashboard for a public exhibit",
    clientImage: "/spaces/client-7.jpeg",
    clientName: "Orbit Labs",
    route: "/projects/orbit-experience",
    featuredInfo: "A public-facing interactive system with a controlled operator layer behind it",
    featuredDescription:
      "Orbit Experience joined a visitor-facing touchscreen with a live control surface so the exhibit could feel playful for the audience and dependable for the team operating it.",
    region: "Physical + digital activation",
    intro: [
      "Orbit Labs needed an experience that could engage visitors in the moment while still being manageable by the operators running the exhibit. Public interaction and backstage control had to work together.",
      "We designed both layers as one system: expressive on the surface, deliberate underneath. The public interface stays simple, while the operator layer manages content, timing, and recovery states.",
    ],
    completed: "July 2023",
    engagement: [
      "Interactive concept design",
      "Kiosk flow architecture",
      "Operator dashboard planning",
    ],
    collaborators: [
      "Experience producers",
      "ANCS interaction design",
      "Realtime systems support",
    ],
    stack: ["Touch-first interface", "Realtime status states", "Operator controls", "Content sequencing"],
    storyLabel: "Public Interaction, Private Control",
    story: [
      "The visible layer needed to be inviting enough for first-time visitors, but the real complexity sat behind it. Operators needed confidence that the experience could be monitored, reset, and updated quickly.",
      "That dual-perspective design is what gave the project longevity. The exhibit remains expressive for the audience and practical for the team maintaining it.",
    ],
    qualitiesLabel: "Experience System",
    qualityGroups: [
      {
        label: "Visitor Layer",
        items: ["Touch-first interaction", "Fast comprehension", "Clear visual cues"],
      },
      {
        label: "Operator Layer",
        items: ["Reset-safe flows", "Live status monitoring", "Content control"],
      },
      {
        label: "Environment",
        items: ["Physical context awareness", "Queue-friendly pacing", "Accessible interactions"],
      },
      {
        label: "Outcome",
        items: ["Smoother exhibit runtime", "Stronger visitor engagement", "Lower support burden"],
      },
    ],
    closing:
      "Orbit Experience works because it treats interaction design and operational reliability as the same problem, not two separate ones.",
  },
];

export const spacesData = projectsData;

export function getProjectBySlug(slug: string) {
  return projectsData.find((project) => project.slug === slug);
}
