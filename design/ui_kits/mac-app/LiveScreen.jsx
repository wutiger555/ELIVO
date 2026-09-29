const {Button:LButton,IconButton:LIB,RecIndicator:LRec,TranscriptLine:LLine,ContextCard:LCard,AmbientItem:LAmb,SegmentedControl:LSeg,Switch:LSwitch,Tooltip:LTip,Dialog:LDialog,Checkbox:LCheck}=window.ELIVODesignSystem_a6632d;
const SCRIPT=[
 {s:'我',self:1,t:'00:22:58',x:'我們上次討論的 API migration，今天想確認一下進度。'},
 {s:'對方',t:'00:23:05',x:'對，當時最大的問題其實是 latency，p95 大概八百多。',amb:{kind:'number',label:'Benchmark p95 820ms',meta:'7/30'}},
 {s:'對方',t:'00:23:12',x:'所以這次我們想直接全部切過去，比較省事。',hl:'全部切過去',card:1},
 {s:'我',self:1,t:'00:23:20',x:'那 rollback 的部分，現在是誰在負責？',amb:{kind:'question',label:'未回答：rollback 誰負責？',meta:'00:23'}},
 {s:'說話者 C',t:'00:23:31',x:'文件我們上週有更新，proposal 應該是 v2 了。',amb:{kind:'doc',label:'API Migration Proposal v2',meta:'7/28'}},
];
function LiveScreen({onEnd}){
  const [n,setN]=React.useState(1);const [paused,setPaused]=React.useState(false);const [focus,setFocus]=React.useState(false);const [eph,setEph]=React.useState(false);
  const [card,setCard]=React.useState('none');const [pinned,setPinned]=React.useState(false);const [why,setWhy]=React.useState(false);const [confirm,setConfirm]=React.useState(false);
  React.useEffect(()=>{if(paused||n>=SCRIPT.length)return;const id=setTimeout(()=>{setN(n+1);if(SCRIPT[n].card)setCard('shown')},2200);return()=>clearTimeout(id)},[n,paused]);
  const lines=SCRIPT.slice(0,n);const amb=[{kind:'doc',label:'8/12 週會紀錄',meta:'8/12'},...lines.filter(l=>l.amb).map(l=>l.amb)];
  return <MacShell title={<span style={{font:'400 13px/1 var(--font-sans)',color:'var(--text-2)'}}>Acme｜API Migration Weekly</span>}
    right={<div style={{display:'flex',alignItems:'center',gap:6}}>
      <LRec state={paused?'paused':eph?'ephemeral':'rec'} time="00:23:41"/>
      <span style={{width:8}}/>
      <LTip content="只保留逐字稿" side="bottom"><LButton size="sm" variant={focus?'secondary':'ghost'} icon="focus" onClick={()=>setFocus(!focus)}>Focus</LButton></LTip>
      <LSwitch checked={eph} onChange={setEph} label={<span style={{fontSize:12.5,color:'var(--text-2)'}}>Ephemeral</span>}/>
      <span style={{width:6}}/>
      <LIB icon={paused?'play':'pause'} label={paused?'繼續':'暫停'} onClick={()=>setPaused(!paused)}/>
      <LIB icon="monitor-smartphone" label="第二螢幕"/>
      <LButton size="sm" variant="secondary" icon="square" onClick={()=>setConfirm(true)}>結束</LButton>
    </div>}>
    <div style={{flex:1.35,minWidth:0,display:'flex',flexDirection:'column',padding:'24px 32px'}}>
      <SectionLabel right={<span style={{font:'400 11px/1 var(--font-mono)',color:'var(--text-4)'}}>繁中 · 中英混說</span>}>Live conversation</SectionLabel>
      <div style={{flex:1,overflow:'auto'}}>
        {lines.map((l,i)=><LLine key={i} speaker={l.s} self={!!l.self} time={l.t} text={l.x} highlight={card!=='none'&&!focus?l.hl:undefined} linked={card!=='none'&&!focus&&!!l.hl}/>)}
        {!paused&&n<SCRIPT.length&&<LLine speaker="…" partial text=""/>}
      </div>
    </div>
    <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',padding:'24px 24px',margin:'12px 12px 12px 0',borderRadius:'var(--radius-xl)',background:'var(--glass-fill-thin)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',boxShadow:'var(--glass-edge)'}}>
      <SectionLabel right={<LSeg size="sm" options={['安靜','標準','積極']} defaultValue="標準"/>}>Context</SectionLabel>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <LCard type="previous_decision" title="8/12 決定採用方案 B" body="Gateway 分階段切換。" source={{label:'8/12 週會',time:'00:31:05'}} onOpenSource={()=>{}}/>
        {card==='shown'&&!focus&&<LCard type="decision_conflict" level="promoted" time="00:23:14" pinned={pinned} title="與 8/12 決策不同" body="「全部切過去」與 8/12 決定的分階段方案 B 不同。" source={{label:'8/12 週會',time:'00:31:05'}}
          onOpenSource={()=>setWhy(true)} onPin={()=>setPinned(!pinned)} onDismiss={()=>setCard('dismissed')} onWhy={()=>setWhy(true)}/>}
      </div>
      <div style={{marginTop:24}}><SectionLabel right={<span style={{font:'400 11px/1 var(--font-mono)',color:'var(--text-4)'}}>{amb.length}</span>}>Ambient</SectionLabel>
        {amb.map((a,i)=><LAmb key={i} {...a} onClick={()=>{}}/>)}
      </div>
    </div>
    {why&&<LDialog title="為什麼現在出現？" description="說話告一段落時，當下說法與 ledger 中的決策相似度超過門檻。" onClose={()=>setWhy(false)} footer={<LButton size="sm" onClick={()=>setWhy(false)}>關閉</LButton>}>
      <div style={{display:'grid',gridTemplateColumns:'90px 1fr',gap:'12px 14px',font:'400 13.5px/1.55 var(--font-sans)'}}>
        {[['觸發語句','「所以這次我們想直接全部切過去」 · 00:23:12'],['比對決策','「先用方案 B 分階段切」 · 8/12 週會 00:31:05'],['分數',<span style={{fontFamily:'var(--font-mono)'}}>0.82 <span style={{color:'var(--text-4)'}}>/ 門檻 0.70</span></span>]].map(([k,v])=><React.Fragment key={k}><span style={{color:'var(--text-3)',fontSize:12.5}}>{k}</span><span>{v}</span></React.Fragment>)}
      </div></LDialog>}
    {confirm&&<LDialog title="這 3 個決策、2 個待辦對嗎？" description="30 秒確認後寫入 Decision Ledger。" onClose={()=>setConfirm(false)} footer={<><LButton size="sm" variant="ghost" onClick={()=>setConfirm(false)}>返回會議</LButton><LButton size="sm" variant="primary" icon="check" onClick={onEnd}>寫入 Ledger</LButton></>}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <LCheck defaultChecked label="維持方案 B，分階段切換" description="00:25:40"/><LCheck defaultChecked label="下週三前完成 rollback 文件" description="Owner：我 · 9/30"/><LCheck label="Proposal v2 為本次基準" description="00:23:31"/>
      </div></LDialog>}
  </MacShell>;
}
window.LiveScreen=LiveScreen;
