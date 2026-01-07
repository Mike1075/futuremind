'use client'

import { useState } from 'react'
import { LockedNextModal } from './LockedNextModal'

interface LockedNextButtonProps {
  currentScore?: number
}

export function LockedNextButton({ currentScore }: LockedNextButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center text-gray-500 hover:text-gray-400 transition-colors"
      >
        下一天
        <svg className="w-5 h-5 ml-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>

      {showModal && (
        <LockedNextModal
          currentScore={currentScore}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
