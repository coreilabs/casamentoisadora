# Álbum de Fotos do Casamento de Isadora e Daniel Melo

Galeria estática do casamento de Isadora e Daniel Melo, preparada para https://coreilabs.github.io/casamentoisadora/. Sem Analytics configurado e sem dependências locais de navegador.

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

A grade usa quadros horizontais 3:2 e `object-fit: contain`: fotos horizontais e verticais aparecem inteiras, com margens quando necessário. Não são gerados arquivos separados de miniaturas. Use `--max-size 1920` para definir o limite do conversor (padrão: 1920). Alterar o limite invalida a retomada das conversões anteriores.

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

Eventos GA4 disponíveis após adicionar a tag: `photo_share_click`, `share`, `photo_link_copy`, `photo_share_cancel`, `photo_share_error`. Parâmetros: `content_type`, `item_id`, `method`. Registre dimensões de escopo de evento para `item_id` e `method` se precisar analisar por foto. Compartilhamento nativo concluído não comprova entrega; copiar link não comprova envio.

PhotoSwipe 5.4.4 sob licença MIT, incluída em `assets/vendor/LICENSE`.

