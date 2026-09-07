import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Centre par défaut : Bujumbura
export const CENTRE_BUJUMBURA = [-3.3822, 29.3644]

const TUILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function marqueurNoir() {
  return L.divIcon({
    className: '',
    html: '<span class="marqueur"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 24],
    popupAnchor: [0, -22],
  })
}

/**
 * Carte des résultats de recherche.
 * salons : [{ id, name, slug, quartier, ville, lat, lng }]
 */
export function CarteSalons({ salons }) {
  const divRef = useRef(null)
  const mapRef = useRef(null)
  const calqueRef = useRef(null)

  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const map = L.map(divRef.current, { scrollWheelZoom: true })
    map.setView(CENTRE_BUJUMBURA, 13)
    L.tileLayer(TUILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map)
    mapRef.current = map
    calqueRef.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      calqueRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const calque = calqueRef.current
    if (!map || !calque) return
    calque.clearLayers()

    const places = salons.filter((s) => s.lat != null && s.lng != null)
    places.forEach((s) => {
      const m = L.marker([s.lat, s.lng], { icon: marqueurNoir() }).addTo(calque)
      m.bindPopup(
        `<div class="popup-salon">
           <strong>${s.name}</strong><br/>
           <span>${[s.quartier, s.ville].filter(Boolean).join(', ')}</span><br/>
           <a href="/s/${s.slug}">Prendre RDV</a>
         </div>`
      )
    })

    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((s) => [s.lat, s.lng]))
      map.fitBounds(bounds.pad(0.25), { maxZoom: 15 })
    } else {
      map.setView(CENTRE_BUJUMBURA, 13)
    }
  }, [salons])

  return <div ref={divRef} className="carte-osm" />
}

/**
 * Mini-carte de l'espace pro : cliquer place le marqueur du salon.
 */
export function CartePosition({ lat, lng, onChange }) {
  const divRef = useRef(null)
  const mapRef = useRef(null)
  const marqueurRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const centre = lat != null && lng != null ? [lat, lng] : CENTRE_BUJUMBURA
    const map = L.map(divRef.current).setView(centre, lat != null ? 15 : 13)
    L.tileLayer(TUILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map)

    if (lat != null && lng != null) {
      marqueurRef.current = L.marker([lat, lng], { icon: marqueurNoir() }).addTo(map)
    }

    map.on('click', (e) => {
      const { lat: la, lng: ln } = e.latlng
      if (marqueurRef.current) {
        marqueurRef.current.setLatLng([la, ln])
      } else {
        marqueurRef.current = L.marker([la, ln], { icon: marqueurNoir() }).addTo(map)
      }
      onChangeRef.current?.(la, ln)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      marqueurRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Suit les coordonnées venant de l'extérieur (recherche d'adresse, GPS)
  useEffect(() => {
    const map = mapRef.current
    if (!map || lat == null || lng == null) return
    if (marqueurRef.current) {
      marqueurRef.current.setLatLng([lat, lng])
    } else {
      marqueurRef.current = L.marker([lat, lng], { icon: marqueurNoir() }).addTo(map)
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 16))
  }, [lat, lng])

  return <div ref={divRef} className="carte-osm carte-position" />
}
