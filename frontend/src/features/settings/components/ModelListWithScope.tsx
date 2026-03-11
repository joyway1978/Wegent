// SPDX-FileCopyrightText: 2025 Weibo, Inc.
//
// SPDX-License-Identifier: Apache-2.0

'use client'

import { useState, useEffect } from 'react'
import ModelList from './ModelList'
import { GroupSelector } from './groups/GroupSelector'
import { GroupMembersDialog } from './groups/GroupMembersDialog'
import { listGroups } from '@/apis/groups'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { UsersIcon } from 'lucide-react'
import type { Group, GroupRole } from '@/types/group'
import { useUser } from '@/features/common/UserContext'

interface ModelListWithScopeProps {
  scope: 'personal' | 'group' | 'all'
  selectedGroup?: string | null
  onGroupChange?: (groupName: string | null) => void
}

export function ModelListWithScope({
  scope,
  selectedGroup: externalSelectedGroup,
  onGroupChange,
}: ModelListWithScopeProps) {
  const { t } = useTranslation()
  const { user } = useUser()

  // Use external state if provided, otherwise use internal state
  const [internalSelectedGroup, setInternalSelectedGroup] = useState<string | null>(null)
  const [groupRoleMap, setGroupRoleMap] = useState<Map<string, GroupRole>>(new Map())
  const [groups, setGroups] = useState<Group[]>([])
  const [showMembersDialog, setShowMembersDialog] = useState(false)

  const selectedGroup =
    externalSelectedGroup !== undefined ? externalSelectedGroup : internalSelectedGroup
  const setSelectedGroup = onGroupChange || setInternalSelectedGroup

  // Get the full group object for the selected group
  const selectedGroupObj = groups.find(g => g.name === selectedGroup) || null

  // Check if current user can manage members (Owner or Maintainer)
  const canManageMembers =
    selectedGroupObj?.my_role === 'Owner' || selectedGroupObj?.my_role === 'Maintainer'

  // Sync internal state with external state
  useEffect(() => {
    if (externalSelectedGroup !== undefined && externalSelectedGroup !== internalSelectedGroup) {
      setInternalSelectedGroup(externalSelectedGroup)
    }
  }, [externalSelectedGroup, internalSelectedGroup])

  // Fetch all groups and build role map
  useEffect(() => {
    listGroups()
      .then(response => {
        setGroups(response.items || [])
        const roleMap = new Map<string, GroupRole>()
        response.items.forEach(group => {
          if (group.my_role) {
            roleMap.set(group.name, group.my_role)
          }
        })
        setGroupRoleMap(roleMap)
      })
      .catch(error => {
        console.error('Failed to fetch groups:', error)
      })
  }, [])

  // Handle editing a resource - auto-select its group
  const handleEditResource = (namespace: string) => {
    if (namespace && namespace !== 'default') {
      setSelectedGroup(namespace)
    }
  }

  // Handle opening members dialog
  const handleManageMembers = () => {
    if (selectedGroupObj) {
      setShowMembersDialog(true)
    }
  }

  // Handle dialog close with refresh
  const handleMembersDialogClose = () => {
    setShowMembersDialog(false)
    // Refresh groups to get updated member count
    listGroups()
      .then(response => {
        setGroups(response.items || [])
        const roleMap = new Map<string, GroupRole>()
        response.items.forEach(group => {
          if (group.my_role) {
            roleMap.set(group.name, group.my_role)
          }
        })
        setGroupRoleMap(roleMap)
      })
      .catch(error => {
        console.error('Failed to refresh groups:', error)
      })
  }

  if (scope === 'personal') {
    return <ModelList scope="personal" />
  }

  // When selectedGroup is provided externally (from nav), don't show GroupSelector
  const showGroupSelector = externalSelectedGroup === undefined

  return (
    <div className="space-y-4">
      {scope === 'group' && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            {showGroupSelector && (
              <div className="flex-1">
                <GroupSelector value={selectedGroup} onChange={setSelectedGroup} scope={scope} />
              </div>
            )}
            {selectedGroupObj && canManageMembers && (
              <Button variant="outline" onClick={handleManageMembers} className="shrink-0">
                <UsersIcon className="w-4 h-4 mr-2" />
                {t('groups:groupManager.manageMembers')}
              </Button>
            )}
          </div>
        </div>
      )}
      <ModelList
        scope="group"
        groupName={selectedGroup || undefined}
        groupRoleMap={groupRoleMap}
        onEditResource={handleEditResource}
      />

      {/* Group Members Management Dialog */}
      <GroupMembersDialog
        isOpen={showMembersDialog}
        onClose={handleMembersDialogClose}
        onSuccess={handleMembersDialogClose}
        group={selectedGroupObj}
        currentUserId={user?.id}
      />
    </div>
  )
}
