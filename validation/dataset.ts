// Dataset de eventos históricos para validação (Fase 6).
//
// Cada item tem o EVENTO disparador (sem as consequências) e uma lista de
// consequências REAIS documentadas (groundTruth). O harness roda o motor sobre
// o evento e mede quantas dessas consequências conhecidas ele reconstrói.
//
// Nota honesta: estes eventos estão na memória do modelo, então isto testa a
// capacidade de *reconstruir* a cadeia causal correta — o mesmo mecanismo usado
// para eventos novos — e não previsão inédita.

export type HistoricalEvent = {
  slug: string;
  event: string;
  groundTruth: string[];
};

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    slug: "chernobyl",
    event: "o desastre nuclear de Chernobyl: a explosão do reator 4 em 1986",
    groundTruth: [
      "Evacuação de Pripyat e criação de uma zona de exclusão",
      "Liberação de material radioativo e contaminação ambiental em parte da Europa",
      "Aumento de casos de câncer de tireoide, sobretudo em crianças",
      "Mortes por síndrome aguda de radiação entre trabalhadores e bombeiros",
      "Contaminação de alimentos, leite e terras agrícolas",
      "Custo econômico massivo para a União Soviética",
      "Queda na confiança pública e mudanças nas políticas de energia nuclear",
      "Deslocamento de centenas de milhares de pessoas",
    ],
  },
  {
    slug: "eyjafjallajokull",
    event: "a erupção do vulcão Eyjafjallajökull na Islândia em 2010",
    groundTruth: [
      "Fechamento do espaço aéreo europeu por causa da nuvem de cinzas",
      "Cancelamento de milhares de voos e milhões de passageiros afetados",
      "Prejuízos bilionários para as companhias aéreas",
      "Interrupção de cadeias de suprimento que dependem de transporte aéreo",
      "Passageiros presos em aeroportos pelo mundo",
      "Queda temporária nas emissões de CO2 da aviação",
    ],
  },
  {
    slug: "covid19",
    event: "o surgimento da pandemia de COVID-19 no início de 2020",
    groundTruth: [
      "Lockdowns e medidas de confinamento em vários países",
      "Sobrecarga e colapso de sistemas de saúde",
      "Recessão econômica global e aumento do desemprego",
      "Disparada do trabalho remoto e do ensino a distância",
      "Interrupção de cadeias de suprimento globais",
      "Desenvolvimento acelerado de vacinas",
      "Queda temporária na poluição do ar",
      "Crise severa no turismo e na aviação",
    ],
  },
];
