/** Catalog prices are VAT-excluded. Card charge = supply + 10% VAT. */

export type VatQuote = {
  supply_amount: number
  vat_amount: number
  charge_amount: number
  vat_rate_percent: number
  billing_cycle: 'monthly'
  service_period_label: string
  auto_billing: boolean
  vat_excluded: true
}

export function vatQuote(supplyExVat: number): VatQuote {
  const supply_amount = Math.max(0, Math.round(supplyExVat || 0))
  const vat_amount = Math.round(supply_amount * 0.1)
  return {
    supply_amount,
    vat_amount,
    charge_amount: supply_amount + vat_amount,
    vat_rate_percent: 10,
    billing_cycle: 'monthly',
    service_period_label: '결제일로부터 1개월',
    auto_billing: true,
    vat_excluded: true,
  }
}
