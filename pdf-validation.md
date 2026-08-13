# Validação de PDF

Em 13/08/2026, a ação **Gerar PDF** foi acionada no preview com 1 voo, 2 hotéis e 2 tarifas. O aplicativo apresentou a confirmação: `PDF gerado! Verifique a pasta Downloads do seu computador.` O arquivo foi criado como `orcamento-bella-viagens.pdf`.

O PDF contém os endereços externos de hotel como anotações URI (por exemplo, `https://www.booking.com/`). O botão no preview também usa `target="_blank"` com `rel="noopener noreferrer"`.

> O PDF apenas registra o destino externo. A decisão de abrir o link em uma nova aba, na mesma aba ou no visualizador interno é controlada pelo aplicativo que abre o arquivo PDF; não há uma configuração no arquivo que imponha uma nova aba em todos os leitores.

Esta validação foi realizada após reiniciar o ambiente que mantinha um módulo desatualizado. Nenhuma alteração de layout, cálculos, cores ou conteúdo do orçamento foi feita nesta etapa.
