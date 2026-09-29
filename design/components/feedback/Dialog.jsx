import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
export function Dialog({open=true,title,description,children,footer,onClose,width=480,inline,style}){
  if(!open)return null;
  const panel=<div role="dialog" aria-modal="true" style={{width,maxWidth:'100%',background:'var(--glass-fill-strong)',backdropFilter:'var(--glass-blur-heavy)',WebkitBackdropFilter:'var(--glass-blur-heavy)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-overlay)',overflow:'hidden',animation:'elivo-surface var(--dur-slow) var(--ease-out)',...style}}>
    <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:'22px 22px 0 24px'}}>
      <div style={{flex:1}}>
        {title&&<div style={{font:'600 17px/1.35 var(--font-sans)',letterSpacing:'-0.015em',color:'var(--text-1)'}}>{title}</div>}
        {description&&<div style={{marginTop:6,font:'400 13.5px/1.6 var(--font-sans)',color:'var(--text-3)'}}>{description}</div>}
      </div>
      {onClose&&<IconButton icon="x" label="關閉" size="sm" variant="secondary" onClick={onClose}/>}
    </div>
    <div style={{padding:'20px 24px'}}>{children}</div>
    {footer&&<div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:'0 20px 20px'}}>{footer}</div>}
  </div>;
  if(inline)return panel;
  return <div onClick={e=>{if(e.target===e.currentTarget&&onClose)onClose()}} style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'var(--overlay)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)'}}>{panel}</div>;
}
