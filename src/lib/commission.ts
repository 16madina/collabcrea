/**
 * Commission policy CollabCréa
 * - Marque paie : agreed_amount × 1.10 (commission marque 10%) puis × 1.05 (markup Stripe pay-in)
 * - Créateur reçoit dans son wallet : agreed_amount × 0.95 (5% commission créateur)
 * - platform_fee stocké : agreed_amount × 0.15 (total des deux commissions)
 *
 * Tous les montants sont en FCFA entiers.
 */

export const BRAND_FEE_PERCENTAGE = 0.10;
export const CREATOR_FEE_PERCENTAGE = 0.05;
export const PLATFORM_FEE_PERCENTAGE = BRAND_FEE_PERCENTAGE + CREATOR_FEE_PERCENTAGE;
export const STRIPE_PAYIN_MARKUP = 0.05;
export const MIN_AGREED_AMOUNT_FCFA = 200;

export interface CommissionBreakdown {
  /** Montant convenu (référence stockée dans collaborations.agreed_amount) */
  agreedAmount: number;
  /** Commission marque (10%) ajoutée au prix */
  brandFee: number;
  /** Commission créateur (5%) déduite au crédit du wallet */
  creatorFee: number;
  /** Total commission plateforme (15%) — stocké dans collaborations.platform_fee */
  platformFee: number;
  /** Montant crédité dans le wallet créateur — stocké dans collaborations.creator_amount */
  creatorAmount: number;
  /** Sous-total payé par la marque en FCFA (avant markup Stripe) */
  brandSubtotalFCFA: number;
  /** Total facturé à la marque en FCFA, markup Stripe inclus */
  brandTotalFCFA: number;
}

/**
 * Calcule la répartition complète des commissions pour un montant convenu.
 * Le montant est borné au minimum (MIN_AGREED_AMOUNT_FCFA) et arrondi à l'entier.
 */
export function computeCommission(agreedAmount: number): CommissionBreakdown {
  // Sanitize : NaN, Infinity, négatif → bridé au minimum
  const numeric =
    typeof agreedAmount === "number" && Number.isFinite(agreedAmount) ? agreedAmount : 0;
  const safeAgreedAmount = Math.max(MIN_AGREED_AMOUNT_FCFA, Math.round(numeric));
  const brandFee = Math.round(safeAgreedAmount * BRAND_FEE_PERCENTAGE);
  const creatorFee = Math.round(safeAgreedAmount * CREATOR_FEE_PERCENTAGE);
  const platformFee = Math.round(safeAgreedAmount * PLATFORM_FEE_PERCENTAGE);
  const creatorAmount = safeAgreedAmount - creatorFee;
  const brandSubtotalFCFA = safeAgreedAmount + brandFee;
  const brandTotalFCFA = Math.round(brandSubtotalFCFA * (1 + STRIPE_PAYIN_MARKUP));

  return {
    agreedAmount: safeAgreedAmount,
    brandFee,
    creatorFee,
    platformFee,
    creatorAmount,
    brandSubtotalFCFA,
    brandTotalFCFA,
  };
}
