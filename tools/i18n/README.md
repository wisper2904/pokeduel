# Tradução PT / EN / ES (v714)

O jogo é traduzido num ponto central (`js/data/i18n_runtime.js`): todo texto que aparece no DOM, no canvas,
no log (`setLogText`), em `alert/confirm` e em `t()` sem chave passa por `L(texto)`, que procura no
dicionário `js/data/i18n_dict.js` (gerado). Cada entrada é `[pt, en, es, original?]`; `{0}`, `{1}`… são partes
variáveis (nomes, números). Qualquer das variantes acha a entrada, então o texto pode estar em qualquer língua no código.

## Texto novo no jogo
1. Escreva o texto normalmente (em PT ou EN).
2. Adicione uma linha em `tr/900_manual.txt`: `@texto original|pt|en|es` (`=` = igual ao original; use `{0}` nas partes variáveis).
3. `python3 tools/i18n/build.py` → regenera `js/data/i18n_dict.js`. Suba o `CACHE_NAME` do `sw.js`.

## Varredura completa (opcional)
- `extract.js` (precisa de `npm i acorn acorn-walk` nesta pasta) extrai literais/templates/concatenações dos JS e do HTML.
- `ordered.json` é a lista com IDs estáveis usada pelos lotes `tr/0NN.txt` (`id|pt|en|es`). Nunca reordene: anexe no fim.
- `crawl.py` (Chrome headless na porta 9222 + servidor em 8765) percorre telas e uma partida bot × bot nas 3 línguas;
  `detect.py` aponta textos na língua errada (tem falsos positivos: "toque", "combate", "da"…).

Glossário: PT Falha · Esquiva · Gol · Ponto de Entrada · Banco · Espera · Placa · Movimento Z · Apoio (Tag) ·
ES Fallo · Esquiva · Meta · Punto de entrada · Banquillo · Espera · Placa · Movimiento Z · Apoyo · PM.
