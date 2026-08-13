# Análise da quebra da seção de hospedagem

O PDF enviado em `2026-08-12T232305.186` possui duas páginas. Na primeira página, o título **“Opções de Hospedagem”** é renderizado após os dois cartões de voo, mas o primeiro card de hotel é movido integralmente para a segunda página. Isso deixa o título isolado no fim da primeira página.

A correção deve agrupar o título da seção com o primeiro card de hotel para que ambos passem à página seguinte quando não houver espaço suficiente para o conjunto. O card de hotel da segunda página permanece íntegro, sem conteúdo cortado.
