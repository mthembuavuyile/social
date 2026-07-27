import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Post } from '../../types';

interface CivicMapProps {
  posts: Post[];
  activePostId: string | null;
  onViewPost: (postId: string) => void;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  posts,
  activePostId,
  onViewPost,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // SVG Pins for color-coding
  const createSvgIcon = (color: string) => {
    return L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" style="display: block;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
        </svg>
      `,
      className: 'custom-leaflet-svg-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -32],
    });
  };

  const statusColors: Record<string, string> = {
    active: '#f4212e', // Red
    approved: '#1d9bf0', // Blue
    in_progress: '#ff9a00', // Orange/Yellow
    resolved: '#00ba7c', // Green
    resolved_complete: '#7856ff', // Purple
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize Map centered around JHB/Pretoria area by default
    const map = L.map(containerRef.current).setView([-26.2041, 28.0473], 11);
    mapRef.current = map;

    // Ensure map tiles load fully if container size was slightly delayed
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Add OpenStreetMap tile layer (Twitter Lights Out theme friendly tile style - CartoDB Dark Matter!)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Style cleanup helper for Leaflet control panel
    const leafletPane = containerRef.current.querySelector('.leaflet-control-attribution');
    if (leafletPane) {
      (leafletPane as HTMLElement).style.color = '#71767b';
      (leafletPane as HTMLElement).style.background = 'rgba(0,0,0,0.5)';
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const bounds: L.LatLngTuple[] = [];

    posts.forEach((post) => {
      if (post.latitude === undefined || post.longitude === undefined || post.latitude === null || post.longitude === null) return;

      const color = statusColors[post.status || 'active'] || '#1d9bf0';
      const icon = createSvgIcon(color);
      const position: L.LatLngExpression = [post.latitude, post.longitude];
      bounds.push([post.latitude, post.longitude]);

      const categoryLabel = post.category ? post.category.replace('_', ' ').toUpperCase() : 'CIVIC ISSUE';
      const bountyText = '';
      
      const statusLabels: Record<string, string> = {
        active: '🔴 Reported',
        approved: '🔵 Approved',
        in_progress: '🛠 In Progress',
        resolved: '🟢 Awaiting Audit',
        resolved_complete: '🟣 Resolved & Closed',
      };
      
      const statusText = statusLabels[post.status || ''] || 'Active';

      const popupHtml = `
        <div style="font-family: var(--font-body); color: #e7e9ea; min-width: 180px; padding: 4px;">
          <h4 style="margin: 0 0 6px 0; font-size: 0.85rem; font-weight: 800; border-bottom: 1px solid #2f3336; padding-bottom: 4px; display: flex; justify-content: space-between;">
            <span>${categoryLabel}</span>
            <span style="font-size: 0.7rem; color: ${color}; font-weight: bold;">${statusText}</span>
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #71767b; line-height: 1.3;">
            ${post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content}
          </p>
          <div style="margin: 0 0 8px 0; font-size: 0.8rem; font-weight: bold; color: #00ba7c;">
            ${bountyText}
          </div>
          <button id="view-post-${post.id}" style="width: 100%; border: none; background: #1d9bf0; color: white; padding: 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem; cursor: pointer; display: block; text-align: center;">
            View in Feed
          </button>
        </div>
      `;

      const marker = L.marker(position, { icon }).addTo(map);
      marker.bindPopup(popupHtml);

      // Bind button click inside popup
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`view-post-${post.id}`);
          if (btn) {
            btn.onclick = () => {
              onViewPost(post.id);
            };
          }
        }, 50);
      });

      markersRef.current[post.id] = marker;
    });

    // Auto fit map bounds if we have pins
    if (bounds.length > 0 && !activePostId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [posts, onViewPost, activePostId]);

  // Center on active post if specified
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activePostId) return;

    const activeMarker = markersRef.current[activePostId];
    if (activeMarker) {
      const pos = activeMarker.getLatLng();
      map.setView(pos, 15, { animate: true });
      activeMarker.openPopup();
    }
  }, [activePostId]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#16181c' }} />
      
      {/* Empty State Overlay */}
      {posts.length > 0 && posts.filter(p => p.latitude != null && p.longitude != null).length === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '16px 24px', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-main)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>No Geolocated Reports</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Posts in this view don't have GPS coordinates attached.</p>
          </div>
        </div>
      )}

      {/* Visual Legend */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(22, 24, 28, 0.9)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        zIndex: 1000,
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        color: 'var(--text-main)',
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)'
      }}>
        <strong style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '2px', display: 'block' }}>Map Pins Legend</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f4212e' }} />
          <span>Reported / Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9a00' }} />
          <span>Repair In Progress</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ba7c' }} />
          <span>Resolved / Audit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7856ff' }} />
          <span>Fully Completed</span>
        </div>
      </div>
    </div>
  );
};
