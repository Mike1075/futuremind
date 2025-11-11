/**
 * AIP系统 React Hooks
 * Custom React hooks for AIP system
 */

import { useState, useEffect } from 'react'
import {
  getMyOrganizations,
  getOrganizationProjects,
  getProjectById,
  getProjectTasks,
  getProjectMembers,
  getMyNotifications,
} from './api'
import type {
  UserOrganization,
  Project,
  Task,
  Notification,
  ProjectMember,
} from './types'

// ============ 组织相关 Hooks ============

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    setLoading(true)

    // 始终调用init-default-orgs确保用户加入了全局社区组织
    console.log('[客户端] 开始调用 init-default-orgs API...')
    try {
      const initResponse = await fetch('/api/aip/init-default-orgs', {
        method: 'POST'
      })

      const initData = await initResponse.json()
      console.log('[客户端] init-default-orgs 响应:', initResponse.status, initData)

      if (!initResponse.ok) {
        console.error('[客户端] init-default-orgs 失败:', initData)
      }
    } catch (initError) {
      console.error('[客户端] 初始化默认组织失败:', initError)
    }

    // 获取组织列表
    console.log('[客户端] 开始获取组织列表...')
    const result = await getMyOrganizations()
    console.log('[客户端] 组织列表结果:', result)

    if (result.error) {
      setError(result.error)
    } else {
      setOrganizations(result.data || [])
      console.log('[客户端] 设置组织列表，数量:', result.data?.length || 0)
    }

    setLoading(false)
  }

  return { organizations, loading, error, reload: loadOrganizations }
}

// ============ 项目相关 Hooks ============

export function useOrganizationProjects(organizationId: string | null) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (organizationId) {
      loadProjects()
    }
  }, [organizationId])

  const loadProjects = async () => {
    if (!organizationId) return

    setLoading(true)
    const result = await getOrganizationProjects(organizationId)
    if (result.error) {
      setError(result.error)
    } else {
      setProjects(result.data || [])
    }
    setLoading(false)
  }

  return { projects, loading, error, reload: loadProjects }
}

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    if (!projectId) return

    setLoading(true)
    const result = await getProjectById(projectId)
    if (result.error) {
      setError(result.error)
    } else {
      setProject(result.data || null)
    }
    setLoading(false)
  }

  return { project, loading, error, reload: loadProject }
}

// ============ 任务相关 Hooks ============

export function useProjectTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadTasks()
    }
  }, [projectId])

  const loadTasks = async () => {
    if (!projectId) return

    setLoading(true)
    const result = await getProjectTasks(projectId)
    if (result.error) {
      setError(result.error)
    } else {
      setTasks(result.data || [])
    }
    setLoading(false)
  }

  return { tasks, loading, error, reload: loadTasks }
}

export function useProjectMembers(projectId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadMembers()
    }
  }, [projectId])

  const loadMembers = async () => {
    if (!projectId) return

    setLoading(true)
    const result = await getProjectMembers(projectId)
    if (result.error) {
      setError(result.error)
    } else {
      setMembers(result.data || [])
    }
    setLoading(false)
  }

  return { members, loading, error, reload: loadMembers }
}

// ============ 通知相关 Hooks ============

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const result = await getMyNotifications()
    if (result.error) {
      setError(result.error)
    } else {
      const data = result.data || []
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
    setLoading(false)
  }

  return { notifications, unreadCount, loading, error, reload: loadNotifications }
}
