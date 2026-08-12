# Compatibilidade de links externos no PDF

O orçamento cria uma anotação de link externa com a URL do hotel usando a configuração restaurada da versão anterior: `writeLink(x, y, width, height, { url, pageNumber: undefined })`.

Essa anotação mantém o botão **Acessar site e fotos** clicável no PDF baixado. A escolha entre abrir a URL na mesma guia ou em outra guia é feita pelo visualizador de PDF utilizado pelo cliente. A API de links instalada no projeto aceita a URL externa e o destino de página; ela não disponibiliza uma opção independente e compatível entre visualizadores para obrigar a abertura em nova aba.

Por esse motivo, o comportamento precisa ser conferido no navegador ou aplicativo PDF usado para abrir o arquivo. O preview do orçamento continua usando o link HTML com abertura externa.
