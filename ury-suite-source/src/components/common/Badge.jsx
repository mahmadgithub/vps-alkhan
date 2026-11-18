import React from 'react';

export default function Badge({ status }) {
  const s = (status || '').toLowerCase();
  let cls = 'status-preparing';
  let label = status;

  if (s === 'ready' || s === 'free' || s === 'available') {
    cls = 'status-ready';
    label = 'Free';
  } else if (s === 'busy' || s === 'occupied' || s === 'reserved' || s === 'reserve' || s === 'booked') {
    cls = 'status-reserved';
    label = 'Reserved';
  } else if (s === 'paid') {
    cls = 'status-paid';
  } else if (s === 'delivered') {
    cls = 'status-delivered';
  } else if (s === 'cancelled') {
    cls = 'status-cancelled';
  } else if (s === 'pending') {
    cls = 'status-preparing';
  }

  return (
    <span className={`status-badge ${cls}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

