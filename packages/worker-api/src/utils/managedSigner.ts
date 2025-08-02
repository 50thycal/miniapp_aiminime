/*
 * Placeholder utility for creating / retrieving a managed signer via Neynar.
 * The actual logic will be copied from Neynar examples and adapted.
 */

export interface ManagedSigner {
  signer_uuid: string
  signer_public_key: string
}

const NEYNAR_API_BASE = 'https://api.neynar.com/v2/farcaster'

export async function ensureManagedSigner(
  fid: number,
  apiKey: string,
): Promise<ManagedSigner> {
  // 1. Check if signer already exists for this fid
  const lookupRes = await fetch(
    `${NEYNAR_API_BASE}/user/signer?fid=${fid}`,
    {
      headers: {
        accept: 'application/json',
        api_key: apiKey,
      } as Record<string, string>,
    },
  )

  if (lookupRes.ok) {
    const data = (await lookupRes.json()) as ManagedSigner & {
      error?: string
    }
    if (!data.error && data.signer_uuid) return data
  }

  // 2. Create a new managed signer
  const resp = await fetch(`${NEYNAR_API_BASE}/user/signer`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      api_key: apiKey,
    } as Record<string, string>,
    body: JSON.stringify({ fid }),
  })

  if (!resp.ok) {
    throw new Error(`Failed to create signer: ${resp.status} ${resp.statusText}`)
  }

  return (await resp.json()) as ManagedSigner
}