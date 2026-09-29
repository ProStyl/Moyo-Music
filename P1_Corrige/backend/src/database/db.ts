import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de connexion PostgreSQL
// Supporte l'URL directe ou les variables par défaut pour Docker (port 5432 ou 15432)
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:changeme@localhost:5432/congo_art_music';

export const pool = new Pool({
  connectionString: connectionString,
});

pool.on('connect', () => {
  console.log('📦 Connecté avec succès à PostgreSQL (congo_art_music)');
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion PostgreSQL :', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);


/** Exécute plusieurs requêtes dans une transaction PostgreSQL. */
export async function withTransaction<T>(callback: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Erreur ROLLBACK PostgreSQL:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
