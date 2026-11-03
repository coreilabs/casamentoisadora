# Álbum de Fotos do Casamento de Isadora e Daniel Melo

Galeria estática do casamento de Isadora e Daniel Melo, preparada para https://coreilabs.github.io/casamentoisadora/. Google Analytics configurado com o ID `G-Q1X5MDKPFR`, sem dependências locais de navegador.

## Personalização

1. Títulos, descrições, textos, compartilhamento e favicon estão personalizados para Isadora e Daniel Melo.
2. Canonical e Open Graph usam `https://coreilabs.github.io/casamentoisadora/`.
3. A imagem social fornecida pelo casal está em `assets/imgs/opengraph.webp` (1200 × 630 px).
4. Open Graph e Twitter usam a URL absoluta da imagem, com descrições alternativas. O Twitter Card usa `summary_large_image`. Ao substituir a imagem, revise dimensões e descrições em `index.html`.
5. Para vídeos, adicione um link com classe `video-album` dentro de `.hero-actions`, usando a URL do novo cliente. O link antigo foi removido.
6. Se houver Analytics, adicione a tag GA4 do NOVO cliente ao head. Os eventos do botão já chamam `window.gtag` quando disponível, usando a propriedade configurada nessa tag. Sem tag, a galeria funciona sem enviar esses eventos. Não reutilize o ID de outro cliente.
7. O crédito “Criado por Marco Aurélio com ❤️” foi mantido e pode ser ajustado quando solicitado.

## Inserir e converter fotos

Requisitos: Python e ImageMagick (`magick` no PATH). Os programas não estão dentro do ZIP. Nesta máquina ambos já estão instalados.

Coloque JPGs em `assets/gallery`. Clique duas vezes em `converter-fotos.bat` para converter o próximo lote de 100, com retomada automática. Ou use:

```powershell
# Um lote de 100; repetir pula arquivos já convertidos.
python scripts/convert_webp.py

# Todos os lotes; preserva JPGs por padrão.
python scripts/convert_webp.py --all --batch-size 100 --workers 4

# Apenas quando desejar APAGAR os JPGs após validar todos os WebP.
python scripts/convert_webp.py --all --batch-size 100 --workers 4 --delete-originals

# Validar conversões prontas e excluir os originais correspondentes.
python scripts/verify_webp.py --delete-originals
```

Padrão: WebP qualidade 82, maior lado limitado a 1920 px, sem ampliar fotos menores, orientação EXIF aplicada e metadados removidos. A conversão tem perdas. O progresso fica em `scripts/webp-progress.json`, criado no primeiro uso. Não execute conversões simultâneas. Só remova o lock deixado por um encerramento forçado após confirmar que o processo terminou.

WebP já prontos também podem ser colocados diretamente em `assets/gallery-webp`. Depois execute `python scripts/catalog.py`. O catálogo funciona sem JPGs ou arquivo de progresso. O helper de conversão chama o catálogo e renova versões automaticamente.

A grade usa quadros horizontais 3:2 e `object-fit: contain`: fotos horizontais e verticais aparecem inteiras, com margens quando necessário. Use `--max-size 1920` para definir o limite do conversor (padrão: 1920). Alterar o limite invalida a retomada das conversões anteriores.

Após converter fotos novas, gere as miniaturas com ImageMagick:

```powershell
python scripts/thumbnails.py
```

As miniaturas WebP ficam em `assets/gallery-thumbs`, com largura máxima de 320 px e qualidade 76. A altura mantém a proporção, sem cortes nem ampliação de fotos menores. A grade usa miniaturas; ampliar e baixar usa os WebP de até 1920 px. O script valida cada saída, retoma arquivos atuais, atualiza o catálogo e renova as versões. Publique também a pasta de miniaturas. O progresso fica em `scripts/thumbnails-progress.json`; não execute conversões simultâneas. Sem miniatura atual, o catálogo mantém a foto maior como alternativa.

## Visualizar e publicar

```powershell
python -m http.server 8080
```

Abra http://localhost:8080, sem abrir o HTML por `file://`. Publique a raiz em um repositório novo e configure o GitHub Pages. Preserve `.nojekyll`. Inclua as fotos, o catálogo e os arquivos versionados na publicação. Não há backend, npm install ou build obrigatório.

Após QUALQUER alteração, execute:

```powershell
python scripts/version_assets.py --force
```

## Recursos preservados

Layout responsivo e textos ampliados; PhotoSwipe local com swipe e zoom; download WebP; compartilhamento; skeleton com animação e preferência de movimento reduzido; blocos virtualizados de 40; fila de quatro downloads, cancelamento de requisições distantes e prioridade para a tela atual.

O catálogo é ordenado pelo nome como texto, não por data. Links `#foto=N` dependem da posição; adicionar/remover arquivos pode alterar os índices. O ID das métricas usa o nome original como identificador lógico mesmo quando apenas o WebP existe. A prévia social representa o álbum, não cada foto.

## Idiomas

As bandeiras locais vêm de [flag-icons 7.3.2](https://github.com/lipis/flag-icons/tree/v7.3.2), em `assets/vendor/flag-icons`, com licença MIT incluída. Usamos somente Brasil e Austrália em proporção 4:3 e as classes `fi fi-br` / `fi fi-au`. As bandeiras não têm borda ou sombra própria; o botão mantém sua borda. O helper renova também as URLs das bandeiras no CSS.

A interface oferece português e English (Australia), com tradução editorial local, sem serviço externo. O seletor fica na barra fixa de créditos, inclusive no celular e dentro do visualizador. O botão mostra somente a bandeira do idioma ativo: Brasil em português, Austrália em inglês. O menu apresenta ambas as opções com suas bandeiras. Os botões preservam a indicação HD: “Baixar Foto HD” / “Download HD photo”.

Na primeira visita, navegadores em inglês recebem inglês australiano; os demais recebem português. A escolha manual fica em `localStorage` (`wedding-language`) quando disponível. Trocar o idioma preserva a foto e a posição da página. Textos, mensagens, controles, alternativas acessíveis e título de compartilhamento acompanham a escolha. Metadados traduzidos no navegador não garantem prévias sociais em inglês: robôs normalmente leem o HTML estático em português. Canonical e URLs das imagens são preservados.

O evento `language_change` registra mudanças manuais efetivas, com `previous_language` e `selected_language`. Os eventos da galeria incluem `interface_language`. A localização dos textos está no dicionário `translations` de `assets/app.js`.

## Rastreamento GA4

A tag atual recebe os eventos pelo código, sem alterações no painel. As contagens ficam disponíveis por nome de evento; enviar parâmetros não cria automaticamente colunas nos relatórios comuns. Analisar por arquivo nos relatórios comuns ainda pode exigir dimensões personalizadas. Não há um nome de evento diferente para cada foto.

- `album_load`, `album_load_error`: resultado do catálogo, quantidade e tempo de carregamento.
- `album_batch_load`: blocos disponibilizados, com método `initial`, `automatic` ou `button`. Não significa que todas as fotos do bloco foram vistas.
- `navigation_click`: controles da página, incluindo explorar, início, carregar mais e tentar novamente (`control`).
- `photo_thumbnail_click`, `photo_open`: clique na grade e abertura, inclusive por link direto.
- `photo_view`: foto atual carregada e exibida com a página visível; inclui navegação, sem contar preload. `load_time_msec` mede a espera desde a seleção; fotos em cache podem registrar zero.
- `photo_navigate`: troca de foto, direção e método `button`, `keyboard` ou `gesture` quando identificável. `gesture` abrange toque/mouse; não identifica exclusivamente swipe.
- `viewer_control_click`: controles de próxima, anterior, zoom e fechar. Download e compartilhamento têm seus próprios eventos de clique.
- `photo_zoom`: primeira ampliação de cada passagem pela foto.
- `photo_close`: fechamento do visualizador.
- `photo_download_click`: solicitação de download; não confirma salvamento no dispositivo.
- `photo_share_click`, `share`, `photo_link_copy`, `photo_share_cancel`, `photo_share_error`: clique e resultados separados. O método é `native` ou `copy_link`. Sucesso da API nativa não confirma entrega; copiar não confirma envio; abrir o prompt manual não confirma cópia.
- `photo_engagement`: intervalos ativos em `engagement_time_msec`, enviados ao trocar/fechar foto, ocultar ou sair da página. O tempo em aba oculta é excluído. Analise a soma dos intervalos, não sua contagem como número de visualizações.
- `album_progress`: marcos de 25, 50, 75 e 100, uma vez por carregamento da página. Mede a posição mais distante alcançada no catálogo pela grade visível ou foto ampliada, não a porcentagem de fotos distintas vistas. Um link direto pode atingir marcos sem percorrer fotos anteriores.
- `photo_load_error`: falhas de miniatura ou visualizador (`image_type`); cancelamentos normais de imagens distantes não são erros.

Os eventos enviam `album_id`; os eventos de foto também enviam `content_type`, `item_id` (nome original) e `photo_position`. Falhas ou bloqueio do Analytics não interrompem a galeria. Bloqueadores, restrições do navegador e encerramentos abruptos podem impedir a coleta. Os eventos complementares de clique, visualização e resultado não devem ser somados como se fossem uma única métrica de cliques.

Validação local: intercepte a tag e o envio ao Google antes de abrir a página e confira os argumentos `event` de `window.dataLayer`; assim os testes não geram visitas na propriedade real. Testes com APIs simuladas validam o tratamento do resultado, não entrega real de compartilhamentos.

PhotoSwipe 5.4.4 sob licença MIT, incluída em `assets/vendor/LICENSE`.

