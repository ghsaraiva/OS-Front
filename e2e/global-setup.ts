import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { SEED_FILE, Seed, Perfil, superPocketBase } from "./support";

export default async function globalSetup() {
  const pb = await superPocketBase();
  const sufixo = `${Date.now()}${randomBytes(2).toString("hex")}`;
  const senha = `E2e!${randomBytes(6).toString("hex")}`;

  // Cidade com nome de pelo menos 3 letras para o autocomplete
  const cidade = await pb.collection("cidades_hsp").getFirstListItem('cidade != ""');

  const usuarios = {} as Seed["usuarios"];
  for (const perfil of ["admin", "associado", "vendedor"] as Perfil[]) {
    const email = `pw.${perfil}.${sufixo}@teste.local`;
    const user = await pb.collection("users").create({
      email,
      password: senha,
      passwordConfirm: senha,
      name: `PW ${perfil}`,
      tipo_acesso: perfil,
      primeiro_acesso: false,
      verified: true,
    });
    usuarios[perfil] = { id: user.id, email };
  }

  const seed: Seed = { sufixo, senha, usuarios, cidade: { id: cidade.id, nome: cidade.cidade } };
  fs.mkdirSync(path.dirname(SEED_FILE), { recursive: true });
  fs.writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2));
}
