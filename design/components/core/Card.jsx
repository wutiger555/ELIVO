import React from 'react';
export function Card({variant='default',padding=20,children,style,onClick}){
  const glass={backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)'};
  const V={default:{...glass,background:'var(--glass-fill)',boxShadow:'var(--glass-edge)'},raised:{...glass,background:'var(--glass-fill-strong)',boxShadow:'var(--glass-shadow)'},outline:{background:'transparent',boxShadow:'inset 0 0 0 1px var(--border-strong)'},promoted:{...glass,background:'var(--glass-fill-strong)',boxShadow:'var(--glow-signal)'}}[variant]||{};
  return <div onClick={onClick} style={{borderRadius:'var(--radius-lg)',padding,color:'var(--text-1)',...V,...style}}>{children}</div>;
}
