import crypto from 'crypto';

export interface ACRCloudConfig {
  host: string;
  accessKey: string;
  accessSecret: string;
  timeoutMs: number;
}

export interface AcousticMatchResult {
  success: boolean;
  score: number; // 0 to 100
  title?: string;
  artist?: string;
  album?: string;
  isrc?: string;
  label?: string;
  release_date?: string;
  external_metadata?: {
    spotify_id?: string;
    apple_music_id?: string;
    youtube_video_id?: string;
    deezer_id?: string;
  };
  raw_response?: any;
}

export class ACRCloudService {
  private config: ACRCloudConfig;

  constructor() {
    this.config = {
      host: process.env.ACRCLOUD_HOST || 'identify-eu-west-1.acrcloud.com',
      accessKey: process.env.ACRCLOUD_ACCESS_KEY || '',
      accessSecret: process.env.ACRCLOUD_ACCESS_SECRET || '',
      timeoutMs: 10000,
    };
  }

  /**
   * Générer la signature HMAC-SHA1 officielle requise par le protocole ACRCloud
   */
  private buildSignature(httpMethod: string, httpUri: string, accessKey: string, dataB64: string, timestamp: number, accessSecret: string): string {
    const stringToSign = `${httpMethod}\n${httpUri}\n${accessKey}\n${dataB64}\n1\n${timestamp}`;
    return crypto
      .createHmac('sha1', accessSecret)
      .update(Buffer.from(stringToSign, 'utf-8'))
      .digest('base64');
  }

  /**
   * Identifier un buffer audio binaire contre le répertoire mondial ACRCloud (100M+ morceaux)
   */
  async identifyAudioBuffer(sampleBuffer: Buffer, audioFormat: string = 'mp3'): Promise<AcousticMatchResult> {
    // Si aucune clé API ACRCloud n'est fournie dans l'environnement, on utilise le moteur local de secours
    if (!this.config.accessKey || !this.config.accessSecret) {
      console.log('[ACRCloud] Clés API non configurées dans .env (Mode Moteur Local BCDA actif)');
      return {
        success: false,
        score: 0,
        raw_response: { message: 'ACRCLOUD_ACCESS_KEY not configured. Local fallback active.' }
      };
    }

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const httpMethod = 'POST';
      const httpUri = '/v1/identify';
      const dataType = 'audio';

      const signature = this.buildSignature(
        httpMethod,
        httpUri,
        this.config.accessKey,
        dataType,
        currentTimestamp,
        this.config.accessSecret
      );

      const formData = new FormData();
      formData.append('sample', new Blob([new Uint8Array(sampleBuffer)]), `sample.${audioFormat}`);
      formData.append('access_key', this.config.accessKey);
      formData.append('data_type', dataType);
      formData.append('signature_version', '1');
      formData.append('signature', signature);
      formData.append('sample_bytes', sampleBuffer.length.toString());
      formData.append('timestamp', currentTimestamp.toString());

      const url = `https://${this.config.host}${httpUri}`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ACRCloud API HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json: any = await response.json();

      // Code 0 = Succès et correspondance trouvée
      if (json.status && json.status.code === 0 && json.metadata && json.metadata.music && json.metadata.music.length > 0) {
        const bestMatch = json.metadata.music[0];
        const artistName = bestMatch.artists ? bestMatch.artists.map((a: any) => a.name).join(', ') : 'Inconnu';
        const isrc = bestMatch.external_ids ? bestMatch.external_ids.isrc : undefined;

        return {
          success: true,
          score: bestMatch.score || 100,
          title: bestMatch.title,
          artist: artistName,
          album: bestMatch.album?.name,
          label: bestMatch.label,
          release_date: bestMatch.release_date,
          isrc: isrc,
          external_metadata: {
            spotify_id: bestMatch.external_metadata?.spotify?.track?.id,
            apple_music_id: bestMatch.external_metadata?.apple_music?.track?.id,
            youtube_video_id: bestMatch.external_metadata?.youtube?.vid,
            deezer_id: bestMatch.external_metadata?.deezer?.track?.id,
          },
          raw_response: json
        };
      }

      return {
        success: false,
        score: 0,
        raw_response: json
      };

    } catch (error: any) {
      console.error('[ACRCloud] Erreur lors de l\'identification acoustique :', error.message);
      return {
        success: false,
        score: 0,
        raw_response: { error: error.message }
      };
    }
  }
}

export const acrCloudService = new ACRCloudService();
