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

type ProductSubcategoryOption = {
  value: string;
  label: string;
};

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

const generalSubcategoryOption: ProductSubcategoryOption = {
  value: "GERAL",
  label: "Geral",
};

const productSubcategoryOptionsByCategory: Record<
  ProductCategoryValue,
  ProductSubcategoryOption[]
> = {
  RACAO_SECA: [
    { value: "CAES_FILHOTES", label: "Caes filhotes" },
    { value: "CAES_ADULTOS", label: "Caes adultos" },
    { value: "CAES_SENIOR", label: "Caes senior" },
    { value: "GATOS_FILHOTES", label: "Gatos filhotes" },
    { value: "GATOS_ADULTOS", label: "Gatos adultos" },
    { value: "GATOS_CASTRADOS", label: "Gatos castrados" },
    { value: "RACAS_ESPECIFICAS", label: "Racas especificas" },
    { value: "PREMIUM_ESPECIAL", label: "Premium especial" },
  ],
  RACAO_UMIDA: [
    { value: "SACHES", label: "Saches" },
    { value: "LATAS", label: "Latas" },
    { value: "PATES", label: "Pates" },
    { value: "CAES", label: "Caes" },
    { value: "GATOS", label: "Gatos" },
    { value: "DIETA_RECUPERACAO", label: "Dieta de recuperacao" },
  ],
  PETISCOS: [
    { value: "BIFINHOS", label: "Bifinhos" },
    { value: "OSSINHOS", label: "Ossinhos" },
    { value: "BISCOITOS", label: "Biscoitos" },
    { value: "SNACKS_NATURAIS", label: "Snacks naturais" },
    { value: "DENTAIS", label: "Dentais" },
    { value: "ADESTRAMENTO", label: "Adestramento" },
    { value: "RECHEAVEIS", label: "Recheaveis" },
  ],
  SUPLEMENTOS: [
    { value: "VITAMINAS", label: "Vitaminas" },
    { value: "PROBIOTICOS", label: "Probioticos" },
    { value: "CONDROPROTETORES", label: "Condroprotetores" },
    { value: "OMEGA_3", label: "Omega 3" },
    { value: "PELE_E_PELOS", label: "Pele e pelos" },
    { value: "CALMANTES", label: "Calmantes" },
  ],
  HIGIENE: [
    { value: "SHAMPOO_CONDICIONADOR", label: "Shampoo e condicionador" },
    { value: "LIMPEZA_AURICULAR", label: "Limpeza auricular" },
    { value: "HIGIENE_BUCAL", label: "Higiene bucal" },
    { value: "BANHO_SECO", label: "Banho seco" },
    { value: "HIGIENIZADOR_DE_PATAS", label: "Higienizador de patas" },
    { value: "LENCOS_UMEDECIDOS", label: "Lencos umedecidos" },
  ],
  AREIA_HIGIENICA: [
    { value: "BENTONITA", label: "Bentonita" },
    { value: "SILICA", label: "Silica" },
    { value: "BIODEGRADAVEL", label: "Biodegradavel" },
    { value: "PERFUMADA", label: "Perfumada" },
    { value: "SEM_PERFUME", label: "Sem perfume" },
    { value: "ALTA_PERFORMANCE", label: "Alta performance" },
  ],
  TAPETES_HIGIENICOS: [
    { value: "ULTRA_ABSORCAO", label: "Ultra absorcao" },
    { value: "CARVAO_ATIVADO", label: "Carvao ativado" },
    { value: "LAVAVEL", label: "Lavavel" },
    { value: "DESCARTAVEL", label: "Descartavel" },
    { value: "COM_ATRATIVO_CANINO", label: "Com atrativo canino" },
    { value: "ECONOMICO", label: "Economico" },
  ],
  ANTIPULGAS_ANTICARRAPATOS: [
    { value: "PIPETAS", label: "Pipetas" },
    { value: "COLEIRAS", label: "Coleiras" },
    { value: "COMPRIMIDOS", label: "Comprimidos" },
    { value: "SPRAY", label: "Spray" },
    { value: "SHAMPOO_REPELENTE", label: "Shampoo repelente" },
  ],
  ACESSORIOS: [
    { value: "GUIAS_COLEIRAS_PEITORAIS", label: "Guias, coleiras e peitorais" },
    { value: "COMEDOUROS_BEBEDOUROS", label: "Comedouros e bebedouros" },
    { value: "CAMAS_CASINHAS", label: "Camas e casinhas" },
    { value: "CAIXAS_DE_TRANSPORTE", label: "Caixas de transporte" },
    { value: "ROUPAS", label: "Roupas" },
    { value: "IDENTIFICACAO", label: "Identificacao" },
  ],
  BRINQUEDOS: [
    { value: "MORDEDORES", label: "Mordedores" },
    { value: "INTERATIVOS", label: "Interativos" },
    { value: "BOLAS_CORDA", label: "Bolas e corda" },
    { value: "PELUCIA", label: "Pelucia" },
    { value: "LANCADORES", label: "Lancadores" },
    { value: "ARRANHADORES_CATNIP", label: "Arranhadores e catnip" },
  ],
};

export function getProductCategoryLabel(category: ProductCategoryValue) {
  return productCategoryLabels[category];
}

export function getProductSubcategoryOptions(category: ProductCategoryValue) {
  return [generalSubcategoryOption, ...productSubcategoryOptionsByCategory[category]];
}

export function getDefaultProductSubcategory(category: ProductCategoryValue) {
  return getProductSubcategoryOptions(category)[0].value;
}

export function isValidProductSubcategory(category: ProductCategoryValue, subcategory: string) {
  return getProductSubcategoryOptions(category).some((option) => option.value === subcategory);
}

export function getProductSubcategoryLabel(category: ProductCategoryValue, subcategory: string) {
  const option = getProductSubcategoryOptions(category).find((entry) => entry.value === subcategory);
  return option?.label ?? subcategory;
}
