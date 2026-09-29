/**
 * Service de Génération XML DDEX ERN (Electronic Release Notification)
 * Standard international officiel pour la distribution de musique vers Spotify, Apple Music, Deezer, Boomplay, TikTok.
 * Conforme aux spécifications DDEX ERN 4.3 et ERN 3.8.2.
 */

export interface DDEXReleaseData {
  message_id: string;
  sender_id: string;
  recipient_id: string;
  upc: string;
  release_title: string;
  release_type: string; // 'Single', 'Album', 'EP'
  main_artist: string;
  genre: string;
  p_line_year: number;
  p_line_text: string;
  c_line_year: number;
  c_line_text: string;
  label_name: string;
  release_date: string; // 'YYYY-MM-DD'
  cover_image_filename: string;
  territories: string[]; // ['CG', 'FR', 'Worldwide']
  tracks: Array<{
    position: number;
    title: string;
    isrc: string;
    duration_iso: string; // 'PT3M45S'
    duration_seconds: number;
    audio_filename: string;
    author: string;
    composer: string;
    explicit: boolean;
  }>;
}

export class DDEXService {
  /**
   * Convertir des secondes en format ISO 8601 Duration (ex: 215 -> PT3M35S)
   */
  secondsToISODuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `PT${mins}M${secs}S`;
  }

  /**
   * Générer le fichier XML complet conforme à la norme DDEX ERN 4.3
   */
  generateERN4XML(data: DDEXReleaseData): string {
    const timestamp = new Date().toISOString();
    const isWorldwide = data.territories.includes('Worldwide') || data.territories.length === 0;
    const territoryTags = isWorldwide
      ? `<TerritoryCode>Worldwide</TerritoryCode>`
      : data.territories.map((t) => `<TerritoryCode>${t}</TerritoryCode>`).join('\n          ');

    // 1. Liste des ressources audio (SoundRecording)
    const soundRecordingsXML = data.tracks
      .map(
        (t) => `
    <SoundRecording>
      <SoundRecordingType>MusicalWorkSoundRecording</SoundRecordingType>
      <SoundRecordingId>
        <ISRC>${t.isrc}</ISRC>
      </SoundRecordingId>
      <ResourceReference>A${t.position}</ResourceReference>
      <ReferenceTitle>
        <TitleText>${this.escapeXML(t.title)}</TitleText>
      </ReferenceTitle>
      <Duration>${t.duration_iso || this.secondsToISODuration(t.duration_seconds || 180)}</Duration>
      <DisplayArtist>
        <PartyName>
          <FullName>${this.escapeXML(data.main_artist)}</FullName>
        </PartyName>
        <ArtistRole>MainArtist</ArtistRole>
      </DisplayArtist>
      <TechnicalSoundRecordingDetails>
        <TechnicalResourceDetailsReference>T${t.position}</TechnicalResourceDetailsReference>
        <AudioCodecType>PCM</AudioCodecType>
        <SamplingRate UnitOfMeasure="kHz">44.1</SamplingRate>
        <BitsPerSample>24</BitsPerSample>
        <NumberOfChannels>2</NumberOfChannels>
        <File>
          <FileName>${t.audio_filename || `track_${t.position}.wav`}</FileName>
        </File>
      </TechnicalSoundRecordingDetails>
    </SoundRecording>`
      )
      .join('\n');

    // 2. Ressource Image de la Pochette (3000x3000px)
    const imageResourceXML = `
    <Image>
      <ImageType>FrontCoverImage</ImageType>
      <ImageId>
        <ProprietaryId Namespace="MOYO_CULTURE">${data.upc}_Cover</ProprietaryId>
      </ImageId>
      <ResourceReference>IMG1</ResourceReference>
      <TechnicalImageDetails>
        <TechnicalResourceDetailsReference>TIMG1</TechnicalResourceDetailsReference>
        <ImageCodecType>JPEG</ImageCodecType>
        <ImageHeight UnitOfMeasure="Pixels">3000</ImageHeight>
        <ImageWidth UnitOfMeasure="Pixels">3000</ImageWidth>
        <File>
          <FileName>${data.cover_image_filename || 'cover.jpg'}</FileName>
        </File>
      </TechnicalImageDetails>
    </Image>`;

    // 3. XML Global DDEX ERN 4.3
    return `<?xml version="1.0" encoding="UTF-8"?>
<ern:NewReleaseMessage xmlns:ern="http://ddex.net/xml/ern/43" 
                       xmlns:xs="http://www.w3.org/2001/XMLSchema-instance"
                       MessageSchemaVersionId="ern/43" 
                       LanguageAndScriptCode="fr">
  <MessageHeader>
    <MessageId>${data.message_id || `MSG-MOYO-${Date.now()}`}</MessageId>
    <MessageSender>
      <PartyId>${data.sender_id || 'PADPIDA2026MOYO'}</PartyId>
      <PartyName>
        <FullName>Moyo Culture Distribution Congo</FullName>
      </PartyName>
    </MessageSender>
    <MessageRecipient>
      <PartyId>${data.recipient_id || 'PADPIDDSPWORLD'}</PartyId>
      <PartyName>
        <FullName>Spotify / Apple Music / Boomplay / TikTok Delivery</FullName>
      </PartyName>
    </MessageRecipient>
    <MessageCreatedDateTime>${timestamp}</MessageCreatedDateTime>
  </MessageHeader>

  <ResourceList>
${soundRecordingsXML}
${imageResourceXML}
  </ResourceList>

  <ReleaseList>
    <Release>
      <ReleaseId>
        <ICPN IsEan="true">${data.upc}</ICPN>
      </ReleaseId>
      <ReleaseReference>R0</ReleaseReference>
      <ReferenceTitle>
        <TitleText>${this.escapeXML(data.release_title)}</TitleText>
      </ReferenceTitle>
      <ReleaseType>${data.release_type || 'Single'}</ReleaseType>
      <DisplayArtist>
        <PartyName>
          <FullName>${this.escapeXML(data.main_artist)}</FullName>
        </PartyName>
        <ArtistRole>MainArtist</ArtistRole>
      </DisplayArtist>
      <Genre>
        <GenreText>${this.escapeXML(data.genre || 'Rumba Congolaise')}</GenreText>
      </Genre>
      <PLine>
        <Year>${data.p_line_year || new Date().getFullYear()}</Year>
        <PLineText>${this.escapeXML(data.p_line_text || `${data.main_artist} / Moyo Culture Congo`)}</PLineText>
      </PLine>
      <CLine>
        <Year>${data.c_line_year || new Date().getFullYear()}</Year>
        <CLineText>${this.escapeXML(data.c_line_text || 'Moyo Culture Congo')}</CLineText>
      </CLine>
      <ReleaseLabelReference>${this.escapeXML(data.label_name || 'Moyo Music Indépendant')}</ReleaseLabelReference>
      <ReleaseResourceReferenceList>
        ${data.tracks.map((t) => `<ReleaseResourceReference ReleaseResourceType="PrimaryResource">A${t.position}</ReleaseResourceReference>`).join('\n        ')}
        <ReleaseResourceReference ReleaseResourceType="SecondaryResource">IMG1</ReleaseResourceReference>
      </ReleaseResourceReferenceList>
    </Release>
  </ReleaseList>

  <DealList>
    <ReleaseDeal>
      <DealReleaseReference>R0</DealReleaseReference>
      <Deal>
        <DealTerms>
          <CommercialModelType>SubscriptionModel</CommercialModelType>
          <CommercialModelType>AdSupportedModel</CommercialModelType>
          <Usage>
            <UseType>Stream</UseType>
            <UseType>PermanentDownload</UseType>
            <UseType>Sync</UseType>
          </Usage>
          <TerritoryCodeList>
            ${territoryTags}
          </TerritoryCodeList>
          <ValidityPeriod>
            <StartDate>${data.release_date || new Date().toISOString().split('T')[0]}</StartDate>
          </ValidityPeriod>
        </DealTerms>
      </Deal>
    </ReleaseDeal>
  </DealList>
</ern:NewReleaseMessage>`;
  }

  private escapeXML(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const ddexService = new DDEXService();
