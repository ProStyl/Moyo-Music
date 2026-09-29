import '../../config/env';
import crypto from 'crypto';

/**
 * Service d'intégration technique de l'Agrégateur de Paiement KibangouPay
 * API REST officielle (Documentation : http://localhost:3000/docs)
 * Supporte : Dépôts Mobile Money (MTN MoMo & Airtel Money Congo XAF), Cartes bancaires, Retraits de masse (Payouts artistes)
 */

export interface KibangouPayConfig {
  baseUrl: string;
  projectId: string;
  apiKey: string;
}

export interface DepositRequest {
  amount: number;
  currency?: string; // Par défaut 'XAF'
  countryCode?: string; // 'CG' (Congo-Brazzaville)
  paymentMethod?: 'MOBILE_MONEY' | 'CARD';
  operator: 'MTN' | 'AIRTEL';
  customerName: string;
  customerMobile: string; // Ex: '+242068001122'
  customerEmail?: string;
  description: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface WithdrawalRequest {
  amount: number;
  currency?: string; // 'XAF'
  countryCode?: string; // 'CG'
  paymentMethod?: 'MOBILE_MONEY' | 'BANK_TRANSFER';
  operator: 'MTN' | 'AIRTEL';
  beneficiaryName: string;
  mobileNo: string; // Ex: '+242068001122'
  remarks: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export class KibangouPayService {
  private config: KibangouPayConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.KIBANGOUPAY_BASE_URL || 'http://localhost:3000',
      projectId: process.env.KIBANGOUPAY_PROJECT_ID || 'proj_C8248510',
      apiKey: process.env.KIBANGOUPAY_API_KEY || '',
    };
  }

  /**
   * 1. Initier un Dépôt / Paiement Client en Mobile Money (Achat Billets, Dépôt BCDA, Distribution, Services 360)
   */
  async createDeposit(data: DepositRequest) {
    console.log(`[KibangouPay] Initiation d'un dépôt de ${data.amount} XAF via ${data.operator} (${data.customerMobile})...`);

    const payload = {
      amount: data.amount,
      currency: data.currency || 'XAF',
      countryCode: data.countryCode || 'CG',
      paymentMethod: data.paymentMethod || 'MOBILE_MONEY',
      operator: data.operator.toUpperCase().includes('MTN') ? 'MTN' : 'AIRTEL',
      customerName: data.customerName,
      customerMobile: data.customerMobile,
      customerEmail: data.customerEmail || `${data.customerMobile.replace(/[^0-9]/g, '')}@moyo.cg`,
      description: data.description,
      passDigitalCharge: true,
      idempotencyKey: data.idempotencyKey || `dep_moyo_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      metadata: data.metadata || {},
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/payments/deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-project-id': this.config.projectId,
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[KibangouPay] Réponse HTTP ${response.status}: ${errorText}`);
        if (process.env.KIBANGOUPAY_MOCK_MODE === 'true') {
          return {
            success: true,
            transaction_id: `MOCK-TX-${crypto.randomUUID()}`,
            status: 'SUCCESS',
            operator: payload.operator,
            amount: payload.amount,
            currency: payload.currency,
            phone: payload.customerMobile,
            message: `Paiement simulé de ${payload.amount} XAF.`,
            gateway_connected: false,
            mock: true
          };
        }
        const unknown = response.status >= 500;
        return {
          success: false,
          transaction_id: '',
          status: unknown ? 'UNKNOWN' : 'FAILED',
          operator: payload.operator,
          amount: payload.amount,
          currency: payload.currency,
          phone: payload.customerMobile,
          message: `KibangouPay a refusé le paiement (HTTP ${response.status}).`,
          gateway_connected: true,
          error: errorText.slice(0, 1000)
        };
      }

      const json = await response.json();
      return {
        success: true,
        transaction_id: json.id || json.transactionId || `KBP-TX-${Date.now()}`,
        status: json.status || 'PENDING',
        payment_url: json.payUrl || json.paymentUrl,
        operator: payload.operator,
        amount: payload.amount,
        currency: payload.currency,
        phone: payload.customerMobile,
        message: `Notification de paiement envoyée sur le mobile ${payload.customerMobile}. Validez avec votre code secret Mobile Money.`,
        gateway_connected: true,
        data: json,
      };
    } catch (error: any) {
      console.error('[KibangouPay] Erreur de communication réseau :', error.message);
      if (process.env.KIBANGOUPAY_MOCK_MODE === 'true') {
        return {
          success: true,
          transaction_id: `MOCK-TX-${crypto.randomUUID()}`,
          status: 'SUCCESS',
          operator: payload.operator,
          amount: payload.amount,
          currency: payload.currency,
          phone: payload.customerMobile,
          message: `Paiement simulé de ${payload.amount} XAF.`,
          gateway_connected: false,
          mock: true
        };
      }
      return {
        success: false,
        transaction_id: '',
        status: 'UNKNOWN',
        operator: payload.operator,
        amount: payload.amount,
        currency: payload.currency,
        phone: payload.customerMobile,
        message: 'Réponse du prestataire inconnue. La transaction reste en attente de réconciliation.',
        gateway_connected: false,
        error: error.message
      };
    }
  }

  /**
   * 2. Initier un Retrait de Masse / Payout vers le compte Mobile Money d'un Artiste
   */
  async createWithdrawal(data: WithdrawalRequest) {
    console.log(`[KibangouPay] Initiation d'un retrait de ${data.amount} XAF vers ${data.operator} (${data.mobileNo})...`);

    const payload = {
      amount: data.amount,
      currency: data.currency || 'XAF',
      countryCode: data.countryCode || 'CG',
      paymentMethod: data.paymentMethod || 'MOBILE_MONEY',
      operator: data.operator.toUpperCase().includes('MTN') ? 'MTN' : 'AIRTEL',
      beneficiaryName: data.beneficiaryName,
      mobileNo: data.mobileNo,
      remarks: data.remarks || 'Retrait Royalties & Ventes Moyo Culture',
      idempotencyKey: data.idempotencyKey || `wd_moyo_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      metadata: data.metadata || {},
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/payments/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-project-id': this.config.projectId,
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[KibangouPay Payout] Réponse HTTP ${response.status}: ${errorText}`);
        if (process.env.KIBANGOUPAY_MOCK_MODE === 'true') {
          return {
            success: true,
            transaction_id: `MOCK-WD-${crypto.randomUUID()}`,
            status: 'SUCCESS',
            amount: payload.amount,
            beneficiary: payload.beneficiaryName,
            phone: payload.mobileNo,
            message: `Retrait simulé de ${payload.amount} FCFA.`,
            gateway_connected: false,
            mock: true
          };
        }
        const unknown = response.status >= 500;
        return {
          success: false,
          transaction_id: '',
          status: unknown ? 'UNKNOWN' : 'FAILED',
          amount: payload.amount,
          beneficiary: payload.beneficiaryName,
          phone: payload.mobileNo,
          message: `KibangouPay a refusé le retrait (HTTP ${response.status}).`,
          gateway_connected: true,
          error: errorText.slice(0, 1000)
        };
      }

      const json = await response.json();
      return {
        success: true,
        transaction_id: json.id || json.transactionId || `KBP-WD-${Date.now()}`,
        status: json.status || 'SUCCESS',
        amount: payload.amount,
        beneficiary: payload.beneficiaryName,
        phone: payload.mobileNo,
        message: `Virement de ${payload.amount} FCFA effectué vers ${payload.operator} Money (${payload.mobileNo}).`,
        gateway_connected: true,
        data: json,
      };
    } catch (error: any) {
      console.error('[KibangouPay Payout] Erreur de communication :', error.message);
      if (process.env.KIBANGOUPAY_MOCK_MODE === 'true') {
        return {
          success: true,
          transaction_id: `MOCK-WD-${crypto.randomUUID()}`,
          status: 'SUCCESS',
          amount: payload.amount,
          beneficiary: payload.beneficiaryName,
          phone: payload.mobileNo,
          message: `Retrait simulé de ${payload.amount} FCFA.`,
          gateway_connected: false,
          mock: true
        };
      }
      return {
        success: false,
        transaction_id: '',
        status: 'UNKNOWN',
        amount: payload.amount,
        beneficiary: payload.beneficiaryName,
        phone: payload.mobileNo,
        message: 'Réponse du prestataire inconnue. Le retrait reste en attente de réconciliation.',
        gateway_connected: false,
        error: error.message
      };
    }
  }

  /**
   * 3. Vérifier le statut d'une transaction
   */
  async getTransactionStatus(transactionId: string) {
    try {
      const response = await fetch(`${this.config.baseUrl}/payments/transactions/${transactionId}/sync`, {
        method: 'GET',
        headers: {
          'x-project-id': this.config.projectId,
          'x-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        return { id: transactionId, status: 'UNKNOWN' };
      }

      return await response.json();
    } catch (e) {
      return { id: transactionId, status: 'UNKNOWN' };
    }
  }
}

export const kibangouPay = new KibangouPayService();
