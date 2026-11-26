'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { Language } from '@/components/app-shell'
import { Panel } from './panel'
import type { Deployment } from '@/lib/dashboard-data'

function hasCoordinates(
  deployment: Deployment,
): deployment is Deployment & { latitude: number; longitude: number } {
  return (
    typeof deployment.latitude === 'number' &&
    Number.isFinite(deployment.latitude) &&
    deployment.latitude >= -90 &&
    deployment.latitude <= 90 &&
    typeof deployment.longitude === 'number' &&
    Number.isFinite(deployment.longitude) &&
    deployment.longitude >= -180 &&
    deployment.longitude <= 180
  )
}

export function DeploymentLocationMap({
  deployments,
  language = 'de',
}: {
  deployments: Deployment[]
  language?: Language
}) {
  const mapElement = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState(false)
  const locatedDeployments = deployments.filter(hasCoordinates)

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

        const markers = locatedDeployments.map((deployment) => {
          const marker = leaflet.marker([deployment.latitude, deployment.longitude], {
            title: `${deployment.name} — ${deployment.location}`,
            alt: `${deployment.name}, ${deployment.location}`,
            icon: leaflet.divIcon({
              className: 'deployment-location-marker',
              html: '<span class="deployment-location-pin"></span>',
              iconSize: [28, 28],
              iconAnchor: [14, 26],
            }),
          })

          const link = document.createElement('a')
          link.href = `/deployments/details/${encodeURIComponent(deployment.id)}`
          link.className = 'deployment-map-popup-link'
          link.textContent = `${deployment.name} — ${deployment.location}`
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
        console.error('Unable to load the deployment location map.', error)
        setMapError(true)
      })

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      map?.remove()
    }
  }, [locatedDeployments])

  const isEnglish = language === 'en'

  return (
    <Panel
      title={isEnglish ? 'Deployment locations' : 'Bereitstellungsstandorte'}
      description={
        isEnglish
          ? 'Select a marker to open deployment details.'
          : 'Wählen Sie einen Marker, um die Bereitstellungsdetails zu öffnen.'
      }
      action={
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
          {locatedDeployments.length}
        </span>
      }
      className="relative z-0 isolate h-full overflow-hidden"
    >
      <div
        ref={mapElement}
        role="region"
        aria-label={isEnglish ? 'Map of deployment locations' : 'Karte der Bereitstellungsstandorte'}
        className="deployment-location-map mx-4 mb-4 aspect-[7/5] overflow-hidden rounded-xl border border-border bg-muted sm:mx-5"
      />
      {mapError && (
        <p className="px-5 pb-5 text-sm text-destructive" role="alert">
          {isEnglish ? 'The deployment map could not be loaded.' : 'Die Bereitstellungskarte konnte nicht geladen werden.'}
        </p>
      )}
    </Panel>
  )
}
