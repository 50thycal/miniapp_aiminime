/*
 * Placeholder utility for creating / retrieving a managed signer via Neynar.
 * The actual logic will be copied from Neynar examples and adapted.
 */

export interface ManagedSigner {
  signer_uuid: string
  signer_public_key: string
}

export async function ensureManagedSigner(fid: number, neynarApiKey: string): Promise<ManagedSigner> {
  // TODO: Implement using Neynar "managed-signers" endpoint.
  // Docs: https://docs.neynar.com/reference/#managed-signer
  throw new Error('Not implemented')
}