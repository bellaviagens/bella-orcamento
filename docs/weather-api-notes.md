# Referência técnica — previsão do tempo

Integração prevista: Open-Meteo, usando apenas endpoints públicos sem credencial.

- Geocodificação: `https://geocoding-api.open-meteo.com/v1/search?name=<destino>&count=1&language=pt`
  - Retorna nome, latitude, longitude e fuso horário do destino.
  - Documentação: https://open-meteo.com/en/docs/geocoding-api
- Previsão: `https://api.open-meteo.com/v1/forecast`
  - Parâmetros usados: `latitude`, `longitude`, `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`, `timezone=auto` e `forecast_days`.
  - A API suporta previsão diária por até 16 dias, e o uso de variáveis diárias requer `timezone`.
  - Documentação: https://open-meteo.com/en/docs

O widget deve apresentar somente datas dentro da janela de previsão disponível. Para viagens fora dessa janela, a interface deve informar que a previsão ficará disponível mais perto da data, sem inventar dados.
