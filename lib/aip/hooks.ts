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
    // 先尝试从缓存加载
    const cached = localStorage.getItem('organizations')
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        // 如果缓存在5分钟内，直接使用
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setOrganizations(data)
          setLoading(false)
        }
      } catch (e) {
        console.error('缓存解析失败:', e)
      }
    }

    // 然后异步加载最新数据
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    setLoading(true)

    // 先快速获取组织列表
    const result = await getMyOrganizations()

    if (result.error) {
      setError(result.error)
    } else {
      const orgs = result.data || []
      setOrganizations(orgs)

      // 保存到缓存
      localStorage.setItem('organizations', JSON.stringify({
        data: orgs,
        timestamp: Date.now()
      }))

      // 如果没有组织，才初始化默认组织
      if (!result.data || result.data.length === 0) {
        try {
          await fetch('/api/aip/init-default-orgs', { method: 'POST' })

          // 重新加载组织列表
          const retryResult = await getMyOrganizations()

          if (retryResult.data) {
            setOrganizations(retryResult.data)
          }
        } catch (initError) {
          console.error('初始化默认组织失败:', initError)
        }
      }
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
