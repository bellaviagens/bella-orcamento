# Project TODO

- [x] Definir tipos TypeScript (trip, flights, hotels, fares, baggage)
- [x] Configurar tema visual (cores da Bella, fontes Poppins/Inter)
- [x] Criar store/context para gerenciar estado do orçamento
- [x] Backend: procedure para processar screenshot de voo via LLM
- [x] Backend: procedure para processar screenshot de hotel via LLM
- [x] Componente: formulário de informações da viagem
- [x] Componente: formulário de voos com suporte a escalas
- [x] Componente: formulário de hotéis
- [x] Componente: formulário de tarifas (BASIC/LIGHT/FULL)
- [x] Componente: formulário de guia de bagagens
- [x] Componente: upload de screenshot com AI parsing
- [x] Componente: preview do PDF em tempo real
- [x] Componente: template do PDF para impressão
- [x] Página principal com layout split (formulário + preview)
- [x] Funcionalidade: gerar PDF via print
- [x] Testes vitest

- [x] Refatorar tarifas: remover 3 opções fixas, permitir adicionar quantas quiser com nomes customizáveis
- [x] Centralizar tarifas no preview quando houver menos de 3
- [x] Corrigir scroll do preview para mostrar hotéis adicionados
- [x] Melhorar feedback de PDF gerado (indicar pasta de downloads)
- [x] Permitir scroll completo no preview para visualizar múltiplos hotéis

- [x] Permitir edição de hotéis já adicionados (clique para editar)
- [x] Adicionar campo de URL do hotel (Booking/Airbnb/etc)
- [x] Buscar foto automaticamente do link do hotel
- [x] Botão "Ver no site" para abrir link do hotel
- [x] Adicionar scroll nos formulários da esquerda
- [x] Voltar preços dos hotéis para junto com as tarifas (layout original)
- [x] Remover seção separada de "Opções de Hospedagem" e integrar com tarifas

- [x] Refatorar cálculo de preços: cada hotel deve mostrar (hotel + aéreo) × passageiros
- [x] Remover seção separada de tarifas do preview
- [x] Cada hotel mostra preços por tarifa: "COM AÉREO BASIC", "COM AÉREO LIGHT", etc
- [x] Remover scroll dos formulários (voltar ao layout simples)
- [x] Validar que preço do aéreo é fixo para todas as tarifas

- [x] Adicionar scroll no preview do PDF (página de resultado)
- [x] Adicionar checkbox "Incluir Aéreo" para controlar se soma o aéreo ou mostra apenas hotel
- [x] Corrigir download do PDF (usar html2canvas + jsPDF corretamente)
- [x] Permitir orçamento só de hotel, só de aéreo, ou ambos

- [x] Permitir exibir preços de hotel mesmo sem tarifas cadastradas (para cotações somente de hospedagem)
- [x] Validar funcionalmente o fluxo de download do PDF no navegador (testar em Chrome/Firefox/Safari)
- [x] Implementar fallback com blob/object URL se pdf.save() não funcionar em alguns navegadores

- [x] Debugar e corrigir erro de geração do PDF (remover imagens externas antes de capturar, adicionar crossOrigin)

- [x] Validar manualmente no navegador o fluxo completo de download do PDF
- [x] Implementar proxy server-side para imagens externas (endpoint criado, integrado com HotelCard)

- [x] Reduzir tamanho e destaque da seção de bagagens
- [x] Adicionar campo benefits ao FareTier e renderizar no HotelCard
- [x] Sincronizar benefícios ao editar tarifas existentes (recalcular quando checkboxes mudam)
- [x] Validar manualmente o download do PDF no navegador após correção de erros

- [x] Adicionar campos de parcelamento numéricos (aéreo e hotel)
- [x] Adicionar opção de "Parcelar tudo junto"
- [x] Mostrar parcelamento no PDF preview

- [x] CORRIGIDO: Erro de oklch/oklab no PDF - Estratégia agressiva de inline styles
- [x] Testado PDF com dados vazios - Sucesso!
- [x] Testado PDF com voo real (GRU → SCL) - Sucesso!
- [x] Validado em múltiplos navegadores - Funciona!

- [x] Corrigir corte de observações de parcelamento em quebra de página (adicionar break-inside-avoid e espaçamento)

- [x] Subir blocos de tarifas reduzindo espaçamento (mb-4 para mb-2, mt-6 para mt-2)

- [x] Otimizar espaços vazios para 2 hotéis caberem em uma página (h-40→h-32, p-5→p-4, gaps e margins reduzidos)

- [x] Refatorar HotelCard para layout compacto sem foto grande - 2 hotéis por página (mantendo cores, fórmulas e design)

- [x] Adicionar foto do hotel (80x80px) ao lado da descrição, mantendo layout compacto

- [x] Aumentar foto do hotel para 96x96px
- [x] Mover botão para ao lado da foto com texto "ACESSAR SITE E FOTOS"
- [x] Diminuir blocos de tarifas (padding p-1.5, texto menor)

- [x] Mover nota "Os valores apresentados..." para última página (fixo lá)
- [x] Aumentar margem antes de "Opções de Hospedagem" (py-4 para py-8)

- [x] Mover nota para final da primeira página (antes do footer "Página 1")

- [x] Mover nota para seção de voos (após "Horários dos Voos Selecionados")

- [x] Mover nota para rodapé da primeira página (flex-grow spacer + estrutura flexbox)

- [x] Reduzir tamanho da mensagem de nota (texto [10px], padding p-2, ícone h-4 w-4) - mantém no rodapé da primeira página

- [x] Adicionar ícones correspondentes aos benefícios (mala 🧳, assento 💺, alterações 🔄, etc)

- [x] Reorganizar ícones e benefícios para layout horizontal (flex-wrap, gap-1)

- [x] Reorganizar benefícios para lado direito do bloco de tarifas (layout flex, justify-end)

- [x] Restauração de Ícones: Voltar a exibir ícones coloridos originais (🧳, 📦, 💺, 🔄, 💰, 🎒, ⚡) em ambos os cards (BÁSICA e PLUS)
- [x] Padronização Visual: Garantir que ambos os cards sigam a mesma estrutura visual e alinhamento de topo
- [x] Aumentar ligeiramente a largura dos cards para dar "respiro" às 2 colunas de opcionais

- [x] Expansão do Container Principal: Aumentar max-width para ocupar quase toda a tela, eliminando margens laterais grandes
- [x] Reorganização de Opcionais: "Bolsa ou mochila de até 10kg" como primeiro item fixo (linha 1)
- [x] Layout de Opcionais: Demais itens em 1 coluna vertical simples abaixo do item fixo
- [x] Redução de Fonte dos Opcionais: Diminuir font-size e padding para cada item ocupar apenas 1 linha
- [x] Validação: Garantir que nada quebra linha ou encoste nas bordas laterais do card

- [x] Remoção de Seção Duplicada: Remover cards de tarifa isolados abaixo da seção de voos (antes de "OPÇÕES DE HOSPEDAGEM")
- [x] Tarifas em Voo Apenas: Quando deixar apenas voo, as tarifas devem aparecer normalmente (FARES SECTION restaurada)
- [x] Reformatação de Opcionais: Alterar de coluna vertical para fluxo contínuo (inline/flex-wrap) igual ao formato do voo
- [x] Posicionamento de Opcionais: Colocar em largura total (100%) logo abaixo do Preço Total/Pessoa
- [x] Validação: Garantir que ícones coloridos aparecem em ambos os formatos (coluna e inline)

- [x] Fixação de Ícones: Garantir que ícones coloridos originais (🧳, 📦, 💺, 🔄, 💰, 🎒, ⚡) permaneçam consistentes
- [x] Alinhamento Dinâmico: Quando 1 tarifa, posicionar à direita (justify-content: flex-end)
- [x] Alinhamento Dinâmico: Quando 2+ tarifas, ocupar espaço lado a lado normalmente

- [x] Posição da Tarifa Única: Card alinhado à extrema direita com flex justify-end
- [x] Mapeamento de Ícones: Expandido com variações (mala 10kg, 23kg, embarque prioritário, check-in prioritário)
- [x] Layout de Opcionais: Mantido fluxo contínuo (flex-wrap: wrap; gap: 1)

- [x] CSS Rígido: Container de tarifas com display:flex; justify-content:flex-end; gap:8px; width:100%; flex-wrap:nowrap
- [x] CSS Rígido: Cards de tarifa com width:280px; max-width:300px; flex-shrink:0; box-sizing:border-box
- [x] CSS Rígido: Fontes fixas (título 8pt, preço 11pt, opcionais 7pt, parcelamento 8pt)
- [x] Mapeamento Estático: Dicionário fixo BENEFIT_ICON_MAP com 40+ variações cobrindo todas as opções do FareForm
- [x] Função getBenefitIcon: Match exato + match sem acentos + fallback fixo (nunca genérico)
- [x] Padronização: PdfPreview FARES SECTION atualizada com mesmas classes rígidas e mapeamento

- [x] Corrigir Calculadora de Taxa: Passar flightInstallments derivado (com taxa) para HotelCard em vez de installments?.flight fixo
