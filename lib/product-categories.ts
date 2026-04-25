export const productCategoryValues = [
  "RACAO_SECA",
  "RACAO_UMIDA",
  "PETISCOS",
  "SUPLEMENTOS",
  "HIGIENE",
  "AREIA_HIGIENICA",
  "TAPETES_HIGIENICOS",
  "ANTIPULGAS_ANTICARRAPATOS",
  "ACESSORIOS",
  "BRINQUEDOS",
] as const;

export type ProductCategoryValue = (typeof productCategoryValues)[number];

export const productCategoryLabels: Record<ProductCategoryValue, string> = {
  RACAO_SECA: "Racao seca",
  RACAO_UMIDA: "Racao umida",
  PETISCOS: "Petiscos",
  SUPLEMENTOS: "Suplementos",
  HIGIENE: "Higiene",
  AREIA_HIGIENICA: "Areia higienica",
  TAPETES_HIGIENICOS: "Tapetes higienicos",
  ANTIPULGAS_ANTICARRAPATOS: "Antipulgas e anticarrapatos",
  ACESSORIOS: "Acessorios",
  BRINQUEDOS: "Brinquedos",
};

export function getProductCategoryLabel(category: ProductCategoryValue) {
  return productCategoryLabels[category];
}
