<button onClick={()=>reset(ch)}><RefreshCw/>60dk Reset</button>
                  <button onClick={()=>edit(r||{channel:ch})}><Clock3/>Saat Düzenle</button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="channels">
          {CH.map(ch=>{
            const r=invasionRows.find(x=>x.channel===ch);
            const state=invasionClock(r,now);
            const start=r?.cycle_started_at?new Date(r.cycle_started_at):null;
            const phaseEnd=start
              ?new Date(start.getTime()+(state.phase==='green'?INVASION_PHASE:INVASION_TOTAL)*1000)
              :null;
            const isRed=state.phase==='red';
            return(
              <article
                key={ch}
                className={`card ${isRed?'warning':'green'} ${isRed?'invasion-red':''}`}
                style={isRed?{borderColor:'#ef4444',background:'rgba(239,68,68,.09)'}:undefined}
              >
                <div className="info">
                  <div className="line">
                    <b>{ch}</b>
                    <span className="pill">{admin?'Admin':'berlin'}</span>
                    <strong className="timer" style={isRed?{color:'#ef4444'}:undefined}>{state.phase==='idle'?'--:--':fmt(state.remaining)}</strong>
                  </div>
                  <div className="times">
                    {state.phase==='idle'?'Kesim bekleniyor':isRed?(state.remaining===0?'Boss çıkmış olabilir · Kesim bekleniyor':'Boss çıkabilir'):'Boss çıkamaz'}
                    {' · '}
                    Başladı: {start?clock(start):'--:--:--'}{' '}
                    Bitiş: {phaseEnd?clock(phaseEnd):'--:--:--'}
                  </div>
                </div>
                <div className="actions">
                  <button onClick={()=>invasionKilled(ch)}><RefreshCw/>Kesildi</button>
                </div>
              </article>
            );
          })}
        </section>
      )}

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
