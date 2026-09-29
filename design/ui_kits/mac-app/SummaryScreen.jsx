const {Tabs:STabs,Button:SButton,Toast:SToast,SourceChip:SSrc,Badge:SBadge,Input:SInput,Icon:SIcon}=window.ELIVODesignSystem_a6632d;
function SummaryScreen({onBack}){
  const [tab,setTab]=React.useState('dec');const [toast,setToast]=React.useState(true);
  React.useEffect(()=>{const id=setTimeout(()=>setToast(false),3200);return()=>clearTimeout(id)},[]);
  const rows={dec:[['維持方案 B，分階段切換','00:25:40','取代 8/12 決策 · 未變更'],['下週三前完成 rollback 文件','00:28:02','Owner：我 · 9/30']],act:[['Rollback 流程文件','00:28:02','我 · 9/30'],['更新壓測報告','00:33:10','未指定']],q:[['全部切換的時程是否需要客戶簽核？','00:36:44','未回答']]};
  return <MacShell title={<span style={{font:'400 13px/1 var(--font-sans)',color:'var(--text-2)'}}>會後摘要</span>} right={<div style={{display:'flex',gap:6}}><SButton size="sm" variant="ghost" icon="arrow-left" onClick={onBack}>會前簡報</SButton><SButton size="sm" variant="primary" icon="mail">起草追蹤信</SButton></div>}>
    <div style={{width:240,flex:'none',margin:12,marginRight:0,borderRadius:'var(--radius-xl)',padding:'18px 12px',background:'var(--glass-fill-thin)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',boxShadow:'var(--glass-edge)',display:'flex',flexDirection:'column',gap:16}}>
      <SInput icon="search" size="sm" placeholder="搜尋 Ledger"/>
      <div style={{display:'flex',flexDirection:'column',gap:2}}>{[['Acme｜API Migration','今天',1],['Acme｜API Migration','8/12'],['Acme｜Kickoff','7/30'],['Beta Corp｜Steering','7/28']].map(([t,d,on],i)=><div key={i} style={{padding:'9px 12px',borderRadius:12,background:on?'var(--surface-press)':'transparent',boxShadow:on?'inset 0 1px 0 rgba(255,255,255,.1)':'none',cursor:'pointer'}}><div style={{font:'400 13px/1.35 var(--font-sans)',color:on?'var(--text-1)':'var(--text-2)'}}>{t}</div><div style={{font:'400 11px/1.4 var(--font-mono)',color:'var(--text-4)'}}>{d}</div></div>)}</div>
    </div>
    <div style={{flex:1,overflow:'auto',padding:'32px 40px',position:'relative'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}><SBadge tone="accent">已寫入 Ledger</SBadge><span style={{font:'400 12px/1 var(--font-mono)',color:'var(--text-3)'}}>9/29 · 00:41:18</span></div>
      <div style={{font:'500 28px/1.25 var(--font-sans)',letterSpacing:'-0.02em',marginTop:12}}>Acme｜API Migration Weekly</div>
      <div style={{font:'400 15px/1.7 var(--font-sans)',color:'var(--text-2)',maxWidth:640,marginTop:10}}>團隊提出一次全部切換，與 8/12 分階段方案 B 不同；討論後維持方案 B，並補上 rollback 負責人。</div>
      <STabs style={{marginTop:28,marginBottom:6}} value={tab} onChange={setTab} items={[{id:'dec',label:'決策',count:2},{id:'act',label:'待辦',count:2},{id:'q',label:'未決問題',count:1}]}/>
      <div>{rows[tab].map(([t,c,m],i)=><div key={tab+i} style={{display:'grid',gridTemplateColumns:'1fr 200px',gap:16,padding:'16px 20px',marginTop:10,borderRadius:'var(--radius-lg)',background:'var(--glass-fill)',boxShadow:'var(--glass-edge)',animation:'elivo-surface var(--dur-slow) var(--ease-out)'}}><div><div style={{font:'400 15px/1.5 var(--font-sans)'}}>{t}</div><SSrc label="本場" time={c} onClick={()=>{}} style={{marginTop:6}}/></div><div style={{font:'400 12.5px/1.5 var(--font-sans)',color:'var(--text-3)',textAlign:'right'}}>{m}</div></div>)}</div>
      {toast&&<div style={{position:'absolute',right:24,bottom:24}}><SToast tone="success" title="已寫入 Decision Ledger" body="2 個決策 · 2 個待辦" onClose={()=>setToast(false)}/></div>}
    </div>
  </MacShell>;
}
window.SummaryScreen=SummaryScreen;
