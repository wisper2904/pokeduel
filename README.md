# 🏆 PokeDuel — Edição Multiplataforma 3D (`v5.6.0` · GitHub Pages / PWA / Android / iOS)

Versão completa multiplataforma do **PokeDuel** (inspirado em *Pokémon Duel / Pokémon Trading Figure Game v7.0.16*), pronta para rodar direto no **GitHub Pages**, instalar como **PWA** no **iPhone/iPad (iOS)**, **Android** e **PC**, e jogar em **Cross-Play P2P** com o aplicativo `.apk`.

## ✨ Recursos Inclusos (`v5.6.0`)
- **306 Miniaturas 3D Esculturais (Modelo Nano Banana)** com pedestais metálicos e roletas oficiais de 96 fatias (`Data Disk`).
- **9 Cartas Táticas (Plates) com Arte 3D Nano Banana** e limite estrito de custo `6/6 ◆`.
- **IA Grandmaster 2-Ply Minimax no Modo Ranqueado (`League Match`)**: analisa sua resposta em 2 turnos, monta Counter-Deck EX/UX escalado (`Lv.8–10`, `CLv+6..+10`, `Evo +10 DMG / +1★`) e usa Plates (`Double Chance`, `Max Revive`, `Mega Plate [UX]`, `Hurdle Jump`, `Goal Block`, `X Attack`, `X Speed`).
- **Multiplayer P2P WebRTC (`Room Match 180°`)**: conecte qualquer celular (`.apk` ou navegador) e PC usando o código de 4 dígitos da sala, com perspectiva de mesa invertida em 180°.
- **Cross-Save entre `.APK`, iPhone e PC**: na aba **Config**, exporte/importe seu Código de Transferência (`POKEDUEL_SAVE_V560:...`) ou arquivo `.pokeduel` para sincronizar sua conta entre dispositivos.

## 🚀 Como publicar no GitHub Pages em 1 minuto

1. Crie um repositório no seu GitHub (ex.: `pokeduel`).
2. Extraia o conteúdo deste pacote (`PokeDuel-GitHub-Pages-v5.6.0.zip`) na raiz do repositório (de forma que `index.html`, `manifest.json`, `sw.js` e a pasta `vendor/` fiquem na raiz).
3. No GitHub, abra **Settings ➔ Pages**:
   - Em **Build and deployment ➔ Source**, selecione **Deploy from a branch** (branch `main` / pasta `/ (root)`) **ou** selecione **GitHub Actions** (o workflow `.github/workflows/deploy-pages.yml` já está configurado automaticamente).
4. Em segundos, seu jogo estará no ar em:
   `https://<seu-usuario>.github.io/pokeduel/`

## 📱 Como instalar como App no iPhone (iOS), Android e PC
- **No iPhone / iPad (Safari)**: abra o link do seu GitHub Pages no Safari, toque em **Compartilhar** (ícone de quadrado com seta para cima) e escolha **Adicionar à Tela de Início**. O **PokeDuel** abrirá em tela cheia como aplicativo nativo!
- **No Android (Chrome) ou PC (Chrome/Edge)**: abra o link do GitHub Pages e toque no botão **📲 Instalar App (PWA)** na aba **Config** (ou no menu do navegador **Instalar aplicativo**).
