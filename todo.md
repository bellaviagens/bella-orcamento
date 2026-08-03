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

- [x] Reorganizar benefícios em colunas verticais (máx 4 por coluna, gap-1 entre colunas)

- [x] Corrigir atualização de benefits ao editar tarifas na aba "Tarifas" (adicionar getBenefits() no updateFareTier)

- [x] Corrigir calculateBenefits para usar arrays bagages, checkIns, changes (permitir mais de 4 opcionais em múltiplas colunas)

- [x] Restaurar ícones nos opcionais (🧳, 📦, 💺, 🔄, 💰)
- [x] Compactar layout - juntar opcionais com valor (justify-between, gap-0.5)
- [x] Simplificar nome da tarifa - "COM AÉREO" para "AÉREO"

- [x] Remover espaço em branco entre valor e opcionais (justify-between → gap-0.5, flex-1)

- [x] Restaurar ícones nos benefícios (text-[8px] para ícone, text-[6px] para texto)

- [x] Adicionar cores aos ícones dos benefícios (azul, laranja, roxo, verde)

- [x] Remover header azul (branding Bella Viagens) do PDF
- [x] Remover footer azul (branding + "Página 1") do PDF
- [x] Mover nota amarela para final da última página (usando flex-grow spacer)
- [x] Corrigir layout: remover data-page-break e usar quebras automáticas
- [x] Restaurar min-h-screen para flexbox funcionar corretamente

- [x] Adicionar break-inside: avoid ao HotelCard para evitar cortes de hotéis entre páginas

- [x] Reescrever logica de quebra de pagina do usePdfGenerator para detectar hoteis e evitar cortes
- [x] Adicionar data-hotel-card aos wrappers dos hoteis no PdfPreview
- [x] Adicionar data-pdf-note a nota amarela no PdfPreview
- [x] Garantir que a nota amarela fique no rodape da ultima pagina

- [x] Corrigir posicionamento da nota amarela para rodape da ultima pagina (yOffset no jsPDF)
