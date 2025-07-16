import React from 'react';

export default function StatCard({ number, label }) {
  return (
    <wcs-card style={{ minWidth: 120, textAlign: 'center', padding: 8 }}>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{number}</div>
      <div style={{ fontSize: 14 }}>{label}</div>
    </wcs-card>
  );
}
