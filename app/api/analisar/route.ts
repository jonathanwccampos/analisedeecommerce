import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { supabase } from '@/lib/supabase'
import { runAnalysis } from '@/lib/services/analyzer'

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date()
  windowStart.setMinutes(0, 0, 0) // floor to current hour

  const { data, error } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('ip', ip)
    .eq('window_start', windowStart.toISOString())
    .maybeSingle()

  if (error) return true // allow on error

  if (!data) {
    await supabase.from('rate_limits').insert({ ip, window_start: windowStart.toISOString(), count: 1 })
    return true
  }

  if (data.count >= 5) return false

  await supabase
    .from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('ip', ip)
    .eq('window_start', windowStart.toISOString())

  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string; context?: Record<string, string> }
    const url = body.url?.trim()
    const context = body.context ?? {}

    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: 'URL inválida. Informe uma URL com http:// ou https://' },
        { status: 400 }
      )
    }

    // Sanitize IP: take only the first segment, strip whitespace, validate format
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
    const ip = /^[\d.a-f:]+$/i.test(rawIp) ? rawIp : '0.0.0.0'
    const allowed = await checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Limite de análises atingido. Aguarde 1 hora para realizar uma nova análise.' },
        { status: 429 }
      )
    }

    const { data: analysis, error } = await supabase
      .from('analyses')
      .insert({ url, status: 'processing', context })
      .select('id')
      .single()

    if (error || !analysis) {
      return NextResponse.json({ error: 'Erro ao iniciar análise' }, { status: 500 })
    }

    // waitUntil keeps the Vercel function alive after the response is sent
    waitUntil(
      runAnalysis(analysis.id, url, context).catch(err =>
        console.error(`[runAnalysis] unhandled error for ${analysis.id}:`, err)
      )
    )

    return NextResponse.json({ id: analysis.id })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
