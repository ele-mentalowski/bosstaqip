
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import {
  LogOut,Shield,Bell,BellOff,X,RefreshCw,Clock3,
  Users,Plus,Trash2,KeyRound
} from 'lucide-react';
import './style.css';

const URL=import.meta.env.VITE_SUPABASE_URL;
const KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const db=URL&&KEY?createClient(URL,KEY):null;
const CH=['CH1','CH2','CH3','CH4','CH5','CH6'];
const D=3600;
const INVASION_PHASE=80*60;
const INVASION_TOTAL=INVASION_PHASE*2;

const fmt=n=>`${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.max(0,n)%60).padStart(2,'0')}`;

const clock=d=>new Intl.DateTimeFormat('tr-TR',{
  hour:'2-digit',
  minute:'2-digit',
  second:'2-digit',
  hour12:false
}).format(d);

const left=(r,now)=>{
  if(!r?.cycle_started_at)return D;
  let e=Math.max(0,Math.floor((now-new Date(r.cycle_started_at).getTime())/1000));
  return D-e%D;
};

const invasionClock=(r,now)=>{
  if(!r?.cycle_started_at)return {remaining:0,phase:'idle'};
  const elapsed=Math.max(0,Math.floor((now-new Date(r.cycle_started_at).getTime())/1000));
  if(elapsed<INVASION_PHASE)return {remaining:INVASION_PHASE-elapsed,phase:'green'};
  if(elapsed<INVASION_TOTAL)return {remaining:INVASION_TOTAL-elapsed,phase:'red'};
  return {remaining:0,phase:'red'};
};

function App(){
  const[session,S]=useState(null);
  const[rows,R]=useState([]);
  const[invasionRows,IR]=useState([]);
  const[activeTab,AT]=useState('metin');
  const[now,N]=useState(Date.now());
  const[user,U]=useState('');
  const[pass,P]=useState('');
  const[err,E]=useState('');
  const[modal,M]=useState('');
  const[target,T]=useState('');
  const[mins,Q]=useState('60');
  const[users,V]=useState([]);
  const[newU,NU]=useState('');
  const[newP,NP]=useState('');
  const[adminErr,AE]=useState('');
  const[notice,NT]=useState(false);

  const alerted=useRef(new Set());
  const admin=session?.user?.app_metadata?.role==='admin';
  const uname=session?.user?.user_metadata?.username||session?.user?.email?.split('@')[0]||'Üye';

  const load=useCallback(async()=>{
    if(!db||!session)return;
    const[{data:metin,error:metinError},{data:invasion,error:invasionError}]=await Promise.all([
      db.from('channel_state').select('*').order('channel'),
      db.from('invasion_state').select('*').order('channel')
    ]);
    if(!metinError&&metin)R(metin);
    if(!invasionError&&invasion)IR(invasion);
    if(invasionError)console.error('İstila verileri alınamadı:',invasionError.message);
  },[session]);

  useEffect(()=>{
    if(!db)return;
    db.auth.getSession().then(({data})=>S(data.session));
    const{data:l}=db.auth.onAuthStateChange((_,s)=>{
      S(s);
      R([]);
      IR([]);
    });
    return()=>l.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session)return;
    load();
    const c=db.channel('boss-tracking-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'channel_state'},p=>{
        const n=p.new;
        if(n?.channel){
          R(old=>old.some(x=>x.channel===n.channel)
            ?old.map(x=>x.channel===n.channel?n:x)
            :[...old,n].sort((a,b)=>a.channel.localeCompare(b.channel)));
        }
      })
      .on('postgres_changes',{event:'*',schema:'public',table:'invasion_state'},p=>{
        const n=p.new;
        if(n?.channel){
          IR(old=>old.some(x=>x.channel===n.channel)
            ?old.map(x=>x.channel===n.channel?n:x)
            :[...old,n].sort((a,b)=>a.channel.localeCompare(b.channel)));
        }
      }).subscribe();

    return()=>db.removeChannel(c);
  },[session,load]);

  useEffect(()=>{
    let id=setInterval(()=>N(Date.now()),250);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    if(!session)return;

    rows.forEach(r=>{
      let x=left(r,now);
      let k=r.channel+':'+r.cycle_started_at;

      if(x<=180&&x>0&&!alerted.current.has(k)){
        alerted.current.add(k);

        try{
          let C=window.AudioContext||window.webkitAudioContext;
          let c=new C();
