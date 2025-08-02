import { createClient, Errors } from '@farcaster/quick-auth'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { ExportedHandlerScheduledHandler } from '@cloudflare/workers-types'
import { ensureManagedSigner } from './utils/managedSigner.js'

// ---- Types -----------------------------------------------------------------

interface Env {
  HOSTNAME: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  NEYNAR_API_KEY: string
  // Add more bindings (KV / D1 / etc.) as you introduce them
}

interface User {
  fid: number
  primaryAddress?: string
}

// ---- Setup -----------------------------------------------------------------

const quickAuth = createClient()
const app = new Hono<{ Bindings: Env; Variables: { user: User } }>()

const quickAuthMiddleware = createMiddleware<{
  Bindings: Env
  Variables: { user: User }
}>(async (c, next) => {
  const authorization = c.req.header('Authorization')
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing token' })
  }

  try {
    const payload = await quickAuth.verifyJwt({
      token: authorization.split(' ')[1] as string,
      domain: c.env.HOSTNAME,
    })

    // TODO: Replace with Supabase lookup for persisted profile settings
    c.set('user', { fid: payload.sub })
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      throw new HTTPException(401, { message: 'Invalid token' })
    }

    throw e
  }

  await next()
})

// ---- Routes ----------------------------------------------------------------

app.use('*', cors())

// 1. Session probe
app.get('/me', quickAuthMiddleware, (c) => {
  return c.json(c.get('user'))
})

// 2. Bot settings (tone, frequency, targets)
app.get('/settings', quickAuthMiddleware, async (c) => {
  // TODO: pull from Supabase row keyed by fid
  return c.json({ tone: 'default' })
})

app.post('/settings', quickAuthMiddleware, async (c) => {
  // TODO: upsert into Supabase
  const body = await c.req.json<{ tone: string }>()
  return c.json({ ok: true, tone: body.tone })
})

// 3. Kick-off flow – mint managed signer via Neynar & persist
app.post('/kickoff', quickAuthMiddleware, async (c) => {
  const { fid } = c.get('user')
  try {
    const signer = await ensureManagedSigner(fid, c.env.NEYNAR_API_KEY)
    // TODO: persist signer_uuid in Supabase along with fid
    return c.json(signer)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})

// ---- Cron job --------------------------------------------------------------
// The Worker Cron trigger will call this handler directly (no HTTP request)
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (
  controller,
  env,
  ctx,
) => {
  // TODO: 1. fetch recent casts 2. build prompt 3. generate reply 4. post via signer
  console.log('Cron fired at', controller.scheduledTime)
}

// ---- 404 -------------------------------------------------------------------

app.all('*', (c) => c.text('Not found', 404))

export default app