import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { portfolioRoutes } from "./data/routes";
import { getPosts } from "./pages/Blogs";

export const routes = [...portfolioRoutes, ...getPosts().map(post => ({ path: `/blogs/${post.slug}/`, title: `${post.title} · Saravan Kumar M K`, description: post.summary, kind: "BlogPosting", educational: true, datePublished: post.date }))];
export function render(path: string) {
  return renderToString(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}
