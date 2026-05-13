/**
 * useChat — real-time chat hook via WebSocket.
 *
 * Opens a WebSocket to /ws/chat. Manages:
 *   - conversations list (loaded via REST on mount, updated on WS events)
 *   - active conversation messages
 *   - sending messages
 *   - marking as read
 *   - reconnection with exponential back-off
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/axios';

const WS_BASE = import.meta.env.VITE_WS_URL
  ?? (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/^http/, 'ws');

const MAX_RECONNECT_DELAY = 30_000;

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState({}); // { [convId]: Message[] }
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const unmounted = useRef(false);

  const token = useAuthStore((s) => s.accessToken);
  const schoolId = useAuthStore((s) => s.schoolId);
  const memberId = useAuthStore((s) => s.memberId) ?? '';
  const user = useAuthStore((s) => s.user);

  // ── Load conversations via REST ───────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token || !schoolId) return;
    try {
      const { data } = await api.get('/api/chat/conversations');
      setConversations(data);
    } catch { /* silent */ }
  }, [token, schoolId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages for a conversation ─────────────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/chat/conversations/${convId}/messages`);
      setMessages((prev) => ({ ...prev, [convId]: data.messages }));
      // Mark as read in local state
      setConversations((prev) =>
        prev.map((c) => c.id === convId ? { ...c, unreadCount: 0 } : c),
      );
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!token || !schoolId || !memberId || unmounted.current) return;

    const url = `${WS_BASE}/ws/chat?token=${encodeURIComponent(token)}&schoolId=${encodeURIComponent(schoolId)}&memberId=${encodeURIComponent(memberId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) { ws.close(); return; }
      setConnected(true);
      reconnectDelay.current = 1000;

      // Rejoin active conversation if any
      if (activeConvId) {
        ws.send(JSON.stringify({ type: 'join_conversation', conversationId: activeConvId }));
      }

      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 25_000);
    };

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.event === 'chat_message') {
        const m = msg.data;
        setMessages((prev) => ({
          ...prev,
          [m.conversationId]: [...(prev[m.conversationId] ?? []), m],
        }));
        // Update conversation list preview + unread
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== m.conversationId) return c;
            const isActive = m.conversationId === activeConvId;
            return {
              ...c,
              lastMessage: { body: m.body, createdAt: m.createdAt, senderMemberId: m.senderMemberId },
              lastMessageAt: m.createdAt,
              unreadCount: isActive ? 0 : (c.unreadCount ?? 0) + 1,
            };
          }),
        );
        return;
      }

      if (msg.event === 'chat_read') {
        const { conversationId } = msg.data;
        setConversations((prev) =>
          prev.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c),
        );
        return;
      }
    };

    ws.onclose = () => {
      clearInterval(pingTimer.current);
      setConnected(false);
      if (unmounted.current) return;
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => ws.close();
  }, [token, schoolId, memberId, activeConvId]);

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

  const joinConversation = useCallback((convId) => {
    setActiveConvId(convId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_conversation', conversationId: convId }));
    }
    if (!messages[convId]) loadMessages(convId);
  }, [messages, loadMessages]);

  const leaveConversation = useCallback((convId) => {
    setActiveConvId(null);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_conversation', conversationId: convId }));
    }
  }, []);

  const sendMessage = useCallback((convId, body) => {
    if (!body?.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'send_message', conversationId: convId, body: body.trim() }));
    } else {
      // REST fallback — not implemented yet, WS should always be up
      console.warn('[Chat] WS not connected, message dropped');
    }
  }, []);

  const startConversation = useCallback(async (otherMemberId) => {
    const { data } = await api.post('/api/chat/conversations', { otherMemberId });
    setConversations((prev) => {
      if (prev.find((c) => c.id === data.id)) return prev;
      return [{ ...data, unreadCount: 0, lastMessage: null }, ...prev];
    });
    return data;
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return {
    conversations,
    messages,
    activeConvId,
    connected,
    loading,
    totalUnread,
    joinConversation,
    leaveConversation,
    sendMessage,
    startConversation,
    loadConversations,
  };
}
