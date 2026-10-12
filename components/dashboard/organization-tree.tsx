'use client'

import { useMemo, useState } from 'react'
import { Building2, ChevronDown, ChevronRight, CornerDownRight, Search } from 'lucide-react'
import { Panel } from './panel'
import { Input } from '@/components/ui/input'
import { formatDate, type Organization } from '@/lib/dashboard-data'

type Row = { org: Organization; depth: number; parent?: Organization; createdCount: number }

function flatten(organizations: Organization[]): Row[] {
  const rows: Row[] = []
  const visit = (org: Organization, depth: number, parent?: Organization) => {
    const children = organizations.filter((item) => item.parentId === org.id)
    rows.push({ org, depth, parent, createdCount: children.length })
    children.forEach((child) => visit(child, depth + 1, org))
  }
  organizations.filter((org) => org.parentId === null).forEach((root) => visit(root, 0))
  return rows
}

export function OrganizationTree({
  organizations,
  totalMembers,
}: {
  organizations: Organization[]
  totalMembers: number
}) {
  const [search, setSearch] = useState('')
  const [isSchlienzExpanded, setIsSchlienzExpanded] = useState(true)
  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    const matchingIds = new Set(
      organizations
        .filter((org) => org.name.toLocaleLowerCase().includes(query))
        .map((org) => org.id),
    )
    const visibleIds = new Set(matchingIds)
    matchingIds.forEach((id) => {
      let parent = organizations.find((item) => item.id === id)?.parentId
      while (parent) {
        visibleIds.add(parent)
        parent = organizations.find((item) => item.id === parent)?.parentId
      }
    })
    const visibleOrganizations = query
      ? organizations.filter((org) => visibleIds.has(org.id))
      : organizations
    const shouldShowChildren = isSchlienzExpanded || query.length > 0
    const visibleRows = flatten(visibleOrganizations)
    return visibleRows.filter(({ org }) => {
      if (org.parentId !== 'schlienz-group') return true
      return shouldShowChildren
    })
  }, [organizations, search, isSchlienzExpanded])

  return (
    <Panel title="Organisationsstruktur" description="Organisationen, Zuständigkeiten und Mitglieder im Überblick">
      <div>
        <div className="p-4 sm:p-5">
          <label className="relative block">
            <span className="sr-only">Organisationen durchsuchen</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Organisationen durchsuchen"
              className="h-10 pl-9"
            />
          </label>
        </div>
        <table className="w-full table-fixed text-[10px] sm:text-xs lg:text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[25%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead>
            <tr className="border-y border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">Organisation</th>
              <th scope="col" className="break-words px-1 py-2 sm:px-2 sm:py-3">Übergeordnet</th>
              <th scope="col" className="break-words px-1 py-2 text-center sm:px-2 sm:py-3">Unterbereiche</th>
              <th scope="col" className="break-words px-1 py-2 text-right sm:px-2 sm:py-3">Mitglieder</th>
              <th scope="col" className="break-words px-1 py-2 text-right sm:px-2 sm:py-3">Seit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ org, depth, parent, createdCount }) => (
              <tr
                key={org.id}
                className={`border-b border-border last:border-0 transition-colors hover:bg-muted/50 ${
                  org.id === 'schlienz-group' ? 'bg-muted/40' : ''
                }`}
              >
                <td className="break-words px-1 py-2 sm:px-2 sm:py-3">
                  <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.25}rem` }}>
                    {org.id === 'schlienz-group' ? (
                      <button
                        type="button"
                        onClick={() => setIsSchlienzExpanded((expanded) => !expanded)}
                        aria-expanded={isSchlienzExpanded || search.trim().length > 0}
                        aria-label={`${isSchlienzExpanded ? 'Schlienz-Gruppe einklappen' : 'Schlienz-Gruppe ausklappen'}`}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {isSchlienzExpanded || search.trim().length > 0 ? (
                          <ChevronDown className="size-4" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    ) : depth > 0 ? (
                      <CornerDownRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <Building2 className="size-3.5" aria-hidden="true" />
                      </span>
                    )}
                    <span className={`break-words ${org.id === 'schlienz-group' || depth === 0 ? 'font-semibold' : 'font-medium'}`}>{org.name}</span>
                  </div>
                </td>
                <td className="break-words px-1 py-2 text-muted-foreground sm:px-2 sm:py-3">{parent?.name ?? '—'}</td>
                <td className="px-1 py-2 text-center sm:px-2 sm:py-3">
                  <span
                    className={`inline-flex min-w-8 justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      createdCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {createdCount}
                  </span>
                </td>
                <td className="px-1 py-2 text-right tabular-nums sm:px-2 sm:py-3">
                  {org.id === 'z-part-group' ? totalMembers : org.members ?? '—'}
                </td>
                <td className="break-words px-1 py-2 text-right tabular-nums text-muted-foreground sm:px-2 sm:py-3">
                  {org.createdAt ? formatDate(org.createdAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
