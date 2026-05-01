import { forwardRef } from "react";
import Image from "next/image";
import styles from "@/components/pedidos/order-pdf-template.module.css";

type OrderPdfItem = {
  id: string;
  productId: string | null;
  productCode: string | null;
  productName: string | null;
  description: string;
  quantity: number;
  discount: number;
  unitPrice: number;
  totalPrice: number;
  operation: "VENDA";
};

export type OrderPdfData = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerCode: string | null;
  customerCompany: string | null;
  customerCnpjCpf: string | null;
  customerPhone: string | null;
  customerCommercialAddress: string | null;
  customerDeliveryAddress: string | null;
  customerOrderNumber: string | null;
  carrierName: string | null;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  paymentTerm:
    | "DAYS_14"
    | "DAYS_15_30_45"
    | "DAYS_21"
    | "DAYS_21_28"
    | "DAYS_21_28_35"
    | "DAYS_28"
    | "DAYS_30"
    | "DAYS_7"
    | "DAYS_7_14_21"
    | "DAYS_7_14_21_28"
    | "A_VISTA_ANTECIPADA"
    | "BONIFICACAO"
    | "CARTAO_CREDITO"
    | "CARTAO_DEBITO"
    | "TROCA";
  freightType: "CIF" | "FOB";
  deliveryType: "ENTREGA" | "ENTREGA_FATURA" | "ENCOMENDA" | "RETIRADA";
  receivingCompany: string | null;
  notes: string | null;
  total: number;
  createdAt: string;
  approvedAt: string | null;
  billedAt: string | null;
  items: OrderPdfItem[];
};

type OrderPdfTemplateProps = {
  order: OrderPdfData;
  paymentLabel: string;
};

const COMPANY_TEMPLATE = {
  name: "I LOVE PET & HIGIENE LTDA",
  cnpj: "33.312.252/0001-05",
  stateRegistration: "123.911.376.116",
  address: "RUA JOHN HARRISON 299 SALA 804",
  cityState: "LAPA SAO PAULO-SP",
  cep: "05074-080",
  site: "www.classeasaude.com.br",
  email: "classea@classeasaude.com.br",
  phone: "(11) 3835-9582",
  representative: "428 - JANETE APARECIDA REMIJO",
};

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function resolveCustomerAddress(order: OrderPdfData) {
  return order.customerDeliveryAddress
    ?? order.customerCommercialAddress
    ?? "-";
}

function getAddressParts(address: string | null) {
  if (!address) {
    return {
      street: "-",
      district: "-",
      city: "-",
      state: "-",
      cep: "-",
    };
  }

  const cepMatch = address.match(/\b\d{5}-?\d{3}\b/);
  const stateMatch = address.match(/\b[A-Z]{2}\b/);
  const cep = cepMatch ? cepMatch[0] : "-";
  const state = stateMatch ? stateMatch[0] : "-";

  return {
    street: address,
    district: "-",
    city: "-",
    state,
    cep,
  };
}

export const OrderPdfTemplate = forwardRef<HTMLDivElement, OrderPdfTemplateProps>(
  ({ order, paymentLabel }, ref) => {
    const issueDate = formatDate(order.createdAt);
    const issueDateTime = formatDateTime(order.createdAt);
    const grossTotal = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountTotal = order.items.reduce((sum, item) => {
      const gross = item.unitPrice * item.quantity;
      return sum + (gross - item.totalPrice);
    }, 0);
    const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const merchandiseTotal = grossTotal > 0 ? grossTotal : (subtotal > 0 ? subtotal : order.total);
    const totalDiscountPct = grossTotal > 0 ? (discountTotal / grossTotal) * 100 : 0;
    const totalVolumes = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const isApproved = order.status === "CONFIRMED" || Boolean(order.approvedAt);
    const customerAddress = resolveCustomerAddress(order);
    const customerAddressParts = getAddressParts(customerAddress);
    const isSameDeliveryAddress = order.customerDeliveryAddress
      && order.customerCommercialAddress
      && order.customerDeliveryAddress.trim() === order.customerCommercialAddress.trim();
    const orderStatusLabel = order.status === "DRAFT"
      ? "Em digitacao"
      : order.status === "CONFIRMED"
        ? "Confirmado"
        : "Cancelado";

    return (
      <div ref={ref} className={styles.orderPdfPage}>
        <section className={styles.section}>
          <div className={styles.headerGrid}>
            <div className={styles.logoBox}>
              <Image
                src="/img/logo-esb.jpeg"
                alt="Logo ESB"
                width={94}
                height={94}
                className={styles.logo}
                unoptimized
                priority
              />
            </div>
            <div className={styles.companyFields}>
              <div className={styles.row2}>
                <span className={styles.label}>Emitente</span>
                <span>{COMPANY_TEMPLATE.name}</span>
              </div>
              <div className={styles.row2}>
                <span className={styles.label}>CNPJ / IE</span>
                <span>{COMPANY_TEMPLATE.cnpj} / {COMPANY_TEMPLATE.stateRegistration}</span>
              </div>
              <div className={styles.row2}>
                <span className={styles.label}>Endereco</span>
                <span>{COMPANY_TEMPLATE.address} - {COMPANY_TEMPLATE.cityState} - CEP {COMPANY_TEMPLATE.cep}</span>
              </div>
              <div className={styles.row3}>
                <span><span className={styles.label}>Site:</span> {COMPANY_TEMPLATE.site}</span>
                <span><span className={styles.label}>E-mail:</span> {COMPANY_TEMPLATE.email}</span>
                <span><span className={styles.label}>Fone:</span> {COMPANY_TEMPLATE.phone}</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionTight}>
          <div className={styles.row3}>
            <span><span className={styles.label}>Operacao:</span> {order.status === "DRAFT" ? "00" : "80"}</span>
            <span><span className={styles.label}>N° Orcamento/Digitacao:</span> {order.orderNumber}</span>
            <span><span className={styles.label}>Emissao:</span> {issueDate}</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.subtitle}>Dados do Cliente</h2>
          <div className={styles.row3}>
            <span><span className={styles.label}>Cliente:</span> {order.customerName}</span>
            <span><span className={styles.label}>Codigo:</span> {order.customerCode ?? "-"}</span>
            <span><span className={styles.label}>CNPJ/CPF:</span> {order.customerCnpjCpf ?? "-"}</span>
          </div>
          <div className={styles.row3}>
            <span><span className={styles.label}>Empresa:</span> {order.customerCompany ?? "-"}</span>
            <span><span className={styles.label}>Contato/Fone:</span> {order.customerPhone ?? "-"}</span>
            <span><span className={styles.label}>Pedido Cliente N°:</span> {order.customerOrderNumber ?? "-"}</span>
          </div>
          <div className={styles.row2}>
            <span className={styles.label}>Endereco de entrega</span>
            <span>{customerAddress}</span>
          </div>
          <div className={styles.row4}>
            <span><span className={styles.label}>Bairro:</span> {customerAddressParts.district}</span>
            <span><span className={styles.label}>Cidade:</span> {customerAddressParts.city}</span>
            <span><span className={styles.label}>UF:</span> {customerAddressParts.state}</span>
            <span><span className={styles.label}>CEP:</span> {customerAddressParts.cep}</span>
          </div>
          <div className={styles.row4}>
            <span><span className={styles.label}>IE:</span> -</span>
            <span><span className={styles.label}>Fax:</span> -</span>
            <span><span className={styles.label}>E-mail:</span> -</span>
            <span><span className={styles.label}>End. Entrega:</span> {isSameDeliveryAddress ? "O MESMO" : "ALTERADO"}</span>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.textBlock}>
            <span className={styles.label}>VIMOS POR INTERMEDIO DESTA CONFIRMAR NOSSO PEDIDO CONFORME ABAIXO DESCRITO:</span>
            <span> Cubagem: -</span>
          </div>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Operacao</th>
                <th>Produto</th>
                <th>Descricao</th>
                <th>%Desc.</th>
                <th>Quant.</th>
                <th>UN</th>
                <th>Preco</th>
                <th>Total</th>
                <th>VL.ST</th>
                <th>%IPI</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.muted}>Pedido sem itens cadastrados.</td>
                </tr>
              ) : order.items.map((item) => (
                <tr key={item.id}>
                  <td>{order.status === "DRAFT" ? "00" : "80"}</td>
                  <td>{item.productCode ?? "-"}</td>
                  <td>{item.description || item.productName || "-"}</td>
                  <td>{formatNumber(item.discount, 0)}</td>
                  <td>{item.quantity}</td>
                  <td>UN</td>
                  <td className={styles.alignRight}>{formatNumber(item.unitPrice)}</td>
                  <td className={styles.alignRight}>{formatNumber(item.totalPrice)}</td>
                  <td className={styles.alignRight}>0,00</td>
                  <td className={styles.alignRight}>0,00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <div className={styles.totalsGrid}>
            <div className={styles.totalCell}><span className={styles.label}>Peso Bruto:</span> -</div>
            <div className={styles.totalCell}><span className={styles.label}>Volumes:</span> {formatNumber(totalVolumes, 0)}</div>
            <div className={styles.totalCell}><span className={styles.label}>Frete:</span> {order.freightType}</div>
            <div className={styles.totalCell}><span className={styles.label}>% Suframa:</span> 0,00%</div>
            <div className={styles.totalCell}><span className={styles.label}>% Desc.:</span> {formatNumber(totalDiscountPct)}%</div>
            <div className={styles.totalCell}><span className={styles.label}>VL.Frete (+):</span> 0,00</div>
            <div className={styles.totalCell}><span className={styles.label}>VL.Merc(+):</span> {formatNumber(merchandiseTotal)}</div>
            <div className={styles.totalCell}><span className={styles.label}>VL.Desc. (-):</span> {formatNumber(discountTotal)}</div>
            <div className={styles.totalCell}><span className={styles.label}>VlSubs(+):</span> 0,00</div>
            <div className={styles.totalCell}><span className={styles.label}>VL.Outras (+):</span> 0,00</div>
            <div className={styles.totalCell}><span className={styles.label}>Vl. IPI (+):</span> 0,00</div>
            <div className={styles.totalCell}><span className={styles.label}>VL.Total (=):</span> {formatNumber(order.total)}</div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.obsBox}`}>
          <span className={styles.label}>Obs.:</span> {order.notes ?? "-"}
        </section>

        <section className={styles.section}>
          <div className={styles.row3}>
            <span><span className={styles.label}>Transp.:</span> {order.carrierName ?? COMPANY_TEMPLATE.name}</span>
            <span><span className={styles.label}>Repr.:</span> {COMPANY_TEMPLATE.representative}</span>
            <span><span className={styles.label}>Cond. Pagto:</span> {paymentLabel}</span>
          </div>
          <div className={styles.row3}>
            <span><span className={styles.label}>Prev. Entrega:</span> {order.approvedAt ? formatDate(order.approvedAt) : "PENDENTE"}</span>
            <span><span className={styles.label}>Data Base:</span> {issueDate}</span>
            <span><span className={styles.label}>Forma. Pagto:</span> {paymentLabel}</span>
          </div>
          <div className={styles.row3}>
            <span><span className={styles.label}>Faturamento:</span> {formatDateTime(order.billedAt)}</span>
            <span><span className={styles.label}>Despacho:</span> {formatDateTime(order.approvedAt)}</span>
            <span><span className={styles.label}>Sinal:</span> 0,00</span>
          </div>
          <div className={styles.row2}>
            <span><span className={styles.label}>Ped.Cliente N°:</span> {order.customerOrderNumber ?? "-"}</span>
            <span><span className={styles.label}>Horário de Recebimento:</span> -</span>
          </div>
          <div className={styles.row2}>
            <span><span className={styles.label}>Aprovado:</span> sim ( {isApproved ? "X" : " "} ) nao ( {isApproved ? " " : "X"} )</span>
            <span><span className={styles.label}>Emissao (data/hora):</span> {issueDateTime}</span>
          </div>
          <div className={styles.row3}>
            <span><span className={styles.label}>% Comissao:</span> -</span>
            <span><span className={styles.label}>Conferido em:</span> ___/___/___</span>
            <span><span className={styles.label}>Financeiro em:</span> ___/___/___</span>
          </div>
          <div className={styles.row2}>
            <span><span className={styles.label}>Status do pedido:</span> {orderStatusLabel}</span>
            <span><span className={styles.label}>Empresa recebedora:</span> {order.receivingCompany ?? "-"}</span>
          </div>
        </section>

        <section className={styles.footerGrid}>
          <div className={styles.signCell}><span className={styles.label}>Conferido por:</span></div>
          <div className={styles.signCell}><span className={styles.label}>Financeiro:</span></div>
          <div className={styles.signCell}><span className={styles.label}>Ass.:</span></div>
        </section>
      </div>
    );
  },
);

OrderPdfTemplate.displayName = "OrderPdfTemplate";
