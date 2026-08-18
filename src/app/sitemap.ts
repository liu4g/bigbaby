import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/supabase/env";

const routes = [
  "",
  "/dashboard",
  "/vocabulary",
  "/vocabulary/n5",
  "/vocabulary/n4",
  "/vocabulary/n3",
  "/vocabulary/n2",
  "/vocabulary/n1",
  "/grammar",
  "/grammar/n5",
  "/grammar/n4",
  "/grammar/n3",
  "/grammar/n2",
  "/grammar/n1",
  "/reading",
  "/practice",
  "/practice/n5",
  "/practice/n4",
  "/practice/n3",
  "/practice/n2",
  "/practice/n1",
  "/practice/wrong-answers",
  "/jlpt",
  "/jlpt/n5",
  "/jlpt/n4",
  "/jlpt/n3",
  "/jlpt/n2",
  "/jlpt/n1",
  "/jlpt/resources",
  "/jlpt/exams/n5-mock-exam-01",
  "/jlpt/exams/n4-mock-exam-01",
  "/jlpt/exams/n3-mock-exam-01",
  "/jlpt/exams/n2-mock-exam-01",
  "/jlpt/exams/n1-mock-exam-01",
  "/progress",
  "/profile",
  "/login",
  "/register"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-08-17"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
