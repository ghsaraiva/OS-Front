import { test, expect, Page } from "@playwright/test";
import { apiComo, formatarBRL, lerSeed, login, superPocketBase, Seed } from "./support";

/**
 * Fluxo de tela do perfil Associado (roteiro de PLANO_TESTES_ASSOCIADO.md).
 * Cada teste prepara os próprios dados, então dá para rodar qualquer um sozinho no modo interativo.
 *
 *   npm run test:e2e      → roda tudo
 *   npm run test:e2e:ui   → modo interativo (linha do tempo, print de cada passo)
 */

const CUSTOS_ASSOCIADO = {
  mao_obra: 80,
  equipamento_local: 50,
  km: 200,
  custo_km: 2,
  porcentagem_imposto: 6,
  porcentagem_seguro: 1,
  porcentagem_margem_seguranca: 4,
  lucro_liquido_perc: 15,
};

const AVISO_ASSOCIADO = "foram preenchidos pelo associado";

const nomeCliente = (caso: string) => `TESTE PW ${caso} ${Date.now()}`;

async function criarOrcamento(seed: Seed, perfil: "associado" | "vendedor", nome: string, extra: object = {}) {
  const res = await apiComo(seed, perfil, "POST", "/criar-solicitacao", {
    nome_cliente: nome,
    id_cidade: seed.cidade.id,
    cidade: seed.cidade.nome,
    consumo_mes: 600,
    valor_tarifa: 1,
    estrutura: "Cerâmico",
    padrao: "Bifásico",
    ...(perfil === "associado" ? CUSTOS_ASSOCIADO : {}),
    ...extra,
  });
  expect(res.status).toBe(201);
  return res.data.id as string;
}

async function precificarViaApi(seed: Seed, orcamentoId: string) {
  const res = await apiComo(seed, "admin", "POST", "/salvar-refinamento", {
    orcamentoId,
    potencia_painel: 550,
    quantidade_paineis: 10,
    peso_painel: 25,
    marca_modulo: "PW Solar",
    quantidade_inversores: 1,
    potencia_inversor: 5,
    modelo_inversor: "PW-5K",
    marca_inversor: "PW",
    tensao_inversor: 220,
    valorKit: 12000,
    valorPorcentagem: 12,
    valorMaoDeObra: CUSTOS_ASSOCIADO.mao_obra,
    valorEquipamentoLocal: CUSTOS_ASSOCIADO.equipamento_local,
    porcentagemLucroLiquido: CUSTOS_ASSOCIADO.lucro_liquido_perc,
    km: CUSTOS_ASSOCIADO.km,
    custo_km: CUSTOS_ASSOCIADO.custo_km,
    porcentagem_imposto: CUSTOS_ASSOCIADO.porcentagem_imposto,
    porcentagem_margem_seguranca: CUSTOS_ASSOCIADO.porcentagem_margem_seguranca,
    porcentagem_seguro: CUSTOS_ASSOCIADO.porcentagem_seguro,
  });
  expect(res.status).toBe(200);
}

async function abrirNoGerenciamento(page: Page, orcamentoId: string) {
  await page.goto(`/orcamentos/gerenciamento?id=${orcamentoId}`);
  await expect(page.getByText("Valores de Entrada (Custos)")).toBeVisible();
}

const menuGerenciar = (page: Page) => page.getByRole("link", { name: "Gerenciar Orçamento" });
const menuUsuarios = (page: Page) => page.getByRole("link", { name: "Gestão de Usuários" });

test.describe("A. Cadastro do associado", () => {
  test("admin cadastra associado e ele faz o primeiro acesso", async ({ page }) => {
    const seed = lerSeed();
    const email = `pw.novo.${seed.sufixo}.${Date.now()}@teste.local`;
    const senhaTemporaria = `Tmp!${Date.now()}`;

    await test.step("A1: admin cadastra o associado em Gestão de Usuários", async () => {
      await login(page, seed, "admin");
      await page.goto("/seguranca/usuarios");
      await page.getByPlaceholder("Nome do colaborador").fill("PW Associado Novo");
      await page.getByPlaceholder("sofiaengenharia@email.com").fill(email);
      await page.locator("select").filter({ has: page.locator('option[value="associado"]') }).selectOption("associado");
      await page.getByPlaceholder("Mínimo 6 caracteres").fill(senhaTemporaria);
      await page.getByPlaceholder("Repita a senha").fill(senhaTemporaria);
      await page.getByRole("button", { name: "Cadastrar Usuário" }).click();

      const linha = page.getByRole("row").filter({ hasText: email });
      await expect(linha).toBeVisible();
      await expect(linha.getByText("Associado", { exact: true })).toBeVisible();
    });

    await test.step("A2: primeiro login obriga a trocar a senha", async () => {
      await page.getByRole("button", { name: /PW admin/ }).click();
      await page.getByText("Sair").click();
      await expect(page).toHaveURL(/\/login/);

      await page.getByPlaceholder("email@empresa.com").fill(email);
      await page.getByPlaceholder("Sua senha").fill(senhaTemporaria);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/alterar-senha/);

      await page.getByPlaceholder("Mínimo 6 caracteres").fill(seed.senha);
      await page.getByPlaceholder("Repita a nova senha").fill(seed.senha);
      await page.getByRole("button", { name: "Definir Senha" }).click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText("Senha definida com sucesso!")).toBeVisible();
    });

    await test.step("A2: com a senha nova, o menu não mostra Gerenciar nem Segurança", async () => {
      await page.getByPlaceholder("email@empresa.com").fill(email);
      await page.getByPlaceholder("Sua senha").fill(seed.senha);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).not.toHaveURL(/\/login|\/alterar-senha/);
      await expect(page.getByRole("link", { name: "Novo Orçamento" })).toBeVisible();
      await expect(menuGerenciar(page)).toHaveCount(0);
      await expect(menuUsuarios(page)).toHaveCount(0);
    });
  });
});

test.describe("B. Novo orçamento", () => {
  test("associado cadastra orçamento com os próprios custos", async ({ page }) => {
    const seed = lerSeed();
    const nome = nomeCliente("Cadastro");

    await test.step("B1: a seção de custos aparece para o associado", async () => {
      await login(page, seed, "associado");
      await page.goto("/orcamentos/novo");
      await expect(page.getByText("Custos Operacionais e Margem Regional")).toBeVisible();
    });

    await test.step("B2: preenche e salva", async () => {
      await page.locator('input[name="nome_cliente"]').fill(nome);
      await page.getByPlaceholder("Digite o nome da cidade...").fill(seed.cidade.nome);
      await page.locator("li", { hasText: seed.cidade.nome }).first().click();
      await page.getByPlaceholder("Observações do lead (telhado, fiação, etc.)").fill("Observação de teste");
      await page.locator('input[name="consumo_mes"]').fill("60000"); // 600,00
      await page.locator('input[name="mao_obra"]').fill("8000"); // 80,00
      await page.locator('input[name="equipamento_local"]').fill("5000"); // 50,00
      await page.locator('input[name="km"]').fill("200");
      await page.locator('input[name="custo_km"]').fill("200"); // 2,00
      await page.locator('input[name="porcentagem_imposto"]').fill("600"); // 6,00
      await expect(page.locator('input[name="porcentagem_margem_seguranca"]')).toHaveValue("3,00"); // padrão
      await page.locator('input[name="porcentagem_margem_seguranca"]').fill("400"); // 4,00
      await page.locator("select").filter({ has: page.locator('option[value="15,00"]') }).selectOption("15,00");
      await page.getByRole("button", { name: "Salvar Solicitação" }).click();
      await expect(page.getByRole("cell", { name: nome })).toBeVisible();
    });

    await test.step("B2: o banco guardou exatamente o que foi digitado", async () => {
      const pb = await superPocketBase();
      const salvo = await pb.collection("orcamentos").getFirstListItem(pb.filter("nome_cliente = {:nome}", { nome }));
      expect(salvo.user_id).toBe(seed.usuarios.associado.id);
      expect(salvo.mao_obra).toBe(80);
      expect(salvo.equipamento_local).toBe(50);
      expect(salvo.valor_total_km).toBe(400);
      expect(salvo.porcentagem_imposto).toBe(6);
      expect(salvo.porcentagem_margem_seguranca).toBe(4);
      expect(salvo.lucro_liquido_perc).toBe(15);
      expect(salvo.observacao).toBe("Observação de teste");
    });
  });

  test("consumo zerado avisa no campo e não envia", async ({ page }) => {
    const seed = lerSeed();
    await login(page, seed, "associado");
    await page.goto("/orcamentos/novo");
    await page.locator('input[name="nome_cliente"]').fill(nomeCliente("Consumo zero"));
    await page.getByPlaceholder("Digite o nome da cidade...").fill(seed.cidade.nome);
    await page.locator("li", { hasText: seed.cidade.nome }).first().click();

    let enviou = false;
    page.on("request", (r) => {
      if (r.url().includes("/criar-solicitacao")) enviou = true;
    });
    await page.getByRole("button", { name: "Salvar Solicitação" }).click();
    await expect(page.getByText("Informe o consumo mensal (maior que zero)")).toBeVisible();
    expect(enviou).toBe(false);
  });

  test("vendedor não vê a seção de custos", async ({ page }) => {
    await login(page, lerSeed(), "vendedor");
    await page.goto("/orcamentos/novo");
    await expect(page.getByRole("button", { name: "Salvar Solicitação" })).toBeVisible();
    await expect(page.getByText("Custos Operacionais e Margem Regional")).toHaveCount(0);
  });
});

test.describe("C. Precificação pelo admin", () => {
  test("admin precifica pelo formulário mantendo os custos do associado", async ({ page }) => {
    const seed = lerSeed();
    const orcamentoId = await criarOrcamento(seed, "associado", nomeCliente("Precificacao"), {
      observacao: "Texto que o admin vai apagar",
    });

    await test.step("C1: abre no Gerenciamento com o aviso e os custos do associado", async () => {
      await login(page, seed, "admin");
      await expect(menuGerenciar(page)).toHaveCount(1); // contraprova do teste de menu do associado
      await abrirNoGerenciamento(page, orcamentoId);
      await expect(page.getByText(AVISO_ASSOCIADO)).toBeVisible();
      await expect(page.locator('input[name="mao_obra"]')).toHaveValue("80,00");
      await expect(page.locator('input[name="equipamento_local"]')).toHaveValue("50,00");
      await expect(page.locator('input[name="km"]')).toHaveValue("200");
      await expect(page.locator('input[name="porcentagem_imposto"]')).toHaveValue("6,00");
      await expect(page.locator('input[name="porcentagem_margem_seguranca"]')).toHaveValue("4,00");
    });

    await test.step("C2: preenche equipamentos e kit", async () => {
      await page.locator('input[name="potencia_painel"]').fill("550");
      await page.locator('input[name="qtd_paineis"]').fill("10");
      await page.locator('input[name="marca_modulo"]').fill("PW Solar");
      await page.locator('input[name="qtd_inversores"]').fill("1");
      await page.locator('input[name="potencia_inversor"]').fill("5");
      await page.locator('input[name="modelo_inversor"]').fill("PW-5K");
      await page.locator('input[name="marca_inversor"]').fill("PW");
      await page.locator('input[name="tensao_inversor"]').fill("220");
      await page.locator('input[name="valor_kit"]').fill("1200000"); // 12.000,00
      await page.locator('input[name="porcentagem_kit"]').fill("1200"); // 12,00
    });

    await test.step("C4: apaga a observação", async () => {
      await page.locator('input[name="observacao"]').fill("");
    });

    await test.step("salva o refinamento", async () => {
      await page.getByRole("button", { name: "Salvar Refinamento Gerencial" }).click();
      await expect(page.getByText("Orçamento gerencial salvo com sucesso!")).toBeVisible();
    });

    await test.step("o banco tem o kit do admin, os custos do associado e a observação vazia", async () => {
      const pb = await superPocketBase();
      const salvo = await pb.collection("orcamentos").getOne(orcamentoId);
      expect(salvo.valor_kit).toBe(12000);
      expect(salvo.porcentagem_kit).toBe(12);
      expect(salvo.valor_kit_final).toBe(13440);
      expect(salvo.preco_final_venda).toBeGreaterThan(0);
      expect(salvo.mao_obra).toBe(80);
      expect(salvo.km).toBe(200);
      expect(salvo.valor_total_km).toBe(400);
      expect(salvo.porcentagem_imposto).toBe(6);
      expect(salvo.porcentagem_margem_seguranca).toBe(4);
      expect(salvo.margem_seguranca).toBe(635); // (13.440 + 800 + 500 + 500) / 0,96 - 15.240
      expect(salvo.observacao).toBe("");
    });

    await test.step("detalhes do admin: margem de segurança no fatiamento do associado, fora do lucro do kit", async () => {
      await page.goto(`/orcamentos/detalhes/${orcamentoId}`);
      const admin = page.locator("div.p-4.rounded-xl", { has: page.getByRole("heading", { name: "Fatiamento do Admin" }) });
      await expect(admin).toContainText("R$ 1.440,00");
      await expect(admin).not.toContainText("Margem");
      const associado = page.locator("div.p-4.rounded-xl", { has: page.getByRole("heading", { name: "Fatiamento do Associado" }) });
      await expect(associado).toContainText("Margem Segurança (4%)");
      await expect(associado).toContainText("R$ 635,00");
    });

    await test.step("detalhes do associado: margem de segurança no fatiamento dele e kit gerador sem a margem", async () => {
      await login(page, seed, "associado");
      await page.goto(`/orcamentos/detalhes/${orcamentoId}`);
      await expect(page.getByText("Margem de segurança (4%)")).toBeVisible();
      await expect(page.getByRole("row", { name: /Kit Gerador/ })).toContainText("R$ 13.440,00");
    });
  });

  test("C3: mão de obra 0 do associado aparece como 0", async ({ page }) => {
    const seed = lerSeed();
    const orcamentoId = await criarOrcamento(seed, "associado", nomeCliente("Mao de Obra Zero"), { mao_obra: 0 });

    await login(page, seed, "admin");
    await abrirNoGerenciamento(page, orcamentoId);
    await expect(page.locator('input[name="mao_obra"]')).toHaveValue("0,00");
  });

  test("C5: orçamento de vendedor não mostra o aviso do associado", async ({ page }) => {
    const seed = lerSeed();
    const orcamentoId = await criarOrcamento(seed, "vendedor", nomeCliente("Vendedor"));

    await login(page, seed, "admin");
    await abrirNoGerenciamento(page, orcamentoId);
    await expect(page.locator('input[name="mao_obra"]')).toHaveValue("100,00");
    await expect(page.getByText(AVISO_ASSOCIADO)).toHaveCount(0);
  });
});

test.describe("D/E. Associado depois da precificação", () => {
  test("associado vê o detalhe sem o kit e edita o km recalculando o preço", async ({ page }) => {
    const seed = lerSeed();
    const orcamentoId = await criarOrcamento(seed, "associado", nomeCliente("Edicao"));
    await precificarViaApi(seed, orcamentoId);

    const pb = await superPocketBase();
    const antes = await pb.collection("orcamentos").getOne(orcamentoId);

    await test.step("D1: detalhe sem os dados do kit", async () => {
      await login(page, seed, "associado");
      await page.goto(`/orcamentos/detalhes/${orcamentoId}`);
      await expect(page.getByText("Custos Operacionais e Composição Comercial")).toBeVisible();
      await expect(page.getByText(/Deslocamento \(200 km/)).toBeVisible();
      await expect(page.getByText("R$ 400,00")).toBeVisible();
      await expect(page.getByText("Valor do Kit", { exact: false })).toHaveCount(0);
      await expect(page.getByText("Lucro do Equipamento", { exact: false })).toHaveCount(0);
      await expect(page.getByText(formatarBRL(antes.preco_final_venda)).first()).toBeVisible();
    });

    await test.step("D2: edita o km de 200 para 400", async () => {
      await page.getByRole("button", { name: "Editar custos" }).click();
      await page.locator('input[name="km"]').last().fill("400");
      await page.getByRole("button", { name: "Salvar", exact: true }).click();
      await expect(page.getByText("Custos Atualizados")).toBeVisible();
    });

    await test.step("D2: preço recalculado na tela e no banco, kit intacto", async () => {
      const depois = await pb.collection("orcamentos").getOne(orcamentoId);
      expect(depois.km).toBe(400);
      expect(depois.valor_total_km).toBe(800);
      expect(depois.valor_kit_final).toBe(antes.valor_kit_final);
      expect(depois.preco_final_venda).toBeGreaterThan(antes.preco_final_venda);

      await expect(page.getByText(/Deslocamento \(400 km/)).toBeVisible();
      await expect(page.getByText(formatarBRL(depois.preco_final_venda)).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /Imprimir PDF/ })).toBeEnabled();
    });
  });

  test("E3: associado não acessa o Gerenciamento nem pelo menu nem pela URL", async ({ page }) => {
    await login(page, lerSeed(), "associado");
    await expect(page.getByRole("link", { name: "Novo Orçamento" })).toBeVisible();
    await expect(menuGerenciar(page)).toHaveCount(0);
    await page.goto("/orcamentos/gerenciamento");
    await expect(page.getByText("Valores de Entrada (Custos)")).toHaveCount(0);
  });

  test("E4: vendedor não vê o botão de editar custos", async ({ page }) => {
    const seed = lerSeed();
    const orcamentoId = await criarOrcamento(seed, "vendedor", nomeCliente("Vendedor Detalhe"));
    await precificarViaApi(seed, orcamentoId);

    await login(page, seed, "vendedor");
    await page.goto(`/orcamentos/detalhes/${orcamentoId}`);
    await expect(page.getByRole("button", { name: /Imprimir PDF/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Editar custos" })).toHaveCount(0);
  });
});

test.describe("B4. Associado corrige a solicitação pelo histórico", () => {
  test("antes da precificação: clica na linha, corrige e salva", async ({ page }) => {
    const seed = lerSeed();
    const nome = nomeCliente("Correcao");
    const orcamentoId = await criarOrcamento(seed, "associado", nome);
    const pb = await superPocketBase();
    const antes = await pb.collection("orcamentos").getOne(orcamentoId);

    await test.step("clicar na linha preenche o formulário", async () => {
      await login(page, seed, "associado");
      await page.goto("/orcamentos/novo");
      await page.getByRole("cell", { name: nome }).click();
      await expect(page.getByText("Editar Solicitação")).toBeVisible();
      await expect(page.locator('input[name="nome_cliente"]')).toHaveValue(nome);
      await expect(page.locator('input[name="consumo_mes"]')).toHaveValue("600,00");
      await expect(page.locator('input[name="mao_obra"]')).toHaveValue("80,00");
      await expect(page.locator('input[name="km"]')).toHaveValue("200");
      await expect(page.locator('input[name="porcentagem_imposto"]')).toHaveValue("6,00");
    });

    await test.step("corrige nome, consumo e mão de obra e salva", async () => {
      await page.locator('input[name="nome_cliente"]').fill(`${nome} corrigido`);
      await page.locator('input[name="consumo_mes"]').fill("90000"); // 900,00
      await page.locator('input[name="mao_obra"]').fill("9000"); // 90,00
      await page.getByRole("button", { name: "Salvar Alterações" }).click();
      await expect(page.getByText("Solicitação Atualizada")).toBeVisible();
      await expect(page.getByRole("button", { name: "Salvar Solicitação" })).toBeVisible();
    });

    await test.step("o banco tem a correção, no mesmo orçamento e com o mesmo dono", async () => {
      const depois = await pb.collection("orcamentos").getOne(orcamentoId);
      expect(depois.nome_cliente).toBe(`${nome} corrigido`);
      expect(depois.consumo_mes).toBe(900);
      expect(depois.mao_obra).toBe(90);
      expect(depois.user_id).toBe(seed.usuarios.associado.id);
      expect(depois.kwp_minimo).toBeGreaterThan(antes.kwp_minimo);
      expect(depois.preco_final_venda).toBe(0);
    });
  });

  test("depois da precificação: avisa e recalcula mantendo o kit", async ({ page }) => {
    const seed = lerSeed();
    const nome = nomeCliente("Correcao Precificado");
    const orcamentoId = await criarOrcamento(seed, "associado", nome);
    await precificarViaApi(seed, orcamentoId);
    const pb = await superPocketBase();
    const antes = await pb.collection("orcamentos").getOne(orcamentoId);

    await login(page, seed, "associado");
    await page.goto("/orcamentos/novo");
    await page.getByRole("cell", { name: nome }).click();
    await expect(page.getByText("Este orçamento já foi precificado")).toBeVisible();
    await page.locator('input[name="consumo_mes"]').fill("90000"); // 900,00
    await page.getByRole("button", { name: "Salvar Alterações" }).click();
    await expect(page.getByText("o preço de venda foi recalculado")).toBeVisible();

    const depois = await pb.collection("orcamentos").getOne(orcamentoId);
    expect(depois.consumo_mes).toBe(900);
    expect(depois.valor_kit_final).toBe(antes.valor_kit_final);
    expect(depois.preco_final_venda).toBe(antes.preco_final_venda); // consumo não muda o preço
    expect(depois.valor_pago_mes).not.toBe(antes.valor_pago_mes); // mas muda o retorno
  });
});

test.describe("Troca de usuário na mesma aba", () => {
  test("admin que entra depois do associado vê o aviso; associado depois do admin não vê orçamentos alheios", async ({ page }) => {
    const seed = lerSeed();
    const nomeAssociado = nomeCliente("Troca Associado");
    const nomeVendedor = nomeCliente("Troca Vendedor");
    await criarOrcamento(seed, "associado", nomeAssociado);
    await criarOrcamento(seed, "vendedor", nomeVendedor);

    const sair = async (perfil: string) => {
      await page.getByRole("button", { name: new RegExp(`PW ${perfil}`) }).click();
      await page.getByText("Sair").click();
      await expect(page).toHaveURL(/\/login/);
    };
    // Sem page.goto: a troca precisa acontecer sem recarregar a página, como no uso manual
    const navegarSemRecarregar = async (rota: string) => {
      await page.evaluate((r) => {
        window.history.pushState({}, "", r);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, rota);
    };
    const entrar = async (perfil: "admin" | "associado") => {
      await page.getByPlaceholder("email@empresa.com").fill(seed.usuarios[perfil].email);
      await page.getByPlaceholder("Sua senha").fill(seed.senha);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).not.toHaveURL(/\/login/);
    };

    await test.step("associado entra e sai", async () => {
      await login(page, seed, "associado");
      await expect(page.getByRole("link", { name: "Novo Orçamento" })).toBeVisible();
      await sair("associado");
    });

    await test.step("C1: admin abre o orçamento do associado e vê o aviso amarelo", async () => {
      await entrar("admin");
      await navegarSemRecarregar("/orcamentos/gerenciamento");
      await page.getByRole("cell", { name: nomeAssociado }).click();
      await expect(page.getByText(AVISO_ASSOCIADO)).toBeVisible();
      await sair("admin");
    });

    await test.step("associado entra de novo e não vê o orçamento do vendedor", async () => {
      await entrar("associado");
      await navegarSemRecarregar("/orcamentos/novo");
      await expect(page.getByRole("cell", { name: nomeAssociado })).toBeVisible();
      await expect(page.getByRole("cell", { name: nomeVendedor })).toHaveCount(0);
    });
  });
});
