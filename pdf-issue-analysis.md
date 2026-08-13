# Análise do PDF enviado pela cliente

Arquivo analisado: `/home/ubuntu/upload/orcamento-bella-viagens-2026-08-12T225620.597.pdf`.

O arquivo possui duas páginas. A primeira contém cabeçalho, dados da viagem e os dois cartões de voo, mas termina com o título **OPÇÕES DE HOSPEDAGEM** isolado no rodapé, sem o conteúdo correspondente. A segunda inicia diretamente com o card do hotel, o que evidencia uma quebra de página entre o título da seção e o primeiro hotel. O conteúdo do hotel não aparece visualmente truncado na segunda página, porém há área vazia excessiva ao final das duas páginas.

O relato da cliente também informa falha de geração quando o orçamento contém somente aéreo. A reprodução deve cobrir explicitamente esse estado, além de manter os blocos de hotel inteiros e impedir títulos de seção órfãos no final de uma página.

Quanto aos links, o PDF usa anotações externas URI; o destino em nova aba depende do visualizador de PDF, e não há parâmetro universal no PDF para obrigar essa escolha.
