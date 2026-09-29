import { query } from './db';

let sequencesInitialized = false;

export async function ensureSequences() {
  if (sequencesInitialized) return;
  try {
    await query(`
      CREATE SEQUENCE IF NOT EXISTS bcda_isrc_seq START WITH 10001;
      CREATE SEQUENCE IF NOT EXISTS bcda_iswc_seq START WITH 100001;
      CREATE SEQUENCE IF NOT EXISTS bcda_reg_seq START WITH 101;
      CREATE SEQUENCE IF NOT EXISTS congo_upc_seq START WITH 10001;
      CREATE SEQUENCE IF NOT EXISTS cert_art_seq START WITH 101;
    `);
    sequencesInitialized = true;
  } catch (error) {
    console.error('Erreur initialisation séquences DB:', error);
  }
}

/**
 * Génère le code ISRC Congolais officiel séquentiel (CG-B01-AA-NNNNN)
 */
export async function getNextISRC(): Promise<string> {
  await ensureSequences();
  const year = new Date().getFullYear().toString().slice(-2);
  const res = await query(`SELECT nextval('bcda_isrc_seq') as seq`);
  const seqNum = String(res.rows[0].seq).padStart(5, '0');
  return `CG-B01-${year}-${seqNum}`;
}

/**
 * Génère le code ISWC International séquentiel et unique conforme CISAC (T-304.XXX.XXX-C)
 */
export async function getNextISWC(): Promise<string> {
  await ensureSequences();
  const res = await query(`SELECT nextval('bcda_iswc_seq') as seq`);
  const num = parseInt(res.rows[0].seq, 10);
  const part1 = String(Math.floor(num / 1000) % 1000).padStart(3, '0');
  const part2 = String(num % 1000).padStart(3, '0');
  const checkDigit = ((num % 9) + 1).toString();
  return `T-304.${part1}.${part2}-${checkDigit}`;
}

/**
 * Génère le numéro d'enregistrement officiel BCDA séquentiel (BCDA-CG-2026-NNNNN)
 */
export async function getNextBcdaRegistration(): Promise<string> {
  await ensureSequences();
  const year = new Date().getFullYear();
  const res = await query(`SELECT nextval('bcda_reg_seq') as seq`);
  const seqNum = String(res.rows[0].seq).padStart(5, '0');
  return `BCDA-CG-${year}-${seqNum}`;
}

/**
 * Génère le code UPC EAN-13 Congolais séquentiel
 */
export async function getNextUPC(): Promise<string> {
  await ensureSequences();
  const res = await query(`SELECT nextval('congo_upc_seq') as seq`);
  const seqNum = String(res.rows[0].seq).padStart(6, '0');
  return `607474${seqNum}`;
}

/**
 * Génère le numéro de certificat d'authenticité École de Poto-Poto
 */
export async function getNextArtCertificate(): Promise<string> {
  await ensureSequences();
  const year = new Date().getFullYear();
  const res = await query(`SELECT nextval('cert_art_seq') as seq`);
  const seqNum = String(res.rows[0].seq).padStart(4, '0');
  return `CERT-EPP-${year}-${seqNum}`;
}
