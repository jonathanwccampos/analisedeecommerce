import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      analysis_id?: string
      name?: string
      email?: string
      whatsapp?: string
    }

    const { analysis_id, name, email, whatsapp } = body

    if (!analysis_id || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Verify analysis exists before inserting lead to prevent orphaned records
    const { data: analysisExists } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysis_id)
      .maybeSingle()

    if (!analysisExists) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    const { error } = await supabase.from('leads').insert({
      analysis_id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp?.trim() || null,
    })

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
