
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

function App(){
  const[session,S]=useState(null);
  const[rows,R]=useState([]);
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
    const{data,error}=await db.from('channel_state').select('*').order('channel');
    if(!error&&data)R(data);
  },[session]);

  useEffect(()=>{
    if(!db)return;
    db.auth.getSession().then(({data})=>S(data.session));
    const{data:l}=db.auth.onAuthStateChange((_,s)=>{
      S(s);
      R([]);
    });
    return()=>l.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session)return;
    load();
    const c=db.channel('channel-live')
      .on('postgres_changes',{
        event:'*',
        schema:'public',
        table:'channel_state'
      },p=>{
        let n=p.new;
        if(n?.channel){
          R(old=>old.some(x=>x.channel===n.channel)
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

          [0,.25,.5].forEach(t=>{
            let o=c.createOscillator();
            let g=c.createGain();

            o.type='square';
            o.frequency.value=120;
            g.gain.setValueAtTime(.001,c.currentTime+t);
            g.gain.exponentialRampToValueAtTime(.16,c.currentTime+t+.02);
            g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+.16);

            o.connect(g);
            g.connect(c.destination);
            o.start(c.currentTime+t);
            o.stop(c.currentTime+t+.18);
          });

          setTimeout(()=>c.close(),1000);
        }catch{}

        if(notice&&Notification.permission==='granted'){
          new Notification(`${r.channel}: 3 dakika kaldı`,{
            body:'Boss zamanlayıcısı son 3 dakikada.',
            tag:k
          });
        }
      }

      if(x>180)alerted.current.delete(k);
    });
  },[rows,now,session,notice]);

  async function login(e){
    e.preventDefault();
    E('');

    let{data,error}=await db.auth.signInWithPassword({
      email:user.trim().toLowerCase()+'@boss.local',
      password:pass
    });

    if(error){
      E('Kullanıcı adı veya şifre hatalı.');
    }else{
      S(data.session);
      P('');
    }
  }

  async function logout(){
    await db.auth.signOut();
    S(null);
    R([]);
  }

  async function reset(ch){
    let{error}=await db.from('channel_state').update({
      cycle_started_at:new Date().toISOString(),
      duration_seconds:D,
      updated_at:new Date().toISOString(),
      updated_by:session.user.id
    }).eq('channel',ch);

    if(error)alert(error.message);
    else alerted.current.clear();
  }

  // Saat düzenleme penceresini aç
  function edit(r){
    T(r.channel);

    const d=r?.cycle_started_at
      ?new Date(r.cycle_started_at)
      :new Date();

    Q(
      `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    );

    M('edit');
  }

  // Seçilen boss kesim saatini Supabase'e kaydet
  async function save(e){
    e.preventDefault();

    const[hours,minutes]=mins.split(':').map(Number);

    if(
      !Number.isInteger(hours)||hours<0||hours>23||
      !Number.isInteger(minutes)||minutes<0||minutes>59
    ){
      alert('Geçerli bir saat gir.');
      return;
    }

    const start=new Date();
    start.setHours(hours,minutes,0,0);

    if(start.getTime()>Date.now()){
      start.setDate(start.getDate()-1);
    }

    const{error}=await db.from('channel_state').update({
      cycle_started_at:start.toISOString(),
      duration_seconds:D,
      updated_at:new Date().toISOString(),
      updated_by:session.user.id
    }).eq('channel',target);

    if(error){
      alert(error.message);
    }else{
      M('');
      alerted.current.clear();
      await load();
    }
  }

  async function notify(){
    if(!('Notification'in window)){
      return alert('Tarayıcı bildirimleri desteklenmiyor.');
    }

    let p=await Notification.requestPermission();
    NT(p==='granted');

    if(p==='granted'){
      new Notification('Bildirimler açık',{
        body:'3 dakika kala uyarı alacaksın.'
      });
    }
  }

  async function api(body){
    let{data:{session:s}}=await db.auth.getSession();

    let{data,error}=await db.functions.invoke('admin-users',{
      body,
      headers:{Authorization:`Bearer ${s.access_token}`}
    });

    if(error)throw error;
    if(data?.error)throw Error(data.error);
    return data;
  }

  async function getUsers(){
    try{
      let d=await api({action:'list'});
      V(d.users||[]);
      AE('');
    }catch(e){
      AE(e.message);
    }
  }

  async function add(e){
    e.preventDefault();

    try{
      await api({
        action:'create',
        username:newU.trim().toLowerCase(),
        password:newP
      });

      NU('');
      NP('');
      getUsers();
    }catch(e){
      AE(e.message);
    }
  }

  async function del(id){
    if(!confirm('Kullanıcı silinsin mi?'))return;

    try{
      await api({action:'delete',userId:id});
      getUsers();
    }catch(e){
      AE(e.message);
    }
  }

  async function pw(id){
    let p=prompt('Yeni şifre (en az 8 karakter):');
    if(!p)return;

    try{
      await api({action:'password',userId:id,password:p});
      alert('Şifre değiştirildi.');
    }catch(e){
      AE(e.message);
    }
  }

  if(!URL||!KEY){
    return(
      <main className="center">
        <section className="login">
          <h1>Metin Boss Takip</h1>
          <h2>Supabase bağlantısı bekleniyor</h2>
          <p>Supabase ayarlarını kontrol et.</p>
        </section>
      </main>
    );
  }

  if(!session){
    return(
      <main className="center">
        <form className="login" onSubmit={login}>
          <div className="mark">M</div>
          <h1>Metin</h1>
          <p>Boss Takip Sistemi</p>

          <label>
            Kullanıcı adı
            <input
              value={user}
              onChange={e=>U(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Şifre
            <input
              type="password"
              value={pass}
              onChange={e=>P(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {err&&<div className="error">{err}</div>}

          <button className="primary wide">Giriş Yap</button>
          <small>Hesapları yalnızca yönetici oluşturabilir.</small>
        </form>
      </main>
    );
  }

  return(
    <main className="app">
      <header>
        <div className="spacer"/>

        <div className="heading">
          <h1>Metin</h1>
          <p>60 dakikadan geri sayar · 3 dk kala ses · Bitiş gerçek saate kilitli · Süre bitince otomatik yenilenir</p>
        </div>

        <nav>
          <span>{uname}</span>

          <button title="Bildirimleri aç" onClick={notify}>
            {notice?<Bell/>:<BellOff/>}
          </button>

          {admin&&
            <button title="Yönetici paneli" onClick={()=>{
              M('admin');
              getUsers();
            }}>
              <Shield/>
            </button>
          }

          <button title="Çıkış" onClick={logout}>
            <LogOut/>
          </button>
        </nav>
      </header>

      <section className="channels">
        {CH.map((ch,i)=>{
          let r=rows.find(x=>x.channel===ch);
          let rem=left(r,now);
          let start=r?.cycle_started_at?new Date(r.cycle_started_at):null;

          let end=start
            ?new Date(start.getTime()+(Math.floor((now-start.getTime())/D/1000)+1)*D*1000)
            :null;

          return(
            <article
              key={ch}
              className={`card ${rem<=180?'warning':'green'}`}
            >
              <div className="info">
                <div className="line">
                  <b>{ch}</b>
                  <span className="pill">{admin?'Admin':'berlin'}</span>
                  <strong className="timer">{fmt(rem)}</strong>
                </div>

                <div className="times">
                  Başladı: {start?clock(start):'--:--:--'}
                  {' '}
                  Bitiş: {end?clock(end):'--:--:--'}
                </div>
              </div>

              <div className="actions">
                <button onClick={()=>reset(ch)}>
                  <RefreshCw/>60dk Reset
                </button>

                <button onClick={()=>edit(r||{channel:ch})}>
                  <Clock3/>Saat Düzenle
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {modal==='edit'&&(
        <div
          className="shade"
          onMouseDown={e=>e.target===e.currentTarget&&M('')}
        >
          <form className="dialog" onSubmit={save}>
            <button
              type="button"
              className="close"
              onClick={()=>M('')}
            >
              <X/>
            </button>

            <h2>{target} · Saat Düzenle</h2>
            <p>Bossun kesildiği saati gir.</p>

            <input
              type="time"
              value={mins}
              onChange={e=>Q(e.target.value)}
              required
            />

            <button className="primary wide">Kaydet</button>
          </form>
        </div>
      )}

      {modal==='admin'&&(
        <div
          className="shade"
          onMouseDown={e=>e.target===e.currentTarget&&M('')}
        >
          <section className="dialog admin">
            <button className="close" onClick={()=>M('')}>
              <X/>
            </button>

            <h2><Users/> Yönetici Paneli</h2>

            <form className="add" onSubmit={add}>
              <input
                placeholder="Kullanıcı adı"
                value={newU}
                onChange={e=>NU(e.target.value)}
                required
                minLength="3"
              />

              <input
                type="password"
                placeholder="Şifre (en az 8 karakter)"
                value={newP}
                onChange={e=>NP(e.target.value)}
                required
                minLength="8"
              />

              <button className="primary">
                <Plus/>Üye Ekle
              </button>
            </form>

            {adminErr&&<div className="error">{adminErr}</div>}

            {users.map(u=>(
              <div className="user" key={u.id}>
                <span>
                  {u.username} {u.role==='admin'?'(Admin)':''}
                </span>

                <div>
                  <button onClick={()=>pw(u.id)} title="Şifre değiştir">
                    <KeyRound/>
                  </button>

                  {u.role!=='admin'&&
                    <button onClick={()=>del(u.id)} title="Sil">
                      <Trash2/>
                    </button>
                  }
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
