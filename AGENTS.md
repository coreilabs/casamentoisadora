# Instruções para o agente

## Escopo e personalização

- Leia README.md antes de trabalhar. Este é um modelo para um novo cliente; não recupere dados, fotos, URLs ou Analytics do projeto de origem.
- Configure nome do cliente, título explícito de álbum de fotos, textos, favicon, canonical, Open Graph e Twitter. Não publique os placeholders.
- Peça somente informações que não estejam nos arquivos ou na conversa. Não publique nem faça push sem autorização do usuário.
- Não invente uma imagem social ou álbum de vídeos: use materiais e URLs fornecidos pelo cliente. Sem imagem social, mantenha as tags de imagem ausentes até receber a imagem.
- Preserve UTF-8. Use SVG para ícones de interface, evitando caracteres que possam gerar mojibake.

## Hashes obrigatórios

- Após QUALQUER modificação, execute `python scripts/version_assets.py --force` antes de entregar ou publicar, mesmo sem mudança no conteúdo do CSS/JS.
- Confirme novos parâmetros `?v=` nos estilos e scripts de index.html e na importação do PhotoSwipe em assets/app.js.

## Galeria e arquivos

- Preserve virtualização por blocos, geometrias reservadas, skeleton, cancelamento de downloads distantes e prioridade para imagens próximas da tela atual. Não volte a acumular todas as imagens no DOM ou usar uma fila que espere downloads antigos terminarem.
- Preserve swipe, zoom, download, compartilhamento, acessibilidade e preferência de movimento reduzido. Valide estados de carregamento, falha e cancelamento.
- Use os helpers locais para conversão em lotes; não processe as fotos manualmente pelo agente. Não gere miniaturas sem pedido.
- Não exclua os JPGs do novo cliente sem que ele solicite essa exclusão. Quando autorizada, use o verificador antes de excluir: ele valida todos os WebP e restringe caminhos.
- Não altere a ordem do catálogo ou os identificadores sem considerar links compartilhados e métricas. Não afirme que a ordenação por nome é cronológica.
- Sem Analytics do cliente, mantenha a coleta desativada. Não trate cópia, cancelamento ou falha como compartilhamento concluído, nem afirme confirmar entrega.

## Validação no navegador

- Sempre use o Google Chrome instalado através do Playwright (`channel: 'chrome'`). Prefira o MCP playwright configurado.
- Se indisponível, nesta máquina use a instalação compartilhada em `C:/Users/user/.codex/tools/browser/node_modules/playwright` e importe `C:/Users/user/.codex/tools/browser/chrome.cjs`, usando launchChrome(). Se os caminhos não existirem em outra máquina, informe a limitação e use uma instalação compartilhada disponível.
- Não instale Playwright ou navegadores no projeto apenas para validar. Não altere o navegador padrão nem use o perfil pessoal do usuário.
- Verifique desktop e celular, renderização, interações, erros e acessibilidade básica. Não relate validação que não ocorreu.
- Guarde capturas e traces temporários fora do repositório, em `C:/Users/user/.codex/browser-artifacts/<projeto>/<execucao>/` ou diretório temporário equivalente. Remova apenas arquivos criados pela própria execução quando não necessários à entrega.
- Exceções HTTPS para certificados autoassinados são apenas para desenvolvimento local.
