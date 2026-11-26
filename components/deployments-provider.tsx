'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CreateDeploymentDialog, type NewDeploymentInput } from '@/components/dashboard/create-deployment-dialog'
import { initialDeployments, careProviders, reports as initialReports, type Deployment, type Report } from '@/lib/dashboard-data'

type DeploymentsContextValue = {
  deployments: Deployment[]
  reports: Report[]
  deletedReports: Report[]
  addReport: (report: Omit<Report, 'id'>) => void
  deleteReport: (report: Report) => void
  openCreateDeployment: () => void
  openEditDeployment: (id: string) => void
  deleteDeployment: (id: string) => void
  markDeploymentCompleted: (id: string) => void
}

const DeploymentsContext = createContext<DeploymentsContextValue | null>(null)

function toLocalIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function DeploymentsProvider({ children }: { children: React.ReactNode }) {
  const [deployments, setDeployments] = useState<Deployment[]>(initialDeployments)
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [deletedReports, setDeletedReports] = useState<Report[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null)

  const openCreateDeployment = useCallback(() => {
    setEditingDeployment(null)
    setCreateOpen(true)
  }, [])

  const openEditDeployment = useCallback(
    (id: string) => {
      const deployment = deployments.find((item) => item.id === id)
      if (!deployment) throw new Error(`Cannot edit missing deployment: ${id}`)
      setEditingDeployment(deployment)
      setCreateOpen(true)
    },
    [deployments],
  )

  const createDeployment = useCallback((input: NewDeploymentInput) => {
    const id = crypto.randomUUID()
    setDeployments((current) => [
      {
        ...input,
        id,
        location: input.city,
        createdAt: toLocalIso(new Date()),
        createdBy: 'A. Berger',
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

  const updateDeployment = useCallback((id: string, patch: Partial<Deployment>) => {
    setDeployments((current) => current.map((deployment) => (deployment.id === id ? { ...deployment, ...patch } : deployment)))
  }, [])

  const deleteDeployment = useCallback((id: string) => {
    setDeployments((current) => current.filter((deployment) => deployment.id !== id))
  }, [])

  const markDeploymentCompleted = useCallback((id: string) => {
    setDeployments((current) =>
      current.map((deployment) => (deployment.id === id ? { ...deployment, status: 'completed' } : deployment)),
    )
  }, [])

  const value = useMemo(
    () => ({ deployments, reports, deletedReports, addReport, deleteReport, openCreateDeployment, openEditDeployment, deleteDeployment, markDeploymentCompleted }),
    [deployments, reports, deletedReports, addReport, deleteReport, openCreateDeployment, openEditDeployment, deleteDeployment, markDeploymentCompleted],
  )

  return (
    <DeploymentsContext.Provider value={value}>
      {children}
      <CreateDeploymentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        careProviders={careProviders}
        onCreate={createDeployment}
        onUpdate={updateDeployment}
        editingDeployment={editingDeployment}
      />
    </DeploymentsContext.Provider>
  )
}

export function useDeployments() {
  const context = useContext(DeploymentsContext)
  if (!context) throw new Error('useDeployments must be used within DeploymentsProvider')
  return context
}
