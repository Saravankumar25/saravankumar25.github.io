import { projects } from "./projects";
import { config } from "../config";

export const portfolioRoutes = [
  { path: "/", title: `${config.name} · ${config.title}`, description: "Saravan Kumar M K builds full-stack products, AI systems, agentic workflows and developer tools. Explore his projects, research and illustrated engineering guides.", kind: "ProfilePage" },
  { path: "/about/", title: "About · Saravan Kumar M K", description: "Learn about Saravan Kumar M K's full-stack and AI engineering capabilities, founding engineer experience at Varpitech, skills and education.", kind: "ProfilePage" },
  { path: "/projects/", title: "Projects · Saravan Kumar M K", description: "Explore software products, developer tools, AI and machine-learning projects, with implementation decisions, architecture and honest project limitations.", kind: "CollectionPage" },
  { path: "/research/", title: "Research · Saravan Kumar M K", description: "Three accepted conference papers on network latency prediction and IoT systems by Saravan Kumar M K. These papers have not yet been presented or published.", kind: "CollectionPage" },
  { path: "/resume/", title: "Resume · Saravan Kumar M K", description: "Saravan Kumar M K's engineering resume: founding engineer experience, software and AI skills, education, and links to his full professional profile.", kind: "ProfilePage" },
  { path: "/contact/", title: "Contact · Saravan Kumar M K", description: "Contact Saravan Kumar M K by email or LinkedIn, and explore his code and software engineering projects on GitHub.", kind: "ContactPage" },
  { path: "/blogs/", title: "Blogs · Saravan Kumar M K", description: "Read illustrated engineering guides on computer architecture, machine learning, Transformers, large language models and test data management.", kind: "CollectionPage" },
  ...projects.map(project => ({ path: `/projects/${project.slug}/`, title: `${project.name} · Saravan Kumar M K`, description: `${project.name}: ${project.tagline} Explore the problem, implementation decisions, technology stack and current limitations.`, kind: "CreativeWork" })),
];
