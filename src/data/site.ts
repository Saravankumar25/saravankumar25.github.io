export const capabilities = [
  { title: "Full-stack products", text: "Next.js, React and TypeScript front ends over FastAPI, Django, Node and Rust back ends." },
  { title: "AI engineering", text: "Agentic workflows, RAG and hybrid retrieval, evaluation, and keeping model output behind deterministic checks." },
  { title: "Backend and architecture", text: "Multi-tenant data isolation, durable background work, idempotent pipelines, PostgreSQL, SQLite and graph stores." },
  { title: "Cloud and infrastructure", text: "AWS Lambda and Fargate, Docker, Terraform and S3-backed storage." },
  { title: "Developer tools", text: "Code-understanding, incident-response and local-first desktop tooling." },
  { title: "Applied ML", text: "Time-series forecasting, multimodal models and learning-augmented algorithms." },
];

export const experience = [
  {
    role: "Founding Engineer",
    org: "Varpitech",
    period: "Current",
    points: [
      "Building Vivekium (ReadyPick), a multi-tenant AI hiring platform with job-centred workflows, proctored assessments and evidence-cited reports.",
      "Works across the stack: tenant-aware APIs, PostgreSQL row-level security, background AI workers and the web workspaces.",
    ],
  },
];

export const papers = [
  {
    title: "Proactive Latency Violation Prediction in 5G eMBB Networks: A Comparative Study of Sequential Deep Learning and Ensemble Methods",
    note: "Compares LSTM and temporal convolutional models against a feature-engineered Random Forest baseline and a stacked ensemble, using causal features and chronological evaluation on a synthetic, benchmark-calibrated dataset.",
    slug: "latency-prediction",
  },
  { title: "IoT Based Smart Onion Base Storage System with RFID and 5G Connectivity", note: "", slug: "" },
  { title: "IoT-Based Multi-Layer Urine Analysis for Early Kidney Disease Detection", note: "", slug: "" },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "Rust", "C++", "C", "SQL"] },
  { group: "Frontend", items: ["React", "Next.js", "Vite", "Tailwind CSS", "Redux Toolkit", "Zustand", "React Query"] },
  { group: "Backend", items: ["FastAPI", "Django", "Node.js", "Express", "NestJS", "Flask", "Celery", "Tauri"] },
  { group: "AI & ML", items: ["LangGraph", "RAG", "Hybrid retrieval", "LLM tool use", "PyTorch", "CLIP", "LSTM / TCN", "Random Forest", "LightGBM", "XGBoost", "FAISS", "llama.cpp"] },
  { group: "Data", items: ["PostgreSQL", "pgvector", "SQLite", "MongoDB", "Redis", "Neo4j", "ArangoDB", "Qdrant", "Chroma"] },
  { group: "Cloud & tools", items: ["AWS (Lambda, Fargate, S3)", "Docker", "Terraform", "GitHub Actions", "Firebase", "Nginx", "Git"] },
];
