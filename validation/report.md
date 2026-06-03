# Relatório de validação histórica

Limiar de similaridade: **0.5** · modelo de embeddings: `text-embedding-3-small`


## o desastre nuclear de Chernobyl: a explosão do reator 4 em 1986

Recall: **8/8 = 100%**  (28 nós gerados)

| Consequência documentada | Reconstruída? | Score | Nó correspondente |
|---|---|---|---|
| Evacuação de Pripyat e criação de uma zona de exclusão | ✅ | 0.73 | Criação da Zona de Exclusão de Chernobyl. Área de cerca de 30 km ao re… |
| Liberação de material radioativo e contaminação ambiental em parte da Europa | ✅ | 0.64 | Liberação massiva de material radioativo na atmosfera. Material radioa… |
| Aumento de casos de câncer de tireoide, sobretudo em crianças | ✅ | 0.83 | Aumento da incidência de câncer (especialmente tireoide). Incidência a… |
| Mortes por síndrome aguda de radiação entre trabalhadores e bombeiros | ✅ | 0.78 | Mortes agudas e doenças por radiação nos operadores e socorristas. Tra… |
| Contaminação de alimentos, leite e terras agrícolas | ✅ | 0.67 | Contaminação radioativa do solo e águas. Deposição de isótopos radioat… |
| Custo econômico massivo para a União Soviética | ✅ | 0.54 | Impacto indireto no colapso da União Soviética. Agravo de crise de con… |
| Queda na confiança pública e mudanças nas políticas de energia nuclear | ✅ | 0.68 | Redução de confiança da população na tecnologia nuclear. Percepção neg… |
| Deslocamento de centenas de milhares de pessoas | ✅ | 0.74 | Deslocamento em massa de população (refugiados ambientais). Centenas d… |

## a erupção do vulcão Eyjafjallajökull na Islândia em 2010

Recall: **5/6 = 83%**  (28 nós gerados)

| Consequência documentada | Reconstruída? | Score | Nó correspondente |
|---|---|---|---|
| Fechamento do espaço aéreo europeu por causa da nuvem de cinzas | ✅ | 0.81 | Disrupção do transporte aéreo europeu. Grandes áreas do espaço aéreo d… |
| Cancelamento de milhares de voos e milhões de passageiros afetados | ✅ | 0.58 | Perturbação das atividades econômicas europeias. Interrupção de negóci… |
| Prejuízos bilionários para as companhias aéreas | ✅ | 0.60 | Aumento dos custos de seguro para transporte aéreo e empresas logístic… |
| Interrupção de cadeias de suprimento que dependem de transporte aéreo | ✅ | 0.62 | Atraso nas cadeias logísticas globais. Paralisação dos voos causa atra… |
| Passageiros presos em aeroportos pelo mundo | ❌ | 0.48 |  |
| Queda temporária nas emissões de CO2 da aviação | ✅ | 0.55 | Impacto temporário no clima regional. Redução da radiação solar e muda… |

## o surgimento da pandemia de COVID-19 no início de 2020

Recall: **8/8 = 100%**  (39 nós gerados)

| Consequência documentada | Reconstruída? | Score | Nó correspondente |
|---|---|---|---|
| Lockdowns e medidas de confinamento em vários países | ✅ | 0.74 | Adoção de medidas de distanciamento social e lockdowns. Países impleme… |
| Sobrecarga e colapso de sistemas de saúde | ✅ | 0.76 | Crise nos sistemas de saúde. Hospitais sobrecarregados, aumento de int… |
| Recessão econômica global e aumento do desemprego | ✅ | 0.66 | Queda no PIB global. A interrupção econômica e o fechamento de empresa… |
| Disparada do trabalho remoto e do ensino a distância | ✅ | 0.70 | Crescimento do ensino remoto. Instituições desenvolvem rapidamente sol… |
| Interrupção de cadeias de suprimento globais | ✅ | 0.52 | Interrupção da atividade econômica. Redução drástica de atividades pre… |
| Desenvolvimento acelerado de vacinas | ✅ | 0.72 | Aceleração da pesquisa e produção de vacinas. Mobilização de recursos … |
| Queda temporária na poluição do ar | ✅ | 0.60 | Impacto ambiental temporário (redução de emissões). Redução das ativid… |
| Crise severa no turismo e na aviação | ✅ | 0.55 | Crise nos sistemas de saúde. Hospitais sobrecarregados, aumento de int… |

# RESULTADO GERAL: 21/22 = 95% de recall


> Nota: eventos conhecidos pelo modelo — isto mede a capacidade de *reconstruir* a cadeia causal correta, não previsão inédita. O recall depende do limiar escolhido; os scores acima são auditáveis.