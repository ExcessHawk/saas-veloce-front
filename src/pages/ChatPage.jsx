import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useChat } from '@/hooks/useChat';
import { useMembers } from '@/hooks/useMembers';
import { avatarColor, getInitials } from '@/lib/materia-colors';
import { cn } from '@/lib/utils';
import { Send, MessageSquare, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

/* ── helpers ── */
function fmtTime(iso) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ayer';
  return format(d, 'dd MMM', { locale: es });
}

function fmtDay(iso) {
  const d = new Date(iso);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}

/* ── Avatar ── */
function Av({ name, size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 text-[11px]"
      style={{ width: size, height: size, background: avatarColor(name || '') }}
    >
      {getInitials(name || '?')}
    </div>
  );
}

/* ── Conversation list item ── */
function ConvItem({ conv, isActive, onClick, myMemberId }) {
  const other = conv.otherMember;
  const name = other?.fullName ?? other?.email ?? 'Usuario';
  const preview = conv.lastMessage?.body ?? 'Sin mensajes';
  const time = conv.lastMessageAt ? fmtTime(conv.lastMessageAt) : '';
  const unread = conv.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-[13px] border-none cursor-pointer font-[inherit] text-left transition-colors duration-[80ms]',
        isActive ? 'bg-p-bg-subtle' : 'bg-transparent hover:bg-p-bg-subtle',
      )}
    >
      <div className="relative shrink-0">
        <Av name={name} size={40} />
        {unread > 0 && (
          <span className="absolute -top-[2px] -right-[2px] min-w-[16px] h-[16px] px-[3px] rounded-full bg-p-accent text-p-accent-text text-[9px] font-bold flex items-center justify-center border-[1.5px] border-p-bg-base">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-[13.5px] truncate', unread > 0 ? 'font-bold text-p-text-primary' : 'font-medium text-p-text-primary')}>
            {name}
          </span>
          {time && <span className="text-[11px] text-p-text-tertiary shrink-0">{time}</span>}
        </div>
        <div className={cn('text-[12.5px] truncate mt-[1px]', unread > 0 ? 'font-medium text-p-text-secondary' : 'text-p-text-tertiary')}>
          {preview}
        </div>
      </div>
    </button>
  );
}

/* ── Message bubble ── */
function Bubble({ msg, isMine, showDay, dayLabel }) {
  return (
    <>
      {showDay && (
        <div className="flex justify-center my-3">
          <span className="px-3 py-[3px] rounded-full text-[11px] text-p-text-tertiary bg-p-bg-subtle border border-p-border">
            {dayLabel}
          </span>
        </div>
      )}
      <div className={cn('flex gap-2 mb-[6px]', isMine ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[72%] px-[14px] py-[9px] rounded-2xl text-[13.5px] leading-[1.55] break-words',
            isMine
              ? 'bg-p-accent text-p-accent-text rounded-br-[4px]'
              : 'bg-p-bg-subtle text-p-text-primary rounded-bl-[4px] border border-p-border',
          )}
        >
          {msg.body}
          <div className={cn('text-[10px] mt-[4px] text-right', isMine ? 'text-p-accent-text/60' : 'text-p-text-tertiary')}>
            {format(new Date(msg.createdAt), 'HH:mm')}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── New conversation modal ── */
function NewConvModal({ members, myMemberId, onStart, onClose }) {
  const [search, setSearch] = useState('');
  const eligible = members.filter((m) =>
    m.id !== myMemberId &&
    ['teacher', 'director', 'parent'].includes(m.role) &&
    (m.fullName || m.email || '').toLowerCase().includes(search.toLowerCase()),
  );

  const ROLE_LABEL = { teacher: 'Docente', director: 'Director', parent: 'Padre/Madre', student: 'Estudiante' };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[200] bg-[oklch(0%_0_0/0.45)] backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] bg-p-bg-base border border-p-border rounded-2xl shadow-p-lg overflow-hidden [animation:dropIn_0.15s_ease]"
      >
        <div className="px-5 py-4 border-b border-p-border">
          <div className="text-[14px] font-bold text-p-text-primary mb-3">Nueva conversación</div>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar miembro…"
            className="w-full px-3 py-[8px] rounded-[10px] border border-p-border bg-p-bg-subtle text-[13.5px] text-p-text-primary outline-none focus:border-p-border-strong"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto py-1">
          {eligible.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-p-text-tertiary">Sin resultados</div>
          ) : (
            eligible.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onStart(m.id)}
                className="w-full flex items-center gap-3 px-5 py-[11px] border-none bg-transparent cursor-pointer hover:bg-p-bg-subtle transition-colors"
              >
                <Av name={m.fullName || m.email} size={36} />
                <div className="flex-1 text-left">
                  <div className="text-[13.5px] font-medium text-p-text-primary">{m.fullName || m.email}</div>
                  <div className="text-[12px] text-p-text-tertiary">{ROLE_LABEL[m.role] ?? m.role}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ Page ══ */
export default function ChatPage() {
  const { convId: routeConvId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const myMemberId = useAuthStore((s) => s.memberId) ?? '';

  const {
    conversations, messages, activeConvId, connected, loading,
    joinConversation, leaveConversation, sendMessage, startConversation,
  } = useChat();

  const { data: allMembers = [] } = useMembers();

  const [input, setInput] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Join conversation from URL param
  useEffect(() => {
    if (routeConvId && routeConvId !== activeConvId) {
      joinConversation(routeConvId);
    }
  }, [routeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[activeConvId]?.length]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherName = activeConv?.otherMember?.fullName ?? activeConv?.otherMember?.email ?? 'Usuario';
  const activeMessages = messages[activeConvId] ?? [];

  const handleSend = () => {
    if (!input.trim() || !activeConvId) return;
    sendMessage(activeConvId, input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSelectConv = (convId) => {
    if (activeConvId) leaveConversation(activeConvId);
    joinConversation(convId);
    navigate(`/dashboard/chat/${convId}`, { replace: true });
    setMobileSidebarOpen(false);
  };

  const handleStartConv = async (otherMemberId) => {
    setShowNewConv(false);
    const conv = await startConversation(otherMemberId);
    handleSelectConv(conv.id);
  };

  // Group messages by day for separators
  const groupedMessages = [];
  let lastDay = null;
  for (const msg of activeMessages) {
    const day = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    const showDay = day !== lastDay;
    lastDay = day;
    groupedMessages.push({ msg, showDay, dayLabel: fmtDay(msg.createdAt) });
  }

  return (
    <div className="max-w-[1100px] mx-auto h-[calc(100vh-54px-48px)] flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] font-semibold text-p-text-primary tracking-[-0.03em] m-0">Chat</h1>
          <p className="text-[13px] text-p-text-secondary m-0">Mensajes directos con miembros de la institución</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-[6px] text-[12px]', connected ? 'text-p-s-700' : 'text-p-text-tertiary')}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'En línea' : 'Reconectando…'}
          </div>
          <button
            type="button"
            onClick={() => setShowNewConv(true)}
            className="inline-flex items-center gap-[6px] px-[14px] py-[7px] rounded-[10px] bg-p-accent text-p-accent-text text-[13px] font-semibold border-none cursor-pointer"
          >
            <MessageSquare size={13} />
            Nuevo chat
          </button>
        </div>
      </div>

      {/* Chat layout */}
      <div className="flex-1 flex bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm overflow-hidden min-h-0">

        {/* Sidebar — conversation list */}
        <div className={cn(
          'w-[280px] shrink-0 border-r border-p-border flex flex-col',
          'max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:bg-p-bg-base max-md:shadow-p-lg',
          mobileSidebarOpen ? 'max-md:flex' : 'max-md:hidden',
        )}>
          <div className="px-4 py-3 border-b border-p-border">
            <div className="text-[12px] font-semibold text-p-text-tertiary uppercase tracking-[0.06em]">
              Conversaciones
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <MessageSquare size={28} className="text-p-text-tertiary mx-auto mb-2 opacity-40" />
                <div className="text-[13px] text-p-text-tertiary">Sin conversaciones</div>
                <button
                  type="button"
                  onClick={() => setShowNewConv(true)}
                  className="mt-3 text-[12.5px] text-p-accent border-none bg-transparent cursor-pointer"
                >
                  Iniciar una
                </button>
              </div>
            ) : (
              conversations
                .slice()
                .sort((a, b) => new Date(b.lastMessageAt ?? b.createdAt) - new Date(a.lastMessageAt ?? a.createdAt))
                .map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeConvId}
                    myMemberId={myMemberId}
                    onClick={() => handleSelectConv(conv.id)}
                  />
                ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <MessageSquare size={40} className="text-p-text-tertiary opacity-30" />
              <div className="text-[15px] font-semibold text-p-text-primary">Selecciona una conversación</div>
              <div className="text-[13px] text-p-text-secondary">O inicia una nueva con un docente o padre</div>
              <button
                type="button"
                onClick={() => setShowNewConv(true)}
                className="mt-1 inline-flex items-center gap-[6px] px-[14px] py-[7px] rounded-[10px] bg-p-accent text-p-accent-text text-[13px] font-semibold border-none cursor-pointer"
              >
                <MessageSquare size={13} />
                Nuevo chat
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-[13px] border-b border-p-border flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden border-none bg-transparent cursor-pointer text-p-text-secondary flex p-1"
                >
                  <ArrowLeft size={16} />
                </button>
                <Av name={otherName} size={36} />
                <div>
                  <div className="text-[14px] font-bold text-p-text-primary">{otherName}</div>
                  <div className="text-[12px] text-p-text-tertiary capitalize">
                    {activeConv?.otherMember?.role ?? ''}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="size-5 rounded-full border-2 border-p-accent border-t-transparent [animation:spin_0.7s_linear_infinite]" />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <MessageSquare size={28} className="text-p-text-tertiary opacity-30" />
                    <div className="text-[13px] text-p-text-tertiary">Sé el primero en escribir</div>
                  </div>
                ) : (
                  groupedMessages.map(({ msg, showDay, dayLabel }) => (
                    <Bubble
                      key={msg.id}
                      msg={msg}
                      isMine={msg.senderMemberId === myMemberId}
                      showDay={showDay}
                      dayLabel={dayLabel}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-p-border flex items-end gap-2 shrink-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje… (Enter para enviar)"
                  rows={1}
                  className="flex-1 px-[13px] py-[9px] rounded-[12px] border border-p-border bg-p-bg-subtle text-[13.5px] text-p-text-primary outline-none resize-none focus:border-p-border-strong transition-colors max-h-[120px] font-[inherit]"
                  style={{ lineHeight: '1.5' }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="size-[38px] rounded-[12px] bg-p-accent text-p-accent-text border-none cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewConv && (
        <NewConvModal
          members={allMembers}
          myMemberId={myMemberId}
          onStart={handleStartConv}
          onClose={() => setShowNewConv(false)}
        />
      )}
    </div>
  );
}
