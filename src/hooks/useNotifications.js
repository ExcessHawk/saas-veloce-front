/**
 * useNotifications — real-time notification hook via WebSocket.
 *
 * Opens a WebSocket connection to /ws/notifications with the JWT token and
 * schoolId as query params. Handles:
 *   - Initial payload (event: 'init') → sets notifications + unreadCount
 *   - New notification (event: 'notification') → prepends to list, bumps count
 *   - Read ack (event: 'notifications_read') → marks items as read in local state
 *   - Automatic reconnection with exponential back-off (max 30s)
 *   - Ping/pong keepalive every 25s to prevent proxy timeouts
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/axios';

const WS_BASE = import.meta.env.VITE_WS_URL
  ?? (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/^http/, 'ws');

const MAX_RECONNECT_DELAY = 30_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const unmounted = useRef(false);

  const token = useAuthStore((s) => s.accessToken);
  const schoolId = useAuthStore((s) => s.schoolId);

  // ── REST fallback: load initial data before WS connects ──────────────────
  useEffect(() => {
    if (!token || !schoolId) return;
    api.get('/api/notifications')
      .then(({ data }) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => { /* silent — WS will provide data */ });
  }, [token, schoolId]);

  // ── WebSocket connection ──────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!token || !schoolId || unmounted.current) return;

    const url = `${WS_BASE}/ws/notifications?token=${encodeURIComponent(token)}&schoolId=${encodeURIComponent(schoolId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) { ws.close(); return; }
      setConnected(true);
      reconnectDelay.current = 1000;

      // Keepalive ping every 25s
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25_000);
    };

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.event === 'init') {
        setNotifications(msg.data.notifications ?? []);
        setUnreadCount(msg.data.unreadCount ?? 0);
        return;
      }

      if (msg.event === 'notification') {
        setNotifications((prev) => [msg.data, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
        return;
      }

      if (msg.event === 'notifications_read') {
        if (msg.data.all) {
          setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
          setUnreadCount(0);
        } else if (Array.isArray(msg.data.ids)) {
          const ids = new Set(msg.data.ids);
          setNotifications((prev) =>
            prev.map((n) => ids.has(n.id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n),
          );
          setUnreadCount((c) => Math.max(0, c - msg.data.ids.length));
        }
        return;
      }
    };

    ws.onclose = () => {
      clearInterval(pingTimer.current);
      setConnected(false);
      if (unmounted.current) return;
      // Reconnect with back-off
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, schoolId]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = useCallback((ids) => {
    if (!ids?.length) return;
    // Optimistic update
    const idSet = new Set(ids);
    setNotifications((prev) =>
      prev.map((n) => idSet.has(n.id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n),
    );
    setUnreadCount((c) => Math.max(0, c - ids.filter((id) => notifications.find((n) => n.id === id && !n.readAt)).length));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read', ids }));
    } else {
      api.patch('/api/notifications/read', { ids }).catch(() => {});
    }
  }, [notifications]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_all_read' }));
    } else {
      api.patch('/api/notifications/read-all').catch(() => {});
    }
  }, []);

  return { notifications, unreadCount, connected, markRead, markAllRead };
}
