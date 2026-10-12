export const capabilities = [
  { title: "Full-stack products", text: "React and Next.js front ends over FastAPI, Node and Django back ends." },
  { title: "AI engineering", text: "Agentic workflows, RAG, context engineering and LLM evaluation across OpenAI, Gemini and Anthropic models." },
  { title: "Backend and architecture", text: "REST APIs, background processing, PostgreSQL, MongoDB and Redis." },
  { title: "Cloud and infrastructure", text: "AWS, Google Cloud, Docker and Terraform." },
  { title: "Developer tools", text: "Code-understanding, incident-response and local-first desktop tooling." },
  { title: "Applied ML", text: "Time-series prediction, multimodal models and learning-augmented algorithms." },
];

export const experience = [
  {
    role: "Founding Engineer",
    org: "Varpitech",
    period: "Current",
    points: [
      "Building Vivekium (ReadyPick), an AI-assisted hiring platform, across the stack: web workspaces, APIs and AI workflows.",
      "Built AI agent workflows for resume parsing, candidate matching and assessments on a multi-tenant recruitment platform.",
      "Built the FastAPI backend behind them, including multi-provider LLM routing with failover, and deployed it on Google Cloud.",
    ],
  },
];

export const education = {
  school: "SASTRA Deemed University, Thanjavur",
  degree: "B.Tech in Electronics and Communication Engineering",
  period: "2022 – 2026",
};

export const certifications = [
  { name: "IBM AI Engineering Professional Certificate", year: "2024" },
  { name: "Full-Stack Web Development Bootcamp (Udemy)", year: "2023" },
];

export const papers = [
  {
    title: "Proactive Latency Violation Prediction in 5G eMBB Networks: A Comparative Study of Sequential Deep Learning and Ensemble Methods",
    note: "Compares LSTM and temporal convolutional models against a feature-engineered Random Forest baseline and a stacked ensemble, using causal features and chronological evaluation. Tested on a controlled lab network.",
    slug: "latency-prediction",
  },
  { title: "IoT Based Smart Onion Base Storage System with RFID and 5G Connectivity", note: "", slug: "" },
  { title: "IoT-Based Multi-Layer Urine Analysis for Early Kidney Disease Detection", note: "", slug: "" },
];

// Names must match the keys in components/Skills.tsx to get an icon.
export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["Python", "Java", "JavaScript", "TypeScript", "Swift", "Rust", "C++", "C", "SQL"] },
  { group: "Frontend", items: ["React", "Next.js", "Vite", "Tailwind CSS"] },
  { group: "Backend", items: ["FastAPI", "Node.js", "Express.js", "Django", "Flask", "Celery", "REST APIs"] },
  { group: "Desktop & Apple", items: ["Tauri", "SwiftUI", "Apple Foundation Models"] },
  {
    group: "AI & ML",
    items: [
      "Machine Learning", "Deep Learning", "NLP", "Scikit-learn", "PyTorch", "LangChain", "LangGraph", "CrewAI",
      "RAG", "Context Engineering", "Agents", "LLM Evaluation", "OpenAI API", "Gemini API", "Anthropic API",
    ],
  },
  { group: "Data", items: ["PostgreSQL", "MongoDB", "Redis", "SQLite", "Neo4j", "ArangoDB", "Qdrant"] },
  { group: "Cloud & tools", items: ["AWS", "Google Cloud Platform", "Vercel", "Docker", "Terraform", "GitHub Actions", "Firebase", "Nginx", "Git"] },
];
