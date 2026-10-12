'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { Language } from '@/components/app-shell'
import { Panel } from './panel'
import type { Project } from '@/lib/dashboard-data'

function hasCoordinates(
  project: Project,
): project is Project & { latitude: number; longitude: number } {
  return (
    typeof project.latitude === 'number' &&
    Number.isFinite(project.latitude) &&
    project.latitude >= -90 &&
    project.latitude <= 90 &&
    typeof project.longitude === 'number' &&
    Number.isFinite(project.longitude) &&
    project.longitude >= -180 &&
    project.longitude <= 180
  )
}

export function ProjectLocationMap({
  projects,
  language = 'de',
}: {
  projects: Project[]
  language?: Language
}) {
  const mapElement = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState(false)
  const locatedProjects = projects.filter(hasCoordinates)

  useEffect(() => {
    const element = mapElement.current
    if (!element) return

    let map: LeafletMap | undefined
    let disposed = false
    let resizeObserver: ResizeObserver | undefined

    import('leaflet')
      .then((leaflet) => {
        if (disposed) return

        const currentMap = leaflet.map(element, {
          scrollWheelZoom: false,
          zoomControl: true,
        })
        map = currentMap

        leaflet
          .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .addTo(map)

        const markers = locatedProjects.map((project) => {
          const marker = leaflet.marker([project.latitude, project.longitude], {
            title: `${project.name} — ${project.location}`,
            alt: `${project.name}, ${project.location}`,
            icon: leaflet.divIcon({
              className: 'project-location-marker',
              html: '<span class="project-location-pin"></span>',
              iconSize: [28, 28],
              iconAnchor: [14, 26],
            }),
          })

          const link = document.createElement('a')
          link.href = `/projekte/details/${encodeURIComponent(project.id)}`
          link.className = 'project-map-popup-link'
          link.textContent = `${project.name} — ${project.location}`
          marker.bindPopup(link)
          marker.addTo(currentMap)
          return marker
        })

        if (markers.length > 1) {
          currentMap.fitBounds(leaflet.featureGroup(markers).getBounds(), { padding: [28, 28] })
        } else if (markers.length === 1) {
          currentMap.setView(markers[0].getLatLng(), 7)
        } else {
          currentMap.setView([50.5, 10.5], 5)
        }

        resizeObserver = new ResizeObserver(() => currentMap.invalidateSize())
        resizeObserver.observe(element)
      })
      .catch((error: unknown) => {
        console.error('Unable to load the project location map.', error)
        setMapError(true)
      })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      map?.remove()
    }
  }, [locatedProjects])

  const isEnglish = language === 'en'

  return (
    <Panel
      title={isEnglish ? 'Project locations' : 'Projektstandorte'}
      description={
        isEnglish
          ? 'Select a marker to open project details.'
          : 'Wählen Sie einen Marker, um die Projektdetails zu öffnen.'
      }
      action={
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
          {locatedProjects.length}
        </span>
      }
      className="relative z-0 isolate h-full overflow-hidden"
    >
      <div
        ref={mapElement}
        role="region"
        aria-label={isEnglish ? 'Map of project locations' : 'Karte der Projektstandorte'}
        className="project-location-map mx-4 mb-4 aspect-[7/5] overflow-hidden rounded-xl border border-border bg-muted sm:mx-5"
      />
      {mapError && (
        <p className="px-5 pb-5 text-sm text-destructive" role="alert">
          {isEnglish ? 'The project map could not be loaded.' : 'Die Projektkarte konnte nicht geladen werden.'}
        </p>
      )}
    </Panel>
  )
}
