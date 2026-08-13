# Pesquisa de abertura de links externos em PDF

- A anotação atual criada pelo jsPDF é uma ação URI (`pdf.link`), que registra corretamente o endereço externo no arquivo.
- O padrão de PDF não oferece um equivalente universal a `target="_blank"` para ações URI; a decisão de abrir na mesma guia ou em uma nova aba pertence ao visualizador de PDF.
- Referências consultadas: [jsPDF: abrir PDF em nova janela](https://stackoverflow.com/questions/17739816/how-to-open-generated-pdf-using-jspdf) e [debate sobre destinos de links em PDF](https://community.adobe.com/questions-9/ensuring-pdf-hyperlinks-open-in-new-tab-or-window-in-all-browsers-1244442).
- O preview HTML mantém `target="_blank"` e os links gravados no PDF usam URL normalizada. Não é seguro substituir a anotação URI por JavaScript embutido, pois visualizadores costumam bloqueá-lo.
