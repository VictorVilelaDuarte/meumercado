# 08 — NFC-e (nota fiscal do consumidor)

Status: **ainda não testado com notas reais.** O Victor vai trazer notas para o teste (Fase 0, item 1 do roteiro).

## O que sabemos
- O QR Code da NFC-e de SP aponta para a consulta pública da Sefaz-SP, com a chave de acesso (44 dígitos) e parâmetros.
- A página de consulta mostra: emitente (razão social, CNPJ, endereço), itens (descrição, código do produto no mercado, quantidade, unidade, valor unitário e total), totais, forma de pagamento, data e hora.
- A chave de acesso contém UF, ano/mês, CNPJ do emitente, modelo (65), série e número.

## Dúvidas para o teste com notas reais
- A consulta pública mostra **EAN (GTIN)** e **NCM** dos itens? Em muitas notas a página resumida não mostra; a versão completa (XML) tem os campos `cEAN` e `NCM`, mas o acesso ao XML pode exigir certificado.
- O EAN aparece mesmo sem CPF na nota? (O CPF não deveria mudar os itens, mas confirmar.)
- Formato das descrições por rede (ex.: "PAP HIG NEVE FD 12X30").
- Limites de acesso da página da Sefaz (bloqueio por excesso de consultas, captcha).

## Plano de reconhecimento de produto (sem bipar)
1. Se a nota trouxer EAN: produto = EAN (dado mais forte).
2. Senão: código interno do mercado + CNPJ, aprendido na primeira vez que o admin confirma.
3. Senão: descrição normalizada parecida com outra já confirmada → sugestão para o admin.
Categoria sempre pelo NCM (ADR 0003).

Atualize este arquivo com o que o teste mostrar, incluindo exemplos reais (sem CPF ou dados pessoais).
