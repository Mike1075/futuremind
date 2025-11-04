'use client'

import { MessageCircleQuestion, MessageSquare } from 'lucide-react'

interface SocraticQuestions {
  pre_watch?: string[]
  during_watch?: string[]
  post_watch?: string[]
}

interface SocraticSectionProps {
  socraticQuestions: SocraticQuestions
  postReflection: string[]
  onDiscussWithGaia: (context: string, contextType: 'knowledge_point' | 'question') => void
}

export function SocraticSection({
  socraticQuestions,
  postReflection,
  onDiscussWithGaia
}: SocraticSectionProps) {
  const hasPreWatch = socraticQuestions.pre_watch && socraticQuestions.pre_watch.length > 0
  const hasDuringWatch = socraticQuestions.during_watch && socraticQuestions.during_watch.length > 0
  const hasPostWatch = socraticQuestions.post_watch && socraticQuestions.post_watch.length > 0
  const hasReflection = postReflection.length > 0

  if (!hasPreWatch && !hasDuringWatch && !hasPostWatch && !hasReflection) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
        <MessageCircleQuestion className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">本阶段暂无苏格拉底式问题</p>
      </div>
    )
  }

  const QuestionCard = ({
    question,
    index,
    emoji,
    label,
    borderColor
  }: {
    question: string
    index: number
    emoji: string
    label: string
    borderColor: string
  }) => (
    <div
      className={`bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:${borderColor} transition-all group`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs text-gray-500 uppercase font-medium tracking-wider">
              {label}
            </span>
          </div>
          <p className="text-gray-200 leading-relaxed">{question}</p>
        </div>
        <button
          onClick={() => onDiscussWithGaia(question, 'question')}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MessageSquare className="w-4 h-4" />
          与盖亚探讨
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* 观看前思考 */}
      {hasPreWatch && (
        <div>
          <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
            🤔 观看前思考
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            在观看纪录片之前，先思考这些问题，激发你的好奇心
          </p>
          <div className="space-y-3">
            {socraticQuestions.pre_watch!.map((question, index) => (
              <QuestionCard
                key={index}
                question={question}
                index={index}
                emoji="❓"
                label="Before Watching"
                borderColor="border-blue-500/50"
              />
            ))}
          </div>
        </div>
      )}

      {/* 观看中思考 */}
      {hasDuringWatch && (
        <div>
          <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            🎬 观看中思考
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            在观看过程中，注意这些关键问题，帮助你更深入理解
          </p>
          <div className="space-y-3">
            {socraticQuestions.during_watch!.map((question, index) => (
              <QuestionCard
                key={index}
                question={question}
                index={index}
                emoji="💭"
                label="While Watching"
                borderColor="border-purple-500/50"
              />
            ))}
          </div>
        </div>
      )}

      {/* 观看后思考 */}
      {hasPostWatch && (
        <div>
          <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
            📝 观看后思考
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            观看结束后，思考这些问题，巩固和拓展你的理解
          </p>
          <div className="space-y-3">
            {socraticQuestions.post_watch!.map((question, index) => (
              <QuestionCard
                key={index}
                question={question}
                index={index}
                emoji="✨"
                label="After Watching"
                borderColor="border-orange-500/50"
              />
            ))}
          </div>
        </div>
      )}

      {/* 课后反思 */}
      {hasReflection && (
        <div>
          <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            🌟 课后反思
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            深度反思这些问题，将学到的知识内化为自己的理解
          </p>
          <div className="space-y-3">
            {postReflection.map((reflection, index) => (
              <QuestionCard
                key={index}
                question={reflection}
                index={index}
                emoji="🔮"
                label="Reflection"
                borderColor="border-cyan-500/50"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
