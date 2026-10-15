/**
 * Identitet in. Kontrakt (§5.2): station<N>/rfid (tagg läst) → tjänsten svarar
 * station<N>/identity {grupp, medlemmar}. Bygger på riggens identificationSystem.
 *
 * I piloten mockas band via MockIdentity (A4).
 */

export interface IdentityMember {
  band_id: string
  name?: string
}

export interface IdentityGroup {
  grupp: string
  medlemmar: IdentityMember[]
}

export interface Identity {
  /** Simulera/utlös en tagg-läsning; resolvar med gruppen tjänsten svarar. */
  tag(bandId: string): Promise<IdentityGroup>
}
