export type Category = "Flagship" | "Developer tools" | "AI / ML" | "Systems" | "Research";

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  featured?: boolean;
  status: string;
  stack: string[];
  problem: string;
  what: string;
  /** Architecture pipeline, rendered as an SVG diagram. */
  flow: string[];
  decisions: string[];
  limits: string[];
}

export const projects: Project[] = [
  {
    slug: "vivekium",
    name: "ReadyPick / Vivekium",
    tagline: "Multi-tenant AI hiring platform where every report traces back to evidence.",
    category: "Flagship",
    featured: true,
    status: "Active development at Varpitech",
    stack: ["Next.js", "FastAPI", "PostgreSQL + pgvector", "Row-level security", "Redis", "S3", "AWS Lambda / Fargate", "Firebase Auth"],
    problem:
      "Hiring tools usually treat recruiting as disconnected steps. Candidates end up scored against subtly different readings of the same job, and a final recommendation has no defensible chain back to evidence.",
    what:
      "Vivekium organises hiring around the job. A company profile and job description feed a skills generator; staff edit and save the skills; candidates are matched, invited to a single proctored assessment, graded per skill, and summarised in a structured, cited report. It runs four separate workspaces: provider, company, candidate and business development.",
    flow: ["Job + skills (human-edited)", "Frozen assessment contract", "Resume match → recruiter shortlist", "Proctored assessment", "Per-skill grading", "Cited PRISM report"],
    decisions: [
      "Skills and job grade are locked into a snapshot once assessments begin, so every candidate is scored against the same contract.",
      "Reports have a fixed structure and strict citations. A claim with no supporting evidence is withheld for human review instead of being passed through.",
      "Tenant isolation is enforced in PostgreSQL row-level security as well as in the API, so a missing filter in application code is not a data leak.",
      "Slow model, parsing and transcription work runs outside the request cycle on Lambda or on-demand Fargate, with durable job records and idempotent dispatch.",
    ],
    limits: [
      "AI matching assists recruiters; people choose who advances. No fairness or bias-free claim is made.",
      "Customer-facing ratings are qualitative; numeric scores stay internal.",
      "Customer data, reports and internal diagrams are not published here.",
    ],
  },
  {
    slug: "openframe",
    name: "OpenFrame Studio",
    tagline: "Local-first desktop studio that takes a film from idea to shoot day.",
    category: "Flagship",
    featured: true,
    status: "Pre-release, under active development",
    stack: ["Tauri v2", "Rust", "SQLite (FTS5, sqlite-vec)", "React", "TypeScript", "llama.cpp"],
    problem:
      "Filmmakers move between separate tools for ideas, story structure, screenplay, breakdown and scheduling, usually with cloud accounts that own the data.",
    what:
      "One desktop project for the whole pipeline: Idea Vault, Story Board, screenplay, breakdown and production catalog, shooting schedule and call sheets. Each project is an ordinary .openframe folder on disk holding a SQLite database, a JSON manifest and media. There is no account, no telemetry and no network listener.",
    flow: ["React + TypeScript UI (no fs / network)", "of_invoke: one allow-listed IPC entry", "Rust core + SQLite project folder", "FTS5 + vector + graph retrieval", "Offline AI sidecars on 127.0.0.1"],
    decisions: [
      "The webview has no filesystem, shell or HTTP access. Every read and write passes through a single allow-listed Rust command, with paths resolved in Rust.",
      "Every change is a committed SQLite transaction, giving continuous autosave, crash recovery, and undo/redo that refuses to overwrite later work.",
      "Schema migrations take a verified backup first, run atomically, and refuse projects created by newer versions.",
      "Offline AI (Gemma 3 1B plus a local embedding model) is optional and never edits a project directly. Output is a reviewable change set that applies only when the user clicks Apply.",
    ],
    limits: [
      "Project lifecycle, autosave, recovery, undo, files, search engine and Offline AI are implemented. Story Board, screenplay, breakdown, scheduling and import/export are still in development.",
      "No installer has been released and no licence has been selected.",
      "AI retrieval quality has no evaluation set yet, and performance on minimum-spec hardware is unmeasured.",
    ],
  },
  {
    slug: "unfold",
    name: "Unfold",
    tagline: "Understand an unfamiliar codebase through evidence, not summaries.",
    category: "Developer tools",
    featured: true,
    status: "Working system; AWS profile verified locally, not deployed",
    stack: ["Next.js", "FastAPI", "PostgreSQL", "Neo4j", "Qdrant", "BM25", "Redis", "MinIO / S3", "Terraform"],
    problem:
      "A README rarely explains why modules are split, how data moves, or what runs at runtime. A model asked about a repo will happily describe a generic architecture the repo does not have.",
    what:
      "Give Unfold a public GitHub URL or a ZIP and it produces a chaptered guide, architecture views and a chat that answers with citations to files and line ranges in that repository.",
    flow: ["GitHub URL / ZIP (untrusted input)", "Static parse, never executed", "Graph + BM25 + dense vectors", "Checkpointed guide pipeline", "Claim grading + citations", "Guide, diagrams and chat"],
    decisions: [
      "Uploaded code is read as data and never run, which removes a whole class of execution and exfiltration risk.",
      "Hybrid retrieval: lexical search for exact identifiers, dense vectors for concepts, a symbol graph for relationships.",
      "Analysis stages are checkpointed, so a provider failure resumes a stage instead of restarting the run and paying for tokens twice.",
      "Port interfaces keep application logic independent of storage, so a local profile and an AWS profile share one set of contracts.",
      "Quality regression uses frozen baselines and mutation tests that deliberately corrupt evidence and citations, to prove the gate catches them.",
    ],
    limits: [
      "Static analysis cannot resolve dynamic dispatch, so diagrams are dependency maps, not runtime call graphs.",
      "Evaluation figures describe specific fixtures and models, not every language or repository.",
    ],
  },
  {
    slug: "aegis",
    name: "Aegis 2.0",
    tagline: "AI incident response where model confidence is never authorisation.",
    category: "Developer tools",
    status: "Prototype",
    stack: ["FastAPI", "LangGraph", "PostgreSQL", "Redis", "Next.js", "Neo4j", "Prometheus / Loki / Tempo"],
    problem:
      "During an outage the hard part is establishing what happened and which evidence to trust. An agent that guesses a root cause, or acts on a plausible fix, adds operational risk.",
    what:
      "An investigation control plane. Alerts become durable jobs; a 12-node LangGraph workflow gathers evidence across telemetry, topology and code changes, forms hypotheses, and proposes remediation that must clear deterministic gates before anything can run.",
    flow: ["Alert → durable job (Postgres)", "12-node investigation graph", "Content-addressed evidence + trust classes", "Default-deny policy engine", "Expiring, action-bound approval", "Typed validated action → executor"],
    decisions: [
      "Evidence is append-only with provenance. An unavailable source stays unknown instead of reading as healthy.",
      "Confidence derives from coverage, corroboration, source reliability and contradictions rather than the model's self-report.",
      "Executors accept only a validated action type that can be constructed after policy and approval, so prompt text cannot reach an executor directly.",
      "Postgres is the system of record; Redis is only a cache and event bus.",
    ],
    limits: [
      "Demo-mode measurements say nothing about recovery time for real systems.",
      "Counts such as node and tool totals are tied to one repository revision.",
    ],
  },
  {
    slug: "lpq-atlas",
    name: "LPQ Atlas",
    tagline: "Can a learned priority queue speed up Dijkstra without breaking correctness?",
    category: "Research",
    status: "Research prototype",
    stack: ["C++", "Dijkstra / A*", "Learned priority queue", "Web UI", "OSM / SNAP / DIMACS graphs"],
    problem:
      "Shortest-path search is dominated by priority-queue behaviour, and a model that orders candidates cheaply must still return correct distances once inference and verification costs are counted.",
    what:
      "A C++ engine and interactive web interface for running Dijkstra or A* with classical or learned queues, inspecting execution traces and comparing configurations. The UI replays machine-readable output from the real engine, not an animation.",
    flow: ["Dataset + source / target", "lpq_run (validated request)", "Classical or learned queue + verify / fallback", "Result + trace JSON", "Reference oracle check", "Web replay + benchmark"],
    decisions: [
      "Learned suggestions are verified or bypassed by deterministic logic, so exact mode keeps classical guarantees.",
      "A separate untraced run is the authoritative timing; a traced run exists for visualisation and is checked against it.",
      "Model setup, scoring, verification and fallback are counted separately so a headline speedup can be interpreted.",
    ],
    limits: [
      "Learned priority queues are published prior work; no novelty claim is made.",
      "Speedups need reproduction on stated hardware, and a faster classical queue is not evidence that ML helped.",
    ],
  },
  {
    slug: "quakewatch",
    name: "QuakeWatch",
    tagline: "Seismic data platform that remembers every revision.",
    category: "Systems",
    status: "Research platform; not a prediction or warning service",
    stack: ["Django", "ArangoDB", "Celery", "Redis", "USGS APIs", "AQL"],
    problem:
      "Earthquake records are revised after first publication, and feeds go down or repeat entries. A map of current markers hides that history.",
    what:
      "Ingests USGS data, normalises it, keeps canonical events separate from immutable revisions and raw payloads, and supports spatial queries, explainable alert rules, analytics and reproducible exports.",
    flow: ["USGS feeds (retry, backoff, breaker)", "Validate + normalise", "Canonical upsert + revision append", "ArangoDB: geo, graph, search", "Alert rule matching", "Django REST, UI and snapshots"],
    decisions: [
      "Ingestion is idempotent, so retries and backfills do not duplicate events or erase corrections.",
      "Research snapshots pin revisions, so an export can be compared later.",
      "Django auth data lives in SQLite; all domain data lives in ArangoDB.",
      "Index benchmarks keep uniqueness constraints fixed so correctness does not change between runs.",
    ],
    limits: [
      "Does not predict earthquakes and is not an emergency system.",
      "When the upstream feed is down it serves existing data and should show freshness.",
    ],
  },
  {
    slug: "imagemismatch",
    name: "ImageMismatch",
    tagline: "Detect when a caption does not match its image, with a tested inference API.",
    category: "AI / ML",
    status: "Working application with golden tests",
    stack: ["CLIP ViT-B/32", "EasyOCR", "FastAPI", "React", "Nginx", "Docker Compose"],
    problem:
      "Images and text can disagree, but ML demos often drift between notebook and server through different preprocessing.",
    what:
      "Upload an image and up to five captions. The service returns a match decision, probability, raw similarity and a heatmap per caption, and handles printed text in the image through OCR.",
    flow: ["Image + up to 5 captions", "Validate size, type, length", "OCR + text masking", "CLIP + learned scorer (shared notebook code)", "Decision, probability, heatmap"],
    decisions: [
      "The API loads the same mismatch_core.py used in training and checks golden predictions within a numeric tolerance.",
      "Readiness is separate from liveness, with model warm-up before traffic.",
      "Inference is serialised and thread-limited for predictable latency on small CPUs.",
    ],
    limits: [
      "It measures semantic alignment, not truth. It cannot judge date, source or context.",
      "CLIP is weak on counting, colour and spatial relations; English only.",
      "Local run on 4 CPU cores / 3 GB: about 14 s startup, 1.36 s median for one caption, 3.73 s p95 for five captions plus OCR.",
    ],
  },
  {
    slug: "workify",
    name: "Workify",
    tagline: "Job search, tailored documents and browser automation in one product.",
    category: "Flagship",
    status: "Prototype",
    stack: ["React", "Vite", "FastAPI", "MongoDB (Beanie)", "Firebase Auth", "Cloudinary", "browser-use", "Groq"],
    problem:
      "Applying means gathering listings, rewriting documents, filling repetitive forms and tracking outcomes across many tabs.",
    what:
      "Discovers jobs, builds a candidate profile, generates tailored resumes and cover letters as PDFs, runs browser-based application workflows with live progress, and tracks applications in a dashboard.",
    flow: ["Job discovery", "Profile + resume import", "Tailored PDF documents", "Browser automation + live SSE log", "Application tracking"],
    decisions: [
      "Generated text is separated from structured profile data, which stays the source of facts.",
      "Progress streams to the UI over Server-Sent Events instead of a spinner.",
      "Stored credentials are encrypted with Fernet.",
    ],
    limits: [
      "Third-party forms change; automation is assistive, not a guaranteed submission path.",
      "No success rate or time-saving claim is made.",
    ],
  },
  {
    slug: "asksql",
    name: "AskSQL",
    tagline: "Natural-language questions answered with guarded, read-only SQL.",
    category: "AI / ML",
    status: "Demo on a bundled dataset",
    stack: ["FastAPI", "LangGraph", "sqlglot", "SQLite", "Chroma", "React", "Groq"],
    problem:
      "Generated SQL can parse and run yet answer the wrong question, join incorrectly, or touch data it should not.",
    what:
      "Retrieves relevant schema and glossary context, generates SQL, validates it through a parser, executes read-only against a 15-table demo database, and returns a chart with the query and explanation.",
    flow: ["Question", "Schema + glossary retrieval", "SQL generation", "sqlglot AST validation", "Read-only execution", "Chart + explanation"],
    decisions: [
      "Queries are parsed into an AST and checked structurally rather than filtered by keywords.",
      "Schema retrieval falls back to reading SQLite directly when the vector store is unavailable.",
      "Refinement retries are bounded.",
    ],
    limits: [
      "Runs on a bundled demo database, not arbitrary enterprise data.",
      "Read-only is necessary but not sufficient: resource limits and row-level permissions would be needed in production.",
    ],
  },
  {
    slug: "latency-prediction",
    name: "5G Latency Violation Prediction",
    tagline: "Forecasting 5G eMBB latency breaches five minutes ahead.",
    category: "Research",
    status: "Accepted conference paper",
    stack: ["Python", "LSTM", "TCN", "Random Forest", "LightGBM", "Optuna", "SHAP"],
    problem:
      "Threshold alarms fire after a delay has already degraded the user experience.",
    what:
      "Compares sequence models (LSTM, dilated TCN) with an engineered-feature tabular baseline and a stacked ensemble. The target is whether average latency over the next ten 30-second intervals exceeds a threshold.",
    flow: ["Telemetry (30 s samples)", "Causal features: lags, rolling stats", "Chronological split", "LSTM · TCN · Random Forest", "Stacked ensemble + calibration"],
    decisions: [
      "Features are shifted before rolling aggregation and preprocessing is fit only on training data, to prevent leakage.",
      "Chronological evaluation instead of shuffled windows.",
      "Reported with PR-AUC and MCC because violations are the minority class.",
    ],
    limits: [
      "The 201,600-record dataset is synthetic and calibrated to published benchmark distributions. There is no live carrier validation.",
      "Feature attribution is not causal proof.",
    ],
  },
  {
    slug: "minillm",
    name: "MiniLLM",
    tagline: "A small LLM application framework built to see what agent libraries do.",
    category: "AI / ML",
    status: "Educational project",
    stack: ["Python", "Groq HTTP API", "FAISS", "Streamlit"],
    problem:
      "Frameworks hide how messages are assembled, how tool results re-enter context and what memory actually stores.",
    what:
      "A raw HTTP model client, prompt builder, in-memory conversation store, tool registry with JSON-schema generation, a bounded ReAct agent loop and a FAISS-backed RAG pipeline, driven from a CLI and a Streamlit UI.",
    flow: ["Prompt builder", "Raw HTTP client", "Tool registry + executor", "Bounded ReAct loop", "FAISS retrieval"],
    decisions: [
      "Transport and prompt construction are separate, so each can be tested alone.",
      "The agent loop has a hard iteration cap.",
    ],
    limits: [
      "It wraps an external model API. It does not train a model.",
      "Memory is in-process only; the vector index is local.",
    ],
  },
  {
    slug: "research-engine",
    name: "Multi-Agent Research Engine",
    tagline: "Planner, searcher, critic and writer producing cited reports.",
    category: "AI / ML",
    status: "Prototype",
    stack: ["LangGraph", "FastAPI", "React", "MongoDB", "Tavily", "Server-Sent Events"],
    problem:
      "One search and one completion rarely answers a multi-part question, and fluent text hides which claims have a source.",
    what:
      "A four-stage workflow: the Planner splits the question, the Searcher gathers sources, the Critic checks coverage and can request more searching, and the Writer produces a report with inline references. Progress streams to the UI.",
    flow: ["Planner", "Searcher (Tavily)", "Critic (may loop)", "Writer + citations", "SSE progress to UI"],
    decisions: [
      "Responsibilities are split into stages so each intermediate artifact is inspectable.",
      "The critique loop is bounded to avoid endless searching.",
    ],
    limits: [
      "Critic judgements are model output and need external evaluation.",
      "No accuracy or time-saving claim is made.",
    ],
  },
];

export const otherProjects: { name: string; line: string }[] = [
  { name: "Student Management API", line: "Express + MongoDB REST API with JWT access and rotating, hashed refresh tokens." },
  { name: "CRM", line: "NestJS and React app with companies, contacts and deals." },
  { name: "Dynamic Pricing Engine", line: "Demand-forecasting ensemble with a Q-learning price optimizer and an LLM explainer." },
  { name: "Chemical Safety Hub", line: "Express wrapper around Gemini returning structured product-safety education." },
  { name: "Supply Chain Analytics", line: "SQL, Power Query and Power BI analysis of a public supply-chain dataset." },
];

export const categories: ("All" | Category)[] = ["All", "Flagship", "Developer tools", "AI / ML", "Systems", "Research"];

export const bySlug = (slug?: string) => projects.find((p) => p.slug === slug);

/** One short, jargon-free summary per project, shown first on each page. */
export const plain: Record<string, string> = {
  vivekium:
    "A hiring tool for companies. A company describes the job, candidates take one consistent test, and the tool writes a report on each person. Every sentence in the report points to the evidence behind it, so a recruiter can check it instead of trusting a black box. People still make the hiring decisions.",
  openframe:
    "A film-planning app that lives entirely on your own computer. Your ideas, script and shooting schedule sit in one place, with no account and nothing sent online. An optional AI helper can suggest changes, but nothing changes until you press Apply.",
  unfold:
    "Paste a link to someone's code and get a readable guide to how it works, plus a chat where you can ask questions. Every answer points to the exact place in the code it came from, so you can check it yourself.",
  aegis:
    "When a website or app breaks, this tool helps engineers work out why. An AI gathers clues and suggests a fix, but it cannot act on its own: fixed safety rules and a human approval have to pass first.",
  "lpq-atlas":
    "An experiment in making route-finding (like a map app picking the shortest way) faster with machine learning, while making sure the answer is still always correct. It includes a visual tool that replays how each search worked.",
  quakewatch:
    "A website that tracks earthquakes from public data and keeps a record when the numbers are corrected later. It reports what happened; it does not predict earthquakes.",
  imagemismatch:
    "Upload a photo and a few captions and it tells you how well each caption matches the picture. It checks meaning only. It cannot tell you whether a caption is true.",
  workify:
    "A job-hunting helper. It finds jobs, writes a tailored resume and cover letter for each one, and can fill in application forms while you watch.",
  asksql:
    "Ask a question about a database in plain English and get a chart and an answer. A safety check makes sure the computer only reads data and never changes it.",
  "latency-prediction":
    "Research on warning a mobile network a few minutes before it slows down, so operators can react earlier. It was tested on simulated data, not on a live network.",
  minillm:
    "A small learning project that rebuilds the basic parts of an AI chatbot from scratch (memory, tools, looking things up in documents) to show what really happens inside popular AI tools.",
  "research-engine":
    "Ask a big question and a team of AI roles plans the research, searches the web, checks the sources and writes a report with references.",
};
