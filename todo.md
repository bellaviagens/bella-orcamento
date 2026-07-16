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

- [ ] Validar manualmente no navegador o fluxo completo de download do PDF
- [x] Implementar proxy server-side para imagens externas (endpoint criado, integrado com HotelCard)

- [x] Reduzir tamanho e destaque da seção de bagagens
- [x] Adicionar campo benefits ao FareTier e renderizar no HotelCard
- [x] Sincronizar benefícios ao editar tarifas existentes (recalcular quando checkboxes mudam)
- [ ] Validar manualmente o download do PDF no navegador após correção de erros

- [x] Reduzir tamanho da seção de bagagens no PDF preview (inputs menores, cores mais sutis)
- [ ] Debugar erro do PDF - "ERRO ao gerar PDF tente novamente"
