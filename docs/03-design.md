# 03 — Design

O protótipo aprovado pelo Victor (17 telas) está em https://claude.ai/artifact/3EhYjdBbJrZo8apRBW8iRy .
O código segue esse protótipo.

## Regras do Victor
- **Fundo sempre escuro.** Não existe tema claro. Há teste e2e que confere isso.
- **Roxo e branco são as cores principais:** logo, botões, destaques, aba ativa.
- **Verde só em números e gráficos:** economia, queda de preço, barra de despensa cheia. Nunca em botão ou marca.

## Tokens (`src/app/globals.css`, bloco `@theme`)
| Token | Uso |
|---|---|
| `fundo`, `fundo-nav` | fundo da página e do menu inferior |
| `superficie`, `superficie-2` | cartões e blocos internos |
| `borda`, `borda-forte` | contornos |
| `texto`, `texto-2`, `muted`, `apagado` | texto do mais forte ao mais fraco |
| `roxo` (#7c3aed), `roxo-claro`, `roxo-suave`, `roxo-fundo`, `roxo-chip` | identidade |
| `verde` | números positivos, gráficos |
| `ambar`, `laranja` | atenção, faixa de preço alta |

Use as classes geradas (`bg-roxo`, `text-muted`...). Evite cor em hexadecimal solta nas telas.

## Fontes
Bricolage Grotesque (títulos, `font-display`) e Public Sans (texto, `font-sans`), via `next/font/google`.

## Componentes (`src/components/ui.tsx`)
`Pagina`, `Cabecalho`, `Cartao`, `Titulo`, `SecaoTitulo`, `Chip`, `Selo`, `BarraProgresso`, `Numero`, `BotaoLink`,
`FotoProduto`, `Avatar`, `LinhaMenu`, `Logo`. Ícones em `Icone.tsx` (SVG próprios, sem biblioteca).
`Mapa.tsx` desenha um mapa esquemático (sem API externa) com pinos de preço coloridos pela faixa; o mapa real (MapLibre + OpenStreetMap) entra depois.

## Acessibilidade
Alvos de toque ≥ 44px, `aria-current` no menu, barras de progresso com `role="progressbar"`, mapa com `role="img"` e descrição.
