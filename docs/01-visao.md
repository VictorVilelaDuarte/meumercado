# 01 — Visão do produto

## Em uma frase
Um app web, só para convidados, onde amigos de São José dos Campos escaneiam a nota fiscal do mercado e, juntos,
descobrem onde cada produto está mais barato.

## Para quem
Começa com amigos e conhecidos do Victor em São José dos Campos/SP. Cresce por convite, sempre com aprovação do administrador.

## Como os dados chegam
1. A pessoa compra no mercado e recebe a NFC-e (cupom com QR Code).
2. Escaneia o QR Code no app.
3. O app lê a nota na Sefaz-SP: mercado (CNPJ, endereço), itens, preços, data.
4. Cada item vira um **preço observado** (produto, mercado, valor, data) que todos veem, **sem o nome de quem comprou**.
5. A nota inteira fica na conta da pessoa e alimenta a aba privada de gastos.

Detalhes do que a nota traz e não traz: `08-nfce.md`.

## O que todo mundo vê (compartilhado)
- Busca de produtos com o menor preço atual e em quantos mercados aparece.
- Página do produto com **mapa dos mercados** coloridos pela faixa de preço, lista de preços e histórico.
- Mapa e ranking de mercados (índice de preço: 100 = média da cidade).
- Ofertas da semana (maiores quedas).
- Desafio do mês (só nome e percentual de economia).

## O que só a pessoa vê (privado)
- Suas notas, gastos por mês e por categoria, inflação pessoal, economia perdida.
- Lista de compras, alertas, despensa, pontos.

## Decisões de produto do Victor (não mudar sem falar com ele)
- **Ninguém bipa código de barras.** O produto é reconhecido a partir da nota.
- **Categorias automáticas sem IA:** pelo código NCM da nota, com regras de descrição como reserva e revisão do admin para o que sobrar.
- **Convite + aprovação:** qualquer membro convida; o administrador aprova cada entrada.
- **Visual:** fundo sempre escuro, roxo e branco como cores principais, verde só em gráficos e números.
- **Referência de funcionalidades:** https://mercadocompare.com/ — ter tudo o que ele tem e mais.

## O que NÃO é (por enquanto)
- Não é aberto ao público.
- Não é app de loja (é PWA instalável pelo navegador).
- Não usa IA para categorizar.
