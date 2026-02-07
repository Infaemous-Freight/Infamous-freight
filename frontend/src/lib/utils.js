import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents) {
  if (!cents && cents !== 0) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    draft: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    posted: 'bg-amber-950/50 text-amber-400 border-amber-800',
    booked: 'bg-blue-950/50 text-blue-400 border-blue-800',
    in_transit: 'bg-emerald-950/50 text-emerald-400 border-emerald-800',
    delivered: 'bg-green-950/50 text-green-400 border-green-800',
    cancelled: 'bg-red-950/50 text-red-400 border-red-800',
    submitted: 'bg-amber-950/50 text-amber-400 border-amber-800',
    accepted: 'bg-emerald-950/50 text-emerald-400 border-emerald-800',
    rejected: 'bg-red-950/50 text-red-400 border-red-800',
    withdrawn: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    active: 'bg-emerald-950/50 text-emerald-400 border-emerald-800',
    completed: 'bg-blue-950/50 text-blue-400 border-blue-800',
  };
  return colors[status] || colors.draft;
}
