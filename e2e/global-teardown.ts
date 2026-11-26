import fs from "fs";
import { SEED_FILE, lerSeed, superPocketBase } from "./support";

export default async function globalTeardown() {
  if (!fs.existsSync(SEED_FILE)) return;
  const seed = lerSeed();
  const pb = await superPocketBase();

  // Inclui os usuários criados pela tela durante os testes (mesmo sufixo no e-mail)
  const usuarios = await pb.collection("users").getFullList({
    filter: pb.filter("email ~ {:sufixo} && email ~ '@teste.local'", { sufixo: seed.sufixo }),
  });
  const ids = usuarios.map((u) => u.id);

  if (ids.length) {
    const filtro = ids.map((id) => `user_id = "${id}"`).join(" || ");
    const orcamentos = await pb.collection("orcamentos").getFullList({ filter: filtro });
    for (const o of orcamentos) await pb.collection("orcamentos").delete(o.id);
    for (const id of ids) await pb.collection("users").delete(id);
  }

  fs.rmSync(SEED_FILE);
}
