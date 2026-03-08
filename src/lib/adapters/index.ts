/**
 * Adapters - Ponto de entrada
 * Exporta todos os adapters e tipos
 */

export { paymentAdapter } from "./payment-adapter";
export { smsAdapter } from "./sms-adapter";
export { pixelAdapter } from "./pixel-adapter";
export { webhookDispatcher } from "./webhook-dispatcher";
export { emailAdapter } from "./email-adapter";
export { queueAdapter } from "./queue-adapter";
export * from "./types";
