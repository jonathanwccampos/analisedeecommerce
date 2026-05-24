'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type AnalysisStatus = 'processing' | 'completed' | 'error' | 'expired'

interface UseAnalysisOptions {
  onComplete?: () => void
  pollIntervalMs?: number
  hardTimeoutMs?: number
  animStepMs?: number
  totalSteps?: number
}

interface UseAnalysisResult {
  checkedCount: number
  elapsed: number
  error: string
}

export function useAnalysis(id: string, options: UseAnalysisOptions = {}): UseAnalysisResult {
  const {
    onComplete,
    pollIntervalMs = 3000,
    hardTimeoutMs = 90000,
    animStepMs = 2500,
    totalSteps = 7,
  } = options

  const router = useRouter()
  const [checkedCount, setCheckedCount] = useState(0)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  // Keep stable refs to avoid stale closures in intervals
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const start = Date.now()

    const animInterval = setInterval(() => {
      setCheckedCount(prev => Math.min(prev + 1, totalSteps - 1))
      setElapsed(Math.round((Date.now() - start) / 1000))
    }, animStepMs)

    const hardTimeout = setTimeout(() => {
      clearInterval(animInterval)
      clearInterval(pollInterval)
      setError('A análise demorou mais que o esperado. Verifique se a URL da loja está acessível e tente novamente.')
    }, hardTimeoutMs)

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analise/${id}`)
        const data = await res.json() as { status: AnalysisStatus }

        if (data.status === 'completed') {
          clearInterval(animInterval)
          clearInterval(pollInterval)
          clearTimeout(hardTimeout)
          setCheckedCount(totalSteps)
          setTimeout(() => {
            onCompleteRef.current?.()
            router.push(`/resultado/${id}`)
          }, 500)
        } else if (data.status === 'error') {
          clearInterval(animInterval)
          clearInterval(pollInterval)
          clearTimeout(hardTimeout)
          setError('A análise falhou. Verifique se a URL da loja está acessível e tente novamente.')
        } else if (data.status === 'expired') {
          clearInterval(animInterval)
          clearInterval(pollInterval)
          clearTimeout(hardTimeout)
          router.push('/?expired=1')
        }
      } catch { /* keep polling */ }
    }, pollIntervalMs)

    return () => {
      clearInterval(animInterval)
      clearInterval(pollInterval)
      clearTimeout(hardTimeout)
    }
  }, [id, router, pollIntervalMs, hardTimeoutMs, animStepMs, totalSteps])

  return { checkedCount, elapsed, error }
}
