import fs from "fs";
import path from "path";
import PocketBase from "pocketbase";
import { Page, expect } from "@playwright/test";

// Credenciais do PocketBase de dev vêm do backend/.env
process.loadEnvFile(path.join(import.meta.dirname, "..", "..", "backend", ".env"));

export const SEED_FILE = path.join(import.meta.dirname, ".auth", "seed.json");
export const API_URL = "http://localhost:3997/api/calculos";

export type Perfil = "admin" | "associado" | "vendedor";
export type Seed = {
  sufixo: string;
  senha: string;
  usuarios: Record<Perfil, { id: string; email: string }>;
  cidade: { id: string; nome: string };
};

/** Cliente superusuário do PocketBase de dev, com as credenciais do backend/.env. */
export async function superPocketBase(): Promise<PocketBase> {
  const url = process.env.POCKETBASE_URL || "";
  if (!new URL(url).hostname.startsWith("dev.")) {
    throw new Error(`Testes E2E só podem rodar contra o PocketBase de dev (atual: ${url})`);
  }
  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  await pb
    .collection("_superusers")
    .authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || "", process.env.POCKETBASE_ADMIN_PASSWORD || "");
  return pb;
}

export function lerSeed(): Seed {
  return JSON.parse(fs.readFileSync(SEED_FILE, "utf-8"));
}

export async function login(page: Page, seed: Seed, perfil: Perfil) {
  await page.goto("/login");
  await page.getByPlaceholder("email@empresa.com").fill(seed.usuarios[perfil].email);
  await page.getByPlaceholder("Sua senha").fill(seed.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Token do usuário para chamar o backend direto (passos que não são o foco do teste de UI). */
export async function tokenDe(seed: Seed, perfil: Perfil) {
  const pb = new PocketBase(process.env.POCKETBASE_URL);
  const auth = await pb.collection("users").authWithPassword(seed.usuarios[perfil].email, seed.senha);
  return auth.token;
}

/** Chama o backend direto como o usuário (passos de preparação que não são o foco do teste). */
export async function apiComo(seed: Seed, perfil: Perfil, metodo: string, rota: string, body?: unknown) {
  const res = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${await tokenDe(seed, perfil)}`, "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

export const formatarBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
