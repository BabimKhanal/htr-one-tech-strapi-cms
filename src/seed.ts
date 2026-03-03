import type { Core } from "@strapi/strapi";

/**
 * Basic types for Strapi 5 Blocks field to satisfy the seeder structure.
 */
type RichTextBlock =
  | {
      type: "heading";
      level?: number;
      children: { type?: "text"; text: string }[];
    }
  | {
      type: "paragraph";
      children: { type?: "text"; text: string }[];
    }
  | {
      type: "list";
      format?: "ordered" | "unordered";
      children: {
        type?: "list-item";
        children: { type?: "text"; text: string }[];
      }[];
    };

function p(text: string): RichTextBlock {
  return { type: "paragraph", children: [{ type: "text", text }] };
}

function h(text: string, level = 2): RichTextBlock {
  return { type: "heading", level, children: [{ type: "text", text }] };
}

function ul(items: string[]): RichTextBlock {
  return {
    type: "list",
    format: "unordered",
    children: items.map((t) => ({
      type: "list-item",
      children: [{ type: "text", text: t }],
    })),
  };
}

/**
 * Helper to ensure an entry exists by its slug.
 */
async function ensureBySlug(
  strapi: Core.Strapi,
  uid: any,
  slug: string,
  data: Record<string, any>,
) {
  try {
    const existing: any = await strapi.documents(uid).findMany({
      filters: { slug } as any,
      limit: 1,
      fields: ["documentId", "slug"] as any,
      status: "published" as any,
    });

    if (existing?.length) {
      // console.log(`Entry with slug "${slug}" already exists in ${uid}. Skipping.`);
      return { created: false, documentId: existing[0].documentId };
    }

    const created: any = await strapi.documents(uid).create({
      data: data as any,
      status: "published" as any,
    });

    console.log(`Created new entry in ${uid}: "${data.title || slug}"`);
    return { created: true, documentId: created.documentId };
  } catch (err: any) {
    console.error(
      `Failed to ensure entry by slug "${slug}" in ${uid}:`,
      err.message,
    );
    return { created: false, error: err.message };
  }
}

export async function seedData(strapi: Core.Strapi) {
  console.log("Starting data seeding process...");

  const now = new Date();

  const services = [
    {
      title: "Web Development",
      slug: "web-development",
      description:
        "Modern, responsive websites built for speed, clarity, and conversion.",
      content: [
        h("Modern Responsive Websites", 2),
        p(
          "Your website is not a brochure. It is an operating system for trust, visibility, and growth. We build high-performance websites that load quickly, communicate clearly, and guide users towards action.",
        ),
        h("Performance-Driven Build", 3),
        p(
          "We prioritise clean architecture, efficient assets, and scalable frameworks so your site stays fast as content and traffic grow. Mobile-first delivery is standard, not optional.",
        ),
        h("UX That Converts", 3),
        p(
          "We structure pages around real user behaviour: clearer navigation, better page hierarchy, and calls to action that feel natural rather than pushy.",
        ),
        h("What We Deliver", 3),
        ul([
          "Next.js / React builds with SEO-friendly foundations",
          "Fast load times, image optimisation, and Core Web Vitals focus",
          "CMS integration for long-term content control",
          "Analytics-ready setup (GA4, events, conversion tracking)",
          "Secure deployment and maintainable codebase",
        ]),
      ],
      is_active: true,
    },
    {
      title: "Software Development",
      slug: "software-development",
      description:
        "Scalable, secure digital systems engineered for long-term growth.",
      content: [
        h("Software That Supports Strategy", 2),
        p(
          "We build robust software that improves operational efficiency, strengthens decision-making, and supports sustainable scale. Every solution is engineered around your workflows, not forced into generic templates.",
        ),
        h("Architecture First", 3),
        p(
          "Strong software begins with strong foundations. We design modular systems that remain stable under increasing users, data, and integrations.",
        ),
        h("Security by Design", 3),
        p(
          "Security is embedded from day one: role-based access control, secure authentication, encryption best practices, and audit-friendly patterns.",
        ),
        h("Typical Deliverables", 3),
        ul([
          "Custom web and internal operations platforms",
          "SaaS product engineering",
          "API development and third-party integrations",
          "Database design and performance optimisation",
          "Cloud deployment and scaling support",
        ]),
      ],
      is_active: true,
    },
    {
      title: "Mobile App Development",
      slug: "mobile-app-development",
      description:
        "Mobile applications designed for reliability, adoption, and measurable outcomes.",
      content: [
        h("Mobile Apps Built for Real Usage", 2),
        p(
          "We build mobile apps that feel fast, intuitive, and dependable. Whether customer-facing or internal, we design flows that reduce friction and improve adoption.",
        ),
        h("Cross-Platform, Without Compromise", 3),
        p(
          "We use modern cross-platform frameworks when they deliver the best balance of speed-to-market and performance. Where native is required, we build accordingly.",
        ),
        h("What We Focus On", 3),
        ul([
          "Clear UX with strong onboarding and navigation",
          "Offline and low-connectivity handling when needed",
          "Secure authentication and role management",
          "Push notifications and event-based tracking",
          "App store readiness and release support",
        ]),
      ],
      is_active: true,
    },
    {
      title: "Cloud Solutions",
      slug: "cloud-solutions",
      description:
        "Cloud architecture, migration, and optimisation built for resilience and scale.",
      content: [
        h("Cloud That Improves Operations", 2),
        p(
          "Cloud is valuable when it reduces risk, improves reliability, and supports growth. We design cloud systems that are secure, cost-aware, and easy to maintain.",
        ),
        h("Migration With Control", 3),
        p(
          "We plan migrations carefully: minimal downtime, data integrity, and a clear cutover strategy. No guesswork. No rushed deployments.",
        ),
        h("What We Deliver", 3),
        ul([
          "Cloud architecture planning and implementation",
          "CI/CD pipelines and deployment automation",
          "Monitoring, logs, and performance observability",
          "Security hardening and access control",
          "Cost optimisation and scaling strategy",
        ]),
      ],
      is_active: true,
    },
    {
      title: "IT Consulting",
      slug: "it-consulting",
      description:
        "Strategic technology guidance aligned with business objectives.",
      content: [
        h("Technology Decisions With Commercial Clarity", 2),
        p(
          "We provide consulting that connects business goals to technical execution. The outcome is a clearer roadmap, fewer risks, and technology investments that deliver measurable impact.",
        ),
        h("Roadmaps, Audits, and Advisory", 3),
        p(
          "Whether you are modernising a stack, planning a new platform, or tightening security and performance, we provide structured recommendations and implementation guidance.",
        ),
        h("Typical Consulting Areas", 3),
        ul([
          "Technology strategy and digital roadmapping",
          "System and architecture reviews",
          "Security posture assessment and improvements",
          "Vendor/tool selection with clear criteria",
          "Delivery oversight and technical governance",
        ]),
      ],
      is_active: true,
    },
    {
      title: "UI/UX Design",
      slug: "ui-ux-design",
      description:
        "Design systems and user experiences built to reduce friction and increase conversion.",
      content: [
        h("Design That Supports Action", 2),
        p(
          "Good design is not decoration. It is clarity. We design interfaces that help users move through tasks confidently, reducing confusion and increasing completion rates.",
        ),
        h("From Research to Execution", 3),
        p(
          "We combine practical research with structured design systems so your product stays consistent as you scale. Components, spacing, typography, and interaction patterns are defined properly.",
        ),
        h("What We Deliver", 3),
        ul([
          "UX flows and wireframes based on user journeys",
          "UI design aligned with brand and accessibility",
          "Design systems and reusable components",
          "Prototypes for stakeholder alignment",
          "Handoff-ready specs for developers",
        ]),
      ],
      is_active: true,
    },
  ];

  const blogs = [
    {
      title: "Why Bespoke Software Wins",
      slug: "why-bespoke-software-wins",
      subtitle:
        "Where off-the-shelf tools create limits, custom systems create leverage.",
      content: [
        h("Off-the-Shelf Is Fast — Until It Isn’t", 2),
        p(
          "Generic tools are useful at the start, but they often force your operations into someone else’s structure. Over time, that creates workarounds, manual processes, and reporting gaps.",
        ),
        h("Bespoke Software Matches the Way You Operate", 3),
        p(
          "Custom systems are designed around your workflows, your approvals, your data, and your customers. That alignment reduces friction and improves performance.",
        ),
        h("Where Bespoke Delivers the Most Value", 3),
        ul([
          "Operational platforms with multiple teams and roles",
          "Complex workflows that require approvals and audit trails",
          "Automation that removes repeated admin tasks",
          "Dashboards and reporting that leadership actually uses",
          "Integrations across tools that don’t naturally talk to each other",
        ]),
      ],
      is_active: true,
    },
    {
      title: "The Future of AI in Software Development",
      slug: "future-of-ai-in-tech",
      subtitle:
        "AI is becoming part of how products are built, operated, and improved.",
      content: [
        h("AI Is Moving From Features to Foundations", 2),
        p(
          "AI is no longer limited to chatbots. It is increasingly used in operational forecasting, anomaly detection, workflow automation, and decision support.",
        ),
        h("Where Businesses Are Seeing Real Value", 3),
        ul([
          "Support automation and smarter triage",
          "Sales and pipeline insights from behavioural signals",
          "Predictive maintenance and operational alerts",
          "Content and knowledge search inside organisations",
          "Fraud detection and risk scoring",
        ]),
        h("The Key: Use AI With Clear Boundaries", 3),
        p(
          "The best implementations focus on measurable outcomes, clean data foundations, and clear human oversight. AI should strengthen reliability, not introduce uncertainty.",
        ),
      ],
      is_active: true,
    },
    {
      title: "Custom Software Performance",
      slug: "custom-software-performance",
      subtitle: "Performance is not a feature — it is a baseline expectation.",
      content: [
        h("Performance Impacts Trust", 2),
        p(
          "Slow systems cost time, reduce confidence, and create friction across teams. Performance is part of user experience, not separate from it.",
        ),
        h("What Strong Performance Looks Like", 3),
        ul([
          "Fast page and API response times under load",
          "Stable deployment processes and rollback strategy",
          "Efficient database structures and indexing",
          "Monitoring and alerts before users report issues",
          "Scalable architecture that grows without rewrites",
        ]),
      ],
      is_active: true,
    },
    {
      title: "Choosing the Right Tech Stack",
      slug: "choosing-the-right-tech-stack",
      subtitle:
        "The best stack is the one that supports delivery, stability, and future change.",
      content: [
        h("Avoid Stack Decisions Based on Trends", 2),
        p(
          "Teams often choose tools because they are popular. A better approach is choosing based on your constraints: time, budget, skills, security, and scale requirements.",
        ),
        h("A Practical Decision Framework", 3),
        ul([
          "What problem are we solving and what does success look like?",
          "What integrations are required now and later?",
          "What is the real expected user load and data growth?",
          "What skills exist in the team and hiring market?",
          "What is the maintenance plan after launch?",
        ]),
      ],
      is_active: true,
    },
  ];

  const projects = [
    {
      title: "Recruitment Operations Dashboard",
      subtitle:
        "Unified reporting and workflow visibility for multi-branch recruitment.",
      link: "https://example.com/recruitment-dashboard",
      active: true,
    },
    {
      title: "Care Staffing Request Portal",
      subtitle:
        "A structured portal to handle urgent staffing requests with audit trails.",
      link: "https://example.com/staffing-portal",
      active: true,
    },
    {
      title: "E-commerce Optimisation Platform",
      subtitle:
        "Performance-led storefront upgrades focused on conversion and speed.",
      link: "https://example.com/ecommerce-platform",
      active: true,
    },
    {
      title: "Internal CRM Modernisation",
      subtitle:
        "A bespoke CRM built around real workflows, not generic pipelines.",
      link: "https://example.com/crm-modernisation",
      active: true,
    },
  ];

  const faqs = [
    {
      question: "How do you scope a software project?",
      answer:
        "We start with objectives, workflows, constraints, and success metrics. Then we translate that into a structured scope, milestones, and a delivery plan that is realistic and measurable.",
    },
    {
      question: "Do you provide ongoing support after launch?",
      answer:
        "Yes. We offer maintenance and improvement support, including monitoring, performance tuning, security updates, and feature iterations as your needs evolve.",
    },
    {
      question: "Can you work with existing systems and codebases?",
      answer:
        "Yes. We frequently modernise existing platforms, improve performance, and integrate new systems without forcing full rebuilds where it’s not necessary.",
    },
    {
      question: "How do you handle security?",
      answer:
        "Security is built in from day one. We follow best practices for authentication, role control, secure data handling, and infrastructure hardening, with testing and review processes in place.",
    },
    {
      question: "What is your typical delivery process?",
      answer:
        "Discovery and planning, design and architecture, build and testing, deployment, and post-launch optimisation. You get visibility at every stage with clear checkpoints.",
    },
  ];

  const contactUsEntries = [
    {
      name: "John Doe",
      email: "john@example.com",
      message:
        "I am interested in your custom software services. Can we schedule a call?",
      read: false,
    },
    {
      name: "Jane Smith",
      email: "jane@company.com",
      message: "Our team needs help with a cloud migration project.",
      read: true,
    },
  ];

  const feedbackEntries = [
    {
      feedbacks:
        "The initial discovery session was very helpful. Highly recommended.",
      pulse: "Positive",
      reviewed: true,
    },
    {
      feedbacks: "Looking for more documentation on the deployment process.",
      pulse: "Neutral",
      reviewed: false,
    },
  ];

  // -------- Services --------
  console.log("Seeding Services...");
  for (const s of services) {
    await ensureBySlug(strapi, "api::service.service", s.slug, {
      ...s,
      publishedAt: now,
    });
  }

  // -------- Blogs --------
  console.log("Seeding Blogs...");
  for (const b of blogs) {
    await ensureBySlug(strapi, "api::blog.blog", b.slug, {
      ...b,
      publishedAt: now,
    });
  }

  // -------- Projects --------
  try {
    const projectCount = await strapi
      .documents("api::project.project")
      .count({ status: "published" } as any);
    if (projectCount === 0) {
      console.log("Seeding Projects...");
      for (const pr of projects) {
        await strapi.documents("api::project.project").create({
          data: { ...pr, publishedAt: now } as any,
          status: "published" as any,
        });
      }
    }
  } catch (err: any) {
    console.error("Failed to seed Projects:", err.message);
  }

  // -------- FAQs --------
  try {
    const faqCount = await strapi
      .documents("api::faq.faq")
      .count({ status: "published" } as any);
    if (faqCount === 0) {
      console.log("Seeding FAQs...");
      for (const f of faqs) {
        await strapi.documents("api::faq.faq").create({
          data: { ...f, publishedAt: now } as any,
          status: "published" as any,
        });
      }
    }
  } catch (err: any) {
    console.error("Failed to seed FAQs:", err.message);
  }

  // -------- Contact Us --------
  try {
    const contactCount = await strapi
      .documents("api::contact-us.contact-us")
      .count({ status: "published" } as any);
    if (contactCount === 0) {
      console.log("Seeding Contact Us entries...");
      for (const c of contactUsEntries) {
        await strapi.documents("api::contact-us.contact-us").create({
          data: { ...c, publishedAt: now } as any,
          status: "published" as any,
        });
      }
    }
  } catch (err: any) {
    console.error("Failed to seed Contact Us:", err.message);
  }

  // -------- Feedback --------
  try {
    const feedbackCount = await strapi
      .documents("api::feed-back.feed-back")
      .count({ status: "published" } as any);
    if (feedbackCount === 0) {
      console.log("Seeding Feedback entries...");
      for (const f of feedbackEntries) {
        await strapi.documents("api::feed-back.feed-back").create({
          data: { ...f, publishedAt: now } as any,
          status: "published" as any,
        });
      }
    }
  } catch (err: any) {
    console.error("Failed to seed Feedback:", err.message);
  }

  console.log("Seeding process completed.");
}
