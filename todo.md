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

- [x] Configurar "Parcelar tudo junto (aéreo + hotel)": Considerar valor TOTAL (aéreo + hotel) com parcelamento do aéreo
- [x] Validar que o parcelamento conjunto prioriza a quantidade da calculadora de taxa do aéreo quando ela estiver preenchida

- [x] Corrigir o somatório do parcelamento conjunto para incluir corretamente o total de aéreo e hotel
- [x] Validar no preview que o valor total parcelado corresponde à soma de aéreo e hotel
- [x] Garantir que o formulário não some alternativas de tarifa e hotel como se fossem uma única compra
- [x] Garantir a exibição do pagamento conjunto no card quando a opção estiver marcada
- [x] Usar a mesma regra do cartão no formulário quando houver múltiplas tarifas e hotéis
- [x] Cobrir o parcelamento conjunto com múltiplas alternativas sem somá-las como uma única compra
- [x] Adicionar asserção renderizada para confirmar o valor exibido de Aéreo + Hotel no preview
- [x] Criar teste integrado do PdfPreview para o parcelamento conjunto
- [x] Executar e registrar o teste integrado do preview com parcelamento conjunto
- [x] Incluir testes de componentes PDF na configuração de testes
- [x] Atualizar asserções obsoletas dos dados de exemplo para preservar a suíte de testes
- [x] Manter a tipagem segura do valor de entrada no parcelamento conjunto

- [x] Exibir cada combinação de tarifa e hotel separadamente no formulário de parcelamento conjunto

- [x] Reorganizar opcionais dos cards de tarifa em uma coluna lateral compacta
- [x] Reduzir fonte, espaçamento e destaque visual dos opcionais sem perder legibilidade
- [x] Preservar integralmente cálculos, valores, ícones, cores e formas de pagamento

- [x] Confirmar no arquivo final a coluna lateral compacta de opcionais dentro de cada card
- [x] Validar visualmente a legibilidade dos opcionais compactados no preview
- [x] Confirmar que ícones, valores, pagamentos e cálculos permanecem intactos após o refinamento

- [x] Ampliar a área útil do preview/PDF reduzindo as margens laterais
- [x] Aproximar a coluna de informações de preço da coluna lateral de opcionais
- [x] Preservar exatamente o texto digitado no título da tarifa, sem complemento automático
- [x] Validar que cálculos, cores, ícones e formas de pagamento permanecem intactos

- [x] Restaurar o prefixo “Com Aéreo” antes do nome digitado em cada tarifa
- [x] Compactar os cards para largura máxima de 270px, fonte e espaçamentos solicitados
- [x] Manter os cards lado a lado, alinhados à direita, sem alterar cálculos ou estrutura
- [x] Validar visualmente e por testes a compactação dos cards

- [x] Destacar título, preço principal e valor por pessoa conforme as novas medidas
- [x] Aumentar a legibilidade dos valores e rótulos de pagamento sem alterar cálculos
- [x] Compactar exclusivamente opcionais, ícones e espaçamentos verticais dos cards
- [x] Validar a hierarquia visual preservando o alinhamento à direita e lado a lado

- [x] Reduzir o tamanho do título e valor principal dos cards de tarifa
- [x] Exibir no preview o valor de entrada informado em Parcelamento
- [x] Exibir no preview a taxa de maquininha quando preenchida
- [x] Validar visualmente e por testes as informações de pagamento dos cards

- [x] Descontar a entrada do saldo antes de dividir as parcelas do aéreo
- [x] Descontar a entrada do saldo antes de dividir as parcelas do hotel
- [x] Descontar a entrada do saldo no parcelamento conjunto usando as parcelas do aéreo
- [x] Validar por testes a exibição de entrada mais saldo parcelado

- [x] Manter integralmente a quantidade de parcelas informada quando houver entrada no aéreo
- [x] Manter integralmente a quantidade de parcelas informada quando houver entrada no hotel e no combinado
- [x] Validar por testes a exibição de entrada mais o número exato de parcelas escolhido

- [x] Fazer o parcelamento conjunto usar a quantidade de parcelas configurada no aéreo
- [x] Exibir e descontar a entrada do aéreo no parcelamento conjunto quando preenchida
- [x] Aplicar a taxa de maquininha do aéreo ao saldo combinado quando preenchida
- [x] Validar por testes o cenário Hotel + Aéreo com entrada e 10x

- [x] Encaminhar a observação da aba Parcelamento ao preview e PDF
- [x] Renderizar a observação preenchida sem alterar as condições de pagamento
- [x] Validar por testes e tipagem a exibição da observação

- [x] Permitir que um print de voo preencha automaticamente ida e volta quando os dois trechos estiverem visíveis
- [x] Permitir reutilizar o mesmo print para preencher manualmente apenas ida ou apenas volta
- [x] Cobrir a leitura de dois trechos e o destino escolhido por testes

- [x] Manter o botão de site e fotos do hotel clicável no PDF baixado
- [x] Impedir que cards de hotel ou informações internas sejam cortados entre páginas do PDF
- [x] Validar a geração do PDF, links e quebras de página

- [x] Restaurar o link externo clicável de site e fotos do hotel no PDF
- [x] Validar a anotação externa de URL usada no PDF
- [x] Comparar versões anteriores para restaurar exatamente a abertura do link em nova aba
- [x] Preservar integralmente layout, cálculos, PDF e demais funções durante o ajuste isolado do link
- [x] Confirmar que a API de link instalada não expõe uma opção compatível para obrigar nova aba em todos os visualizadores
- [x] Registrar em documentação do projeto a limitação do visualizador de PDF
- [x] Receber confirmação manual: o visualizador de PDF usado pela cliente mantém o link na mesma aba

- [x] Manter o preview do orçamento/PDF visível ao lado direito dos campos em tempo real
- [x] Validar a disposição lateral sem alterar conteúdo, cálculos ou estilo do documento

- [x] Remover a forma de pagamento duplicada exibida fora das tarifas quando houver somente aéreo
- [x] Exibir Dinheiro, Cartão e PIX dentro de cada card de tarifa conforme selecionado no Parcelamento
- [x] Posicionar os opcionais do cenário somente aéreo na lateral do card, como no cenário com hotel
- [x] Validar os cenários somente aéreo e aéreo com hotel sem alterar cálculos ou demais layouts

- [x] Exibir a forma de pagamento aérea à vista ao lado da parcelada dentro de cada card quando incluída no PDF
- [x] Usar o valor e as formas de pagamento configurados para a opção à vista
- [x] Validar a convivência entre pagamento à vista e parcelado sem alterar o restante

- [x] Centralizar a foto dos cartões da Proposta de Passeios sem alterar o restante do layout
- [x] Posicionar os links de informações e fotos logo abaixo da respectiva imagem
- [x] Preservar e exibir separadamente os links de endereço e site/fotos nas opções gastronômicas
- [x] Aplicar o valor à vista configurado no card com fallback ao valor da tarifa quando estiver vazio
- [x] Cobrir por teste o valor à vista diferente do parcelado com taxa de maquininha

- [x] Guardar os métodos Dinheiro e PIX específicos da condição aérea à vista
- [x] Manter o método Cartão específico da condição aérea parcelada
- [x] Validar no preview as etiquetas separadas para as duas condições de pagamento

- [x] Corrigir a restauração de voos e hotéis ao abrir um rascunho de orçamento
- [x] Diferenciar visualmente o salvamento do orçamento completo e o salvamento da proposta de passeios
- [x] Validar com teste que a reidratação de um rascunho preserva voos e hotéis
- [x] Normalizar snapshots de rascunhos antigos sem apagar os dados salvos

- [x] Replicar a opção aérea à vista dentro dos cards de tarifa quando houver hotel
- [x] Manter valores e métodos à vista separados da condição parcelada nos cards com hotel
- [x] Validar o cenário hotel com aéreo sem alterar os demais blocos

- [x] Exibir Aéreo Parcelado e Aéreo À Vista lado a lado dentro do card com hotel
- [x] Manter as etiquetas Cartão, Dinheiro e PIX nos pagamentos exibidos nos cards com hotel
- [x] Alterar o opcional padrão Bagagem de 10 kg para Bagagem de 12 kg
- [x] Permitir editar e incluir opcionais personalizados nas tarifas
- [x] Validar visualmente e por testes os ajustes sem alterar cálculos, cores ou demais estruturas
- [x] Sincronizar os benefícios ao editar opcionais em tarifas existentes no modo expandido
- [x] Cobrir por testes a atualização dos benefícios e o padrão Bagagem de 12 kg
- [x] Cobrir no contexto a atualização de benefícios ao editar uma tarifa existente
- [x] Cobrir no formulário o padrão Bagagem de 12 kg e a inclusão de opcionais personalizados

- [x] Ocultar a lista de campos de edição dos opcionais até o clique em Editar opcionais
- [x] Manter a inclusão de novos opcionais visível e inalterada
- [x] Validar a compactação do formulário sem alterar os demais campos

- [x] Fazer Editar opcionais abrir os campos de texto dos opcionais selecionados
- [x] Preservar a área de inclusão de novos opcionais sem alteração
- [x] Revisar a abertura externa do link Acessar Site e Fotos no PDF
- [x] Validar por testes e preview as correções solicitadas
- [x] Validar no visualizador de PDF da cliente: Acessar Site e Fotos permanece na mesma aba por limitação do visualizador
- [x] Documentar a limitação do visualizador se ele continuar abrindo o link na mesma guia
- [x] Salvar a versão atual para conferência antes da publicação pelo painel

- [x] Reproduzir e identificar o erro de geração do PDF sem alterar o restante
- [x] Corrigir exclusivamente a causa do erro de geração do PDF
- [x] Validar novamente a geração do PDF e os testes relacionados
- [x] Salvar e entregar a versão atual sem novas modificações

- [x] Reproduzir e corrigir o erro de geração do PDF no cenário somente aéreo
- [x] Impedir cortes de conteúdo nos cenários somente aéreo e aéreo com hotel
- [x] Revisar o comportamento do link do PDF para abertura externa no visualizador
- [x] Validar por testes e gerar PDFs nos dois cenários sem alterar o restante

- [x] Manter o título Opções de Hospedagem junto do primeiro hotel quando houver quebra de página
- [x] Validar o PDF sem título de hospedagem isolado no fim da página

- [x] Adicionar rolagem vertical ampla e discreta à aba Parcelamento, aproveitando a maior altura útil possível
- [x] Exibir valores de tarifa em formato monetário brasileiro nos campos de Tarifas sem alterar valores armazenados
- [x] Aumentar e destacar botões de ação nas abas de preenchimento sem alterar preview, PDF ou cálculos

- [x] Ampliar ainda mais os botões de ação dos formulários para boa leitura sem alterar o zoom do navegador
- [x] Aplicar área alta com rolagem interna nas abas Tarifas e Voos, sem alterar conteúdo, cálculos, preview ou PDF

- [x] Formatar o campo de preço do hotel em reais, preservando o valor numérico armazenado
- [x] Exibir o valor em reais nos cartões recolhidos da aba Hotéis
- [x] Reduzir somente o destaque visual da seção de bagagens no PDF
- [x] Garantir a renderização dos ícones das bagagens no PDF, como já ocorre no preview

- [x] Ajustar a identificação da segunda mala despachada, exibindo “2ª” e “23 kg” conforme solicitado
- [x] Reduzir mais o tamanho e diferenciar discretamente o fundo dos cards de bagagem no PDF
- [x] Registrar a confirmação da cliente sobre a abertura de “Acessar Site e Fotos” no mesmo visualizador de PDF

- [x] Ajustar o fundo cinza, o botão branco ativo e a fonte ampliada nas abas de navegação

- [x] Permitir abrir e editar manualmente todos os campos de um hotel pelo ícone de lápis, no padrão das tarifas

- [x] Permitir duplicar uma opção de hotel com todos os seus dados
- [x] Permitir reordenar hotéis cadastrados por arrastar e soltar
- [x] Permitir editar o preço diretamente no cartão recolhido do hotel, sem abrir o editor completo

- [x] Reposicionar e ampliar o campo de valor do hotel à esquerda, no padrão da aba Tarifas
- [x] Permitir personalizar os textos de tipo e peso de cada bagagem conforme as regras de cada companhia aérea

- [x] Diferenciar visualmente os cartões preenchidos dos formulários com uma cor suave
- [x] Criar a aba Passeios com cadastro manual, valores, links de página e fotos
- [x] Permitir importar um print de passeio para preenchimento assistido
- [x] Criar a aba Roteiro para organizar atividades por dia, incluindo dias livres
- [x] Exibir o roteiro em visualização própria, separada do preview e do PDF do orçamento

- [x] Gerar e baixar um PDF exclusivo da visualização de roteiro
- [x] Permitir duplicar passeios cadastrados com todos os dados
- [x] Permitir reordenar passeios e dias do roteiro por arrastar e soltar
- [x] Posicionar a aba Roteiro como a última opção da navegação

- [x] Ajustar a distribuição responsiva das abas para manter todos os nomes e ícones legíveis após incluir Passeios e Roteiro

- [x] Simplificar o cadastro manual de passeios para campos de página, fotos e valor
- [x] Adicionar o botão de importação de passeio por screenshot no padrão de hotéis
- [x] Manter todas as abas em uma única linha com Passeios como último item

- [x] Unificar Passeios e Roteiro em uma única aba de Roteiro, preservando cadastro, importação, links, valores, dias e PDF próprio

- [x] Permitir colar uma URL de cotação no Roteiro e importar passeios identificados por data
- [x] Organizar automaticamente os passeios importados nos dias correspondentes do roteiro

- [x] Enriquecer a importação de cotação com descrições detalhadas das páginas individuais dos passeios
- [x] Exibir foto de cada passeio no roteiro a partir de um link de fotos informado
- [x] Validar por testes e visualmente o roteiro com descrições e fotos, sem alterar o orçamento

- [x] Organizar as descrições importadas de passeios em blocos legíveis de destaque, roteiro e informações adicionais
- [x] Adicionar observações próprias, valor por pessoa, quantidade de viajantes e total em cada passeio
- [x] Exibir o total de passeios e configurar a forma de pagamento da proposta independente
- [x] Criar uma abertura personalizada com mensagem inicial e título da proposta
- [x] Permitir criar os eventos de chegada, transfer, hospedagem e retorno com texto, links e fotos
- [x] Reaproveitar informações já cadastradas de voos e hotéis no roteiro, sem alterar o orçamento principal
- [x] Validar a proposta completa, a visualização e o PDF exclusivo do roteiro

- [x] Estruturar a mesma aba Roteiro em dois modos: Proposta de Passeios e Roteiro Final
- [x] Manter a Proposta de Passeios restrita a passeios, valores, total, pagamento e mensagem inicial para aprovação
- [x] Liberar no Roteiro Final os dados de chegada, transfer, hospedagem, voo e retorno somente após a aprovação
- [x] Gerar documentos independentes para a proposta de passeios e para o roteiro final

- [x] Compactar a Proposta de Passeios com melhor aproveitamento da largura e duas colunas para opcionais
- [x] Ampliar a área de observações e garantir que itens não sejam cortados entre páginas no PDF da proposta
- [x] Adicionar calculadora de parcelamento da proposta de passeios
- [x] Salvar propostas de passeios por cliente e permitir recuperar uma proposta anteriormente criada
- [x] Validar visualmente, por PDF e por testes as melhorias da proposta sem alterar os demais módulos

- [x] Exibir os voos antes da hospedagem no Roteiro Final e em seu PDF
- [x] Criar busca de propostas salvas pelo nome do cliente
- [x] Permitir duplicar uma proposta salva para criar uma nova versão semelhante
- [x] Adicionar status Pendente, Enviada e Aprovada às propostas salvas
- [x] Validar por testes, visualmente e no PDF a ordem do roteiro e a gestão das propostas

- [x] Criar o botão Nova Proposta para limpar somente os dados da proposta de passeios em edição
- [x] Permitir recolher e expandir os cartões de dias/passeios, mantendo o valor editável no modo recolhido
- [x] Adicionar preço adulto e preço de criança por passeio, sem o rótulo incorreto de valor por pessoa
- [x] Aproximar o conteúdo da Proposta de Passeios da borda útil e replicar o estilo visual dos passeios do Roteiro Final
- [x] Preservar margem superior em toda nova página dos PDFs independentes do Roteiro
- [x] Incluir endereço com link do Google Maps e datas de check-in/check-out nos eventos de hospedagem do Roteiro Final
- [x] Incluir companhia, número do voo, terminais e horários de partida/chegada nos eventos de voo do Roteiro Final
- [x] Validar tipos, cálculos, testes, visualização e exportação em PDF dos novos recursos do Roteiro

- [x] Permitir anexar comprovantes e cartões de embarque nos eventos de voo e hospedagem do Roteiro Final
- [x] Exibir e abrir os anexos de voo e hospedagem na visualização e no PDF do Roteiro Final
- [x] Criar linha do tempo diária do Roteiro Final organizada por horário
- [x] Validar tipos, anexos, linha do tempo, PDF e testes dos novos recursos

- [x] Criar uma capa resumida do Roteiro Final com informações essenciais e contatos de emergência
- [x] Permitir cadastrar passageiros e organizar anexos de voo e hospedagem por passageiro
- [x] Adicionar alertas visuais na linha do tempo para compromissos próximos
- [x] Validar tipos, alertas, capa, anexos por passageiro, PDF e testes dos novos recursos

- [x] Criar link compartilhável e QR Code para abrir o Roteiro Final pelo celular
- [x] Criar checklist de bagagem personalizado e marcável para cada passageiro
- [x] Integrar previsão do tempo na capa usando destino e período da viagem
- [x] Validar compartilhamento, checklist, previsão, PDF, tipos e testes dos novos recursos

- [x] Deixar todos os cartões da Proposta de Passeios recolhidos por padrão
- [x] Preservar as quebras de linha digitadas nas observações de parcelamento no preview e PDF
- [x] Permitir definir data de expiração para o link compartilhado do Roteiro Final
- [x] Permitir revogar manualmente o acesso de um link compartilhado
- [x] Validar tipos, testes, linhas de observações e acesso expirado ou revogado

- [x] Permitir configurar parcelas específicas para a opção Hotel + Aéreo juntos
- [x] Remover a validade do orçamento da tarja final do PDF
- [x] Manter a tarja institucional no rodapé da última página do PDF
- [x] Criar espaço superior suficiente para evitar cortes de título e hotel no início de páginas novas
- [x] Validar cálculos combinados, paginação, PDF, tipos e testes dos ajustes

- [x] Permitir dividir o pagamento combinado Hotel + Aéreo em múltiplas etapas sequenciais, com forma de pagamento e parcelas próprias por etapa
- [x] Exibir no preview/PDF cada etapa de pagamento combinado e o saldo remanescente correspondente
- [x] Permitir salvar o orçamento atual como rascunho e retomá-lo posteriormente para editar hotéis, voos e demais informações
- [x] Validar cálculos sequenciais, recuperação de rascunhos, tipos, testes e regressões

- [x] Fazer cada Pagamento adicional funcionar como uma alternativa independente calculada sobre o total completo de Hotel + Aéreo
- [x] Remover a exibição de saldo das alternativas adicionais no preview e PDF, mantendo apenas o total correspondente de cada alternativa
- [x] Permitir taxa percentual opcional em alternativas de pagamento por Cartão, aplicando-a somente quando preenchida
- [x] Criar interface de gestão de rascunhos com busca por destino ou cliente, renomeação e exclusão
- [x] Validar alternativas de pagamento, taxa opcional, preview/PDF, gestão de rascunhos, tipos e regressões

- [x] Permitir que cada Pagamento seja uma condição independente contendo várias formas internas de pagamento
- [x] Somar as formas internas e exibir o Total do Pagamento em cada condição, com taxa opcional somente em cartão
- [x] Exibir no preview e PDF cada condição com suas formas internas e seu total, sem alterar as demais regras
- [x] Validar somatórios internos, taxas, preview/PDF, tipos e regressões do orçamento

- [x] Garantir margem superior adequada no início da segunda e demais páginas do PDF de orçamento
- [x] Adicionar controles para recolher/expandir e duplicar cada condição de Pagamento
- [x] Diferenciar visualmente cada Forma de pagamento no formulário, preview e PDF para identificar condições distintas
- [x] Validar PDF multipágina, controles de pagamento, tipos e regressões

- [x] Remover os rótulos Forma 1, Forma 2 e semelhantes do cadastro interno de cada Pagamento
- [x] Permitir renomear cada condição de Pagamento para identificação no formulário, preview e PDF
- [x] Permitir escolher manualmente a cor de cada forma de pagamento e refletir a escolha no preview e PDF
- [x] Validar rótulos simplificados, renomeação, cores personalizadas, PDF e regressões

- [x] Tornar as formas internas de pagamento visualmente neutras, sem fundos coloridos individuais.
- [x] Diferenciar Pagamento 1, Pagamento 2 e demais condições com uma única cor sóbria por condição no preview e PDF.
- [x] Validar a nova hierarquia visual sem alterar cálculos, estrutura ou demais cartões.

- [x] Permitir registrar vários compromissos editáveis no mesmo dia da Proposta de Passeios.
- [x] Incluir horário, título, descrição e links próprios para voo, passeio, jantar e demais atividades no dia.
- [x] Permitir ordenar os compromissos de um mesmo dia e exibi-los na proposta/PDF em sequência.
- [x] Validar a compatibilidade das propostas e rascunhos já salvos, sem alterar o Roteiro Final.

- [x] Tornar mais evidente a ordenação manual dos compromissos no mesmo dia da Proposta de Passeios.
- [x] Garantir que a sequência definida manualmente seja respeitada na prévia e no PDF, independentemente da ordem de importação.
- [x] Validar a reordenação de passeios sem alterar os demais módulos do Roteiro.

- [x] Permitir mover um passeio ou compromisso completo de um dia para outro na Proposta de Passeios.
- [x] Preservar horário, descrição, links, foto e valores ao mover o compromisso para o dia de destino.
- [x] Manter a ordem escolhida no dia de destino e refletir a movimentação na prévia e PDF.
- [x] Cobrir a movimentação entre dias com testes sem alterar o Roteiro Final.

- [x] Agrupar os passeios importados pela mesma data, evitando criar dias duplicados para atividades do mesmo dia.
- [x] Exibir a data e o dia da semana correspondente em cada dia da Proposta de Passeios e seus PDFs.
- [x] Adicionar link de compra de ingresso e observação importante destacada em amarelo a cada passeio.
- [x] Criar o cadastro de Dicas e Links Úteis no Roteiro Final para transfer, aluguel de roupas, Instagram, WhatsApp e demais orientações.
- [x] Exibir Dicas e Links Úteis como a última página da visualização e PDF do Roteiro Final.
- [x] Validar a compatibilidade de propostas existentes, importação por data, previews, PDFs e Roteiro Final.

- [x] Impedir que um dia ou seus compromissos sejam cortados entre páginas no PDF da Proposta de Passeios.
- [x] Manter título, data e conteúdo do dia agrupados quando houver espaço suficiente na página seguinte.
- [x] Validar a exportação em PDF com uma proposta de vários dias sem alterar conteúdos, cálculos ou demais módulos.

- [x] Criar um separador visual elegante para organizar dias com muitos passeios na Proposta de Passeios.
- [x] Aplicar o mesmo separador no preview e no PDF sem comprometer as regras de paginação.
- [x] Validar a legibilidade dos dias extensos e preservar as cores e estrutura existentes.

- [x] Permitir enviar arquivos PDF para leitura assistida na aba Voos.
- [x] Permitir enviar arquivos PDF para leitura assistida na aba Hotéis.
- [x] Extrair informações de PDFs no mesmo fluxo já usado para imagens, preservando a leitura atual.
- [x] Atualizar os controles e mensagens de upload para indicar suporte a imagem ou PDF.
- [x] Cobrir a leitura de PDFs com testes e validar os fluxos de Voos e Hotéis.

- [x] Exibir detalhes de voo com nomenclatura própria, sem usar o rótulo de passeio.
- [x] Inserir a tarja institucional da Bella Viagens na abertura do PDF da Proposta de Passeios.
- [x] Reduzir o espaço vazio da primeira página da Proposta de Passeios sem alterar o conteúdo do roteiro.
- [x] Ampliar a área útil e reduzir a centralização excessiva dos conteúdos no PDF da Proposta de Passeios.
- [x] Validar a paginação e o PDF da proposta com os novos ajustes visuais.

- [x] Preservar cada linha das observações importantes no preview e no PDF da Proposta de Passeios.
- [x] Criar campos de nome e local para cadastrar opções gastronômicas.
- [x] Adicionar consulta assistida de informações gastronômicas para validação antes da inclusão.
- [x] Permitir adicionar uma opção gastronômica a um dia específico do roteiro ou somente às Dicas e Links Úteis.
- [x] Validar o fluxo de gastronomia e a apresentação das observações no PDF.

- [x] Padronizar o cabeçalho do Roteiro Final com o azul institucional da Bella Viagens.
- [x] Refinar a capa do Roteiro Final para uma abertura mais informativa e equilibrada.
- [x] Aproveitar melhor a largura e a altura das páginas do Roteiro Final, reduzindo espaços ociosos.
- [x] Validar a nova capa e a paginação do PDF do Roteiro Final.

- [x] Permitir incluir uma imagem de capa do destino no Roteiro Final e no PDF.
- [x] Adicionar um resumo diário das atividades na capa do Roteiro Final.
- [x] Criar opção de capa compacta ou detalhada no formulário do Roteiro Final.
- [x] Validar os dois modos de capa no preview e no PDF sem alterar a paginação existente.

- [x] Organizar o resumo diário por compromisso, com horário e tipo de atividade em linhas claras.
- [x] Exibir o localizador nos eventos de voo de ida e retorno do Roteiro Final.
- [x] Igualar as margens úteis das páginas internas às da capa e remover o espaço/linha inicial ociosa.
- [x] Impedir que o início de uma linha do tempo diária seja separado de seus compromissos no PDF.
- [x] Destacar no evento de voo o vínculo de cartão de embarque por passageiro e manter o salvamento completo em rascunho.
- [x] Validar a paginação e a apresentação final do roteiro após os refinamentos.

- [x] Tornar a exclusão de restaurantes validados claramente acessível no painel de Opções gastronômicas.
- [x] Corrigir a exibição de duração de passeio para não apresentar dias calculados de forma incorreta.
- [x] Exibir horários de chegada nos eventos de voo de ida e retorno da proposta e do roteiro.
- [x] Adicionar um resumo informativo à capa da Proposta de Passeios e ocupar melhor a área disponível.
- [x] Criar mensagem padrão de boas-vindas editável para novos Roteiros Finais.
- [x] Permitir compartilhar o Roteiro Final por WhatsApp e e-mail com os passageiros.
- [x] Cobrir e validar os novos fluxos de gastronomia, proposta, voos, boas-vindas, compartilhamento e PDF.

- [x] Agrupar todos os compromissos de cada data em um único cartão do resumo da Proposta de Passeios.
- [x] Incluir as opções gastronômicas cadastradas no dia selecionado dentro do respectivo resumo diário.
- [x] Criar modelos salvos de mensagem de boas-vindas e permitir alternar rapidamente entre eles.
- [x] Permitir personalizar o texto enviado junto ao link por WhatsApp e e-mail.
- [x] Adicionar ícones específicos de voo, hospedagem, passeio e gastronomia no resumo cronológico.
- [x] Validar agrupamentos, modelos, mensagens personalizadas, ícones, preview e PDF dos novos ajustes.

- [x] Permitir arrastar e soltar para reordenar atividades dentro de um mesmo dia.
- [x] Criar pré-visualização do texto personalizado de WhatsApp e e-mail antes do compartilhamento.
- [x] Permitir upload de imagem ou ícone personalizado para cada atividade do Roteiro Final.
- [x] Exibir a imagem ou ícone personalizado nos resumos cronológicos, com fallback visual por tipo.
- [x] Validar reordenação, prévia de mensagens, upload de mídia e PDF/preview do roteiro.

- [x] Exibir mais dias no resumo da capa da Proposta de Passeios quando houver espaço disponível.
- [x] Permitir quebra natural de linha nas descrições do resumo, sem truncar ou cortar palavras.
- [x] Validar visualmente e publicar o ajuste pontual da capa da Proposta.

- [x] Uniformizar a margem útil e remover o espaço/linha ociosa no início das páginas internas da Proposta de Passeios.
- [x] Permitir escolher o tamanho da fonte usado no resumo da capa da Proposta.
- [x] Permitir selecionar manualmente os dias que aparecem no resumo da capa quando houver mais de seis dias.
- [x] Validar paginação, controles de resumo, PDF e preview sem alterar os demais módulos.

- [x] Aumentar o contraste visual entre os dias no resumo da capa da Proposta.
- [x] Remover o recuo, borda e linha extras antes do conteúdo das páginas internas da Proposta.
- [x] Validar o PDF enviado, paginação, destaque de dias e publicação da correção.

- [x] Uniformizar todos os cartões do resumo da capa no estilo azul institucional do Dia 1.
- [x] Corrigir a segmentação da Proposta para evitar página interna vazia/cortada e aproveitar a largura útil.
- [x] Validar com PDF multipágina, tipagem, testes, build e publicação sem alterar os demais módulos.

- [x] Aplicar uma margem superior uniforme nas páginas internas da Proposta, como na página do Dia 2.
- [x] Reservar margem de segurança no rodapé para que nenhum bloco seja cortado ao exportar a Proposta.
- [x] Validar paginação multipágina, tipagem, testes, build e publicação sem alterar outros módulos.

- [x] Adicionar numeração discreta no rodapé de todas as páginas da Proposta de Passeios.
- [x] Padronizar o aproveitamento das páginas, mantendo cada passeio inteiro e agrupando dois passeios somente quando ambos couberem.
- [x] Validar o PDF enviado, a paginação multipágina, testes, tipagem, build e publicação sem alterar os demais módulos.

- [x] Compactar os cartões de passeio no PDF com foto menor na lateral e conteúdo descritivo ao lado.
- [x] Repetir a identificação do dia quando seus compromissos continuarem em uma nova página.
- [x] Validar o PDF enviado, a paginação multipágina, testes, tipagem, build e publicação sem alterar os demais módulos.

- [x] Manter o voo e todos os passeios do Dia 1 na mesma página quando o bloco completo couber na área útil.
- [x] Preservar a regra de continuação apenas para dias que realmente não couberem completos.
- [x] Validar o PDF enviado, a paginação multipágina, testes, tipagem, build e publicação sem alterar os demais módulos.

- [x] Centralizar a foto do passeio e mover os links de Mais informações e Fotos para logo abaixo dela.
- [x] Manter o link de endereço do restaurante e adicionar link separado para fotos/site do local nas opções gastronômicas.
- [x] Validar testes, tipagem, build e visualização sem alterar os demais módulos.

- [x] Obter uma foto representativa retornada pela busca de cada restaurante validado.
- [x] Exibir a foto do restaurante no cartão gastronômico da Proposta e no PDF correspondente.
- [x] Validar busca, tipagem, testes, build e visualização sem alterar os demais módulos.

- [x] Limpar os campos e resultados temporários da pesquisa gastronômica ao clicar em Nova Proposta.
- [x] Validar o reset da nova proposta sem alterar os demais módulos.

- [x] Reforçar a confirmação antes de limpar a proposta atual.
- [x] Criar uma lista persistente de restaurantes favoritos para reutilização entre propostas.
- [x] Integrar favoritos à área de gastronomia sem alterar o roteiro e os links existentes.
- [x] Validar persistência, tipagem, testes, build e visualização.

- [x] Permitir cadastrar e editar tags personalizadas nos restaurantes favoritos.
- [x] Adicionar pesquisa textual e filtros por tag na lista de favoritos.
- [x] Permitir compartilhar a lista filtrada de favoritos por WhatsApp ou link copiável.
- [x] Validar persistência, tipagem, testes, build e visualização.

- [x] Exibir o link Ver endereço dos restaurantes na Proposta de Passeios e no Roteiro Final.
- [x] Permitir agrupar restaurantes favoritos em coleções por destino ou viagem.
- [x] Permitir ordenar favoritos por avaliação ou faixa de preço.
- [x] Permitir registrar e editar notas pessoais em cada restaurante favorito.
- [x] Validar persistência, tipagem, testes, build e visualização.

- [x] Restaurar voos e hotéis nas respectivas abas ao abrir um rascunho salvo.
- [x] Tornar claros e distintos os controles de Salvar rascunho de orçamento e Salvar proposta de passeios.
- [x] Validar carregamento, edição, testes, build, visualização e publicação sem alterar os demais módulos.

- [x] Clarear e reorganizar visualmente o resumo diário da proposta sem alterar a paleta institucional dos demais módulos
- [x] Unificar a edição de dias e passeios da proposta em um único cadastro completo, removendo a duplicidade de informações
- [x] Validar a proposta consolidada por testes, build e prévia visual sem alterar os demais módulos

- [x] Ampliar a área de rolagem da aba Hotéis para facilitar a edição de hotéis extensos
- [x] Adicionar controles de recolher e expandir nos blocos de formas de pagamento
- [x] Validar que os cálculos, valores e PDF permanecem inalterados após a compactação visual

- [x] Adicionar controle individual de recolher e abrir em cada compromisso da agenda diária
- [x] Permitir levar os passeios da proposta aprovada para o Roteiro Final sem redigitar informações
- [x] Validar a conversão dos passeios, testes, build e prévia visual sem alterar os demais módulos
