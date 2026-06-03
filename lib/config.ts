// Configuração visual compartilhada pela UI (cores/labels por domínio).

export const DOMAIN_COLORS: Record<string, string> = {
  economy: "#f4b740",
  climate: "#4cc9f0",
  society: "#b06ffb",
  politics: "#f06595",
  infrastructure: "#8d99ae",
  health: "#51cf66",
  environment: "#38b000",
  technology: "#5c7cfa",
  security: "#ff6b6b",
};

export const DOMAIN_LABELS: Record<string, string> = {
  economy: "Economia",
  climate: "Clima",
  society: "Sociedade",
  politics: "Política",
  infrastructure: "Infraestrutura",
  health: "Saúde",
  environment: "Meio ambiente",
  technology: "Tecnologia",
  security: "Segurança",
};

export const HORIZON_LABELS: Record<string, string> = {
  immediate: "Imediato",
  days: "Dias",
  weeks: "Semanas",
  months: "Meses",
  years: "Anos",
};

export const MAGNITUDE_LABELS: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  severe: "Severa",
};

export const MAGNITUDE_SIZE: Record<string, number> = {
  low: 34,
  medium: 46,
  high: 58,
  severe: 72,
};
