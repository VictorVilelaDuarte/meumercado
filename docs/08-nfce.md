# 08 — NFC-e (nota fiscal do consumidor)

Status: **testado com 4 notas reais em 2026-10-20** (Tauste, Americanas e 2 do Carrefour, todas de São José dos Campos).
Leitor pronto em `src/nfce/` e ligado na tela `/escanear` (colando o link; câmera é Fase 1).

## Resposta curta
- **Sim, dá para pegar EAN e NCM sem certificado e sem captcha**, mas não na página que o QR Code abre.
- A página do QR Code ("Consulta Resumida") traz só descrição, código interno do mercado, quantidade, unidade e preços.
- O botão **"Visualizar em Abas"** leva à "Consulta Completa", que traz por item: **NCM, EAN (GTIN), CEST, CFOP, desconto**
  e, do mercado, CEP e inscrição estadual. É dela que o app tira o EAN.
- A completa às vezes devolve a tela de captcha (em 2026-10-20, ~1 em cada 2 tentativas). Tentar de novo com sessão nova resolve
  em poucas tentativas. Se não resolver, ficamos com a resumida (os preços valem; só não casa produto por EAN).
- CPF: nas 4 notas o consumidor não se identificou ("Consumidor não identificado"), então não confirmamos ainda o que aparece com CPF.
  A aba "Destinatário" da completa é onde ele apareceria: **o leitor não lê essa aba** de propósito.

## Passo a passo (o que `src/nfce/sefaz.ts` faz)
1. `GET` no link do QR Code (`.../ConsultaQRCode.aspx?p=<chave>|2|1|1|<hash>`) → página resumida + cookies `ASP.NET_SessionId`, `__AntiXsrfToken`, `TS0...`.
2. `POST` em `.../ConsultaResponsiva/ConsultaResumidaRJFrame_v400.aspx` com `__EVENTTARGET=btnVisualizarAbas`, `__VIEWSTATE`,
   `__VIEWSTATEGENERATOR` e `__EVENTVALIDATION` tirados da página do passo 1 → `302` para `ConsultaPublica.aspx`.
3. `GET` em `.../ConsultaPublica.aspx` com os mesmos cookies → página completa (~50 a 350 KB). Se vier o formulário com captcha
   ("Digite os caracteres da imagem"), recomeça do passo 1.

Isso roda no servidor (`POST /api/nfce`), porque o navegador não pode chamar a Sefaz direto (CORS) e porque precisamos dos cookies.
O servidor **só consulta `www.nfce.fazenda.sp.gov.br`**: `lerQrCode` confere a chave (dígito verificador) e refaz o link.
Por quê assim e não pelo XML: ADR `docs/decisoes/0006-leitura-pela-consulta-completa.md`.

## Formato da página completa
Abas em `<div id="Conteudo_pnlNFe_tab...">`; os campos seguem o padrão `<label>Rótulo</label><span>valor</span>`.
Cada item é um `<table class="toggle box">` (número, descrição, quantidade, unidade, valor total) seguido de um
`<table class="toggable box">` com os detalhes. Rótulos que usamos:

| Campo | Rótulo na página | Exemplo real |
|---|---|---|
| Chave | legenda "Dados da NF-e:" | 35261065897910001560650260000624591342950530 |
| Emissão | Data de Emissão | 20/10/2026 13:45:26-03:00 |
| Mercado | Nome / Razão Social, Nome Fantasia, CNPJ, Endereço, Bairro / Distrito, CEP, Município, UF | TAUSTE SUPERMERCADOS LTDA, 65.897.910/0015-60, AV. SAO JOAO, 2555, JARDIM DAS COLINAS, 12242-000 |
| Código do mercado | Código do Produto | 102858 |
| NCM | Código NCM | 02071422 |
| EAN | Código EAN Comercial | 7894904575794, `SEM GTIN` (pesados na loja), 07894900093001 (Carrefour usa GTIN-14) |
| Unitário | Valor unitário de comercialização | 32,8800000000 |
| Desconto do item | Valor do Desconto | 7,200 |
| Totais | Valor Total dos Produtos, Valor Total dos Descontos, Valor Total da NFe | 213,290 · 7,200 · 206,090 |

Números vêm em formato brasileiro com 3 a 10 casas ("206,090", "0,3560"). `centavosBr` converte sem passar por float.

## O que as 4 notas mostraram
| Nota | Itens | Com EAN | Com NCM | Observações |
|---|---|---|---|---|
| Tauste (Jd. das Colinas) | 22 | 18 | 22 | 4 itens a granel (frios, kibe, iscas) vêm `SEM GTIN`; desconto de R$ 7,20 na água; unidades KG, CX, SH, PC, BJ, PT, TP, FR |
| Americanas (Jd. Aquarius) | 1 | 1 | 1 | razão social em minúsculas ("americanas sa - 0550"); unidade PCE |
| Carrefour (Jd. Serimbura) 1 | 7 | 7 | 7 | EAN com 14 dígitos e zero na frente; unidade sempre "un9"; código interno "SS040947" |
| Carrefour (Jd. Serimbura) 2 | 3 | 3 | 3 | sobrecoxa temperada tem EAN (embalada) |

- **33 itens, 29 com EAN (88%), 33 com NCM (100%).** O plano de casar produto pelo EAN vale para quase tudo; o que fica sem EAN
  é o que é pesado na loja, e aí entra o código do mercado + CNPJ.
- Com a tabela de NCM ajustada (ovos 0407, carnes preparadas 1602, conservas 2005, molhos 2103, algodão/hastes 5601),
  **todos os 33 itens ganharam categoria pelo NCM**, sem ir para revisão.
- Descrições são abreviadas e diferentes por rede ("REFRIG FANTA GUARANA", "BEB LAC PIRAC WH MO", "QJO COTAGE TIROLEZ"):
  casar por descrição seria frágil, mais um motivo para o EAN.
- Itens repetidos aparecem em linhas separadas (5× "FEIJAO PR FUGINI CAR"); o leitor mantém cada linha.

## Exemplos salvos (`src/nfce/__fixtures__/`)
Para cada nota, `<mercado>-resumida.html` e `<mercado>-completa.html`. Foram **anonimizados** antes de entrar no repositório:
sem scripts, sem `__VIEWSTATE` (dado de sessão), número do cartão trocado por `000000******0000`, nome do operador de caixa
trocado por "OPERADOR", códigos de autorização do cartão zerados e o hash do QR Code zerado (ele permite reabrir a nota na Sefaz).
A chave de acesso ficou, porque é ela que os testes conferem.

Para adicionar uma nota nova: baixe as duas páginas (passo a passo acima), passe pelo mesmo tratamento, salve aqui e
acrescente o nome na lista `NOTAS` de `src/nfce/__tests__/lerNota.test.ts`. Os testes de "soma bate com o total" e
"todo item ganha categoria" rodam para cada nota da lista.

## Plano de reconhecimento de produto (sem bipar)
1. Se a nota trouxer EAN: produto = EAN normalizado para 13 dígitos (`normalizarEan`). Dado mais forte.
2. Senão: código interno do mercado + CNPJ, aprendido na primeira vez que o admin confirma.
3. Senão: descrição normalizada parecida com outra já confirmada → sugestão para o admin.
Categoria sempre pelo NCM (ADR 0003).

## Ainda a descobrir
- Nota com CPF: confirmar que os itens são iguais e que o leitor continua ignorando o destinatário.
- Nota cancelada ou com chave que não existe: que página a Sefaz devolve (hoje dá erro "não parece uma NFC-e").
- Limite de consultas por IP no servidor de produção (Vercel). Se bloquear, guardar a nota e tentar a completa mais tarde.
- Outras redes da cidade (Pão de Açúcar, Dia, Atacadão, Assaí...) para ver variações de formato.
