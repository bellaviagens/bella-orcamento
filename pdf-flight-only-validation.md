# Validação de PDF — somente aéreo

- Cenário reproduzido em 13/08/2026 no preview atual.
- A opção **Incluir Hotel** foi desativada, mantendo somente o aéreo.
- O preview mostrou os dois cards de tarifa e as condições de pagamento sem falha de renderização.
- Próxima verificação: acionar **Gerar PDF** nesse cenário e confirmar a ausência de cortes no arquivo baixado.

## Resultado da reprodução

No mesmo cenário, o acionamento de **Gerar PDF** exibiu inicialmente a mensagem “Erro ao gerar PDF. Tente novamente.” O console do navegador não registrou detalhes adicionais. A causa foi o segmento residual de 0,114 px ao final do canvas, que gerava um PNG inválido.

Após a correção da paginação, o botão **Gerar PDF** foi acionado novamente com somente aéreo e exibiu a confirmação de que o arquivo foi salvo na pasta Downloads, sem erro no navegador.
