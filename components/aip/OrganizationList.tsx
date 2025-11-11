'use client'

import type { UserOrganization } from '@/lib/aip/types'

interface OrganizationListProps {
  organizations: UserOrganization[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function OrganizationList({ organizations, selectedId, onSelect }: OrganizationListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">我的组织</h3>
      {organizations.map((userOrg) => {
        const org = userOrg.organization
        if (!org) return null

        const isSelected = selectedId === org.id
        const isSystem = org.settings?.is_system === true
        const isGlobal = org.settings?.is_global === true
        const isPersonal = org.settings?.is_personal === true

        return (
          <button
            key={org.id}
            onClick={() => onSelect(org.id)}
            className={`
              w-full text-left p-4 rounded-xl border transition-all duration-200
              ${isSelected
                ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                : 'bg-black/30 border-white/10 hover:border-purple-500/30 hover:bg-black/50'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                  {org.name}
                </h4>
                {org.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {org.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {isSystem && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      系统
                    </span>
                  )}
                  {isGlobal && (
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                      社区
                    </span>
                  )}
                  {isPersonal && (
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      个人
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-300 border border-gray-500/30">
                    {userOrg.role_in_org === 'owner' ? '所有者' :
                     userOrg.role_in_org === 'admin' ? '管理员' : '成员'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )
      })}

      {organizations.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          暂无组织
        </div>
      )}
    </div>
  )
}
