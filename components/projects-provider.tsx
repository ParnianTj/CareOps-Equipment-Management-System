'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CreateProjectDialog, type NewProjectInput } from '@/components/dashboard/create-project-dialog'
import { initialProjects, organizations, reports as initialReports, type Project, type Report } from '@/lib/dashboard-data'

type ProjectsContextValue = {
  projects: Project[]
  reports: Report[]
  deletedReports: Report[]
  addReport: (report: Omit<Report, 'id'>) => void
  deleteReport: (report: Report) => void
  openCreateProject: () => void
  openEditProject: (id: string) => void
  deleteProject: (id: string) => void
  markProjectCompleted: (id: string) => void
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

function toLocalIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [deletedReports, setDeletedReports] = useState<Report[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const openCreateProject = useCallback(() => {
    setEditingProject(null)
    setCreateOpen(true)
  }, [])

  const openEditProject = useCallback(
    (id: string) => {
      const project = projects.find((item) => item.id === id)
      if (!project) throw new Error(`Cannot edit missing project: ${id}`)
      setEditingProject(project)
      setCreateOpen(true)
    },
    [projects],
  )

  const createProject = useCallback((input: NewProjectInput) => {
    const id = crypto.randomUUID()
    setProjects((current) => [
      {
        ...input,
        id,
        location: input.city,
        createdAt: toLocalIso(new Date()),
        createdBy: 'D. Züger',
        status: 'created',
      },
      ...current,
    ])
    return id
  }, [])

  const addReport = useCallback((report: Omit<Report, 'id'>) => {
    setReports((current) => [{ ...report, id: crypto.randomUUID() }, ...current])
  }, [])

  const deleteReport = useCallback((report: Report) => {
    setReports((current) => current.filter((item) => item.id !== report.id))
    setDeletedReports((current) =>
      current.some((item) => item.id === report.id) ? current : [...current, report],
    )
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects((current) => current.map((project) => (project.id === id ? { ...project, ...patch } : project)))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((current) => current.filter((project) => project.id !== id))
  }, [])

  const markProjectCompleted = useCallback((id: string) => {
    setProjects((current) =>
      current.map((project) => (project.id === id ? { ...project, status: 'completed' } : project)),
    )
  }, [])

  const value = useMemo(
    () => ({ projects, reports, deletedReports, addReport, deleteReport, openCreateProject, openEditProject, deleteProject, markProjectCompleted }),
    [projects, reports, deletedReports, addReport, deleteReport, openCreateProject, openEditProject, deleteProject, markProjectCompleted],
  )

  return (
    <ProjectsContext.Provider value={value}>
      {children}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizations={organizations}
        onCreate={createProject}
        onUpdate={updateProject}
        editingProject={editingProject}
      />
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (!context) throw new Error('useProjects must be used within ProjectsProvider')
  return context
}
