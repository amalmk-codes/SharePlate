import { useEffect, useMemo, useState } from "react";
import "./style.css";

const KEY = "shareplate_hackathon_v1";
const categories = ["Cooked Meals", "Bakery", "Fruits", "Vegetables", "Packaged Food", "Other"];

const initialOrgs = [
  { id: "org1", name: "Hope Community Kitchen", location: "Thrissur", description: "Community meals and food distribution.", needs: "Rice, lentils, cooking oil" },
  { id: "org2", name: "Green Hands Foundation", location: "Irinjalakuda", description: "Supports families and local community kitchens.", needs: "Vegetables, rice, wheat" },
  { id: "org3", name: "Sunrise Care Centre", location: "Kochi", description: "Food support for people who need assistance.", needs: "Cooking oil, lentils, packaged food" }
];

const sampleFoods = [
  { id: "f1", donor: "Green Leaf Cafe", name: "Fresh vegetarian meals", description: "Freshly prepared meals. Confirm ingredients and storage.", quantity: "8 meal boxes", category: "Cooked Meals", location: "Thrissur", until: Date.now() + 6 * 3600000, status: "Available", created: Date.now() },
  { id: "f2", donor: "Sunrise Bakery", name: "Bread and buns", description: "Bakery surplus. Check freshness before collection.", quantity: "15 pieces", category: "Bakery", location: "Kochi", until: Date.now() + 12 * 3600000, status: "Available", created: Date.now() },
  { id: "f3", donor: "Community Garden", name: "Fresh bananas", description: "Ripe bananas available for prompt collection.", quantity: "20 bananas", category: "Fruits", location: "Irinjalakuda", until: Date.now() + 3 * 3600000, status: "Available", created: Date.now() }
];

const sampleNeeds = [
  { id: "n1", org: "Hope Community Kitchen", location: "Thrissur", item: "Rice", quantity: 25, unit: "kg", description: "Rice for upcoming community meals.", status: "Open" },
  { id: "n2", org: "Green Hands Foundation", location: "Irinjalakuda", item: "Cooking oil", quantity: 10, unit: "litres", description: "Cooking oil for food preparation.", status: "Open" },
  { id: "n3", org: "Sunrise Care Centre", location: "Kochi", item: "Lentils", quantity: 15, unit: "kg", description: "Lentils for nutritious meals.", status: "Open" }
];

function readData() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Could not load demo data", e);
  }
  return { foods: sampleFoods, needs: sampleNeeds, pledges: [], orgs: initialOrgs };
}

function deadlineLabel(until, now) {
  const ms = Number(until) - now;
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days) return `${days}d ${hours % 24}h left`;
  if (hours) return `${hours}h ${minutes % 60}m left`;
  return `${minutes}m left`;
}

function statusOf(food, now) {
  if (food.status === "Available" && Number(food.until) <= now) return "Expired";
  return food.status;
}

export default function App() {
  const [data, setData] = useState(readData);
  const [page, setPage] = useState("Dashboard");
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("deadline");
  const [donation, setDonation] = useState({ donor: "", name: "", description: "", quantity: "", category: "Cooked Meals", location: "", until: "" });
  const [pledge, setPledge] = useState({ needId: "n1", name: "", quantity: "" });
  const [pickupCode, setPickupCode] = useState("");
  const [selectedFood, setSelectedFood] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      setNotice("Browser storage is unavailable or full.");
    }
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 3500);
  }

  const foods = data.foods || [];
  const needs = data.needs || [];
  const pledges = data.pledges || [];
  const orgs = data.orgs || initialOrgs;

  const stats = useMemo(() => ({
    listed: foods.length,
    available: foods.filter(f => statusOf(f, now) === "Available").length,
    requested: foods.filter(f => f.status === "Requested").length,
    collected: foods.filter(f => f.status === "Collected").length,
    pledges: pledges.length,
    delivered: pledges.filter(p => p.status === "Delivered").length
  }), [foods, pledges, now]);

  const filteredFoods = useMemo(() => {
    const term = search.toLowerCase().trim();
    let list = foods.filter(f => {
      const matches = [f.name, f.donor, f.location, f.description].some(v => String(v || "").toLowerCase().includes(term));
      return matches && (category === "All" || f.category === category);
    });
    return [...list].sort((a, b) => sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "newest" ? b.created - a.created : Number(a.until) - Number(b.until));
  }, [foods, search, category, sort]);

  function publishFood(e) {
    e.preventDefault();
    const until = new Date(donation.until).getTime();
    if (!Number.isFinite(until) || until <= Date.now()) return flash("Choose a future availability deadline.");
    const item = {
      ...donation, id: crypto.randomUUID(), until,
      created: Date.now(), status: "Available", pickupCode: ""
    };
    setData(d => ({ ...d, foods: [item, ...d.foods] }));
    setDonation({ donor: "", name: "", description: "", quantity: "", category: "Cooked Meals", location: "", until: "" });
    flash("Food donation published in this browser!");
    setPage("Food Rescue");
  }

  function requestFood(id) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const item = foods.find(f => f.id === id);
    if (!item || statusOf(item, Date.now()) !== "Available") return flash("This donation is no longer available.");
    setData(d => ({ ...d, foods: d.foods.map(f => f.id === id ? { ...f, status: "Requested", pickupCode: code } : f) }));
    setSelectedFood(id);
    setPickupCode("");
    flash("Request recorded. Use the pickup confirmation panel to finish the demo.");
  }

  function confirmPickup(e) {
    e.preventDefault();
    const food = foods.find(f => f.id === selectedFood);
    if (!food || food.status !== "Requested") return flash("No pending request selected.");
    if (pickupCode.trim() !== food.pickupCode) return flash("Incorrect pickup code. Check the code on the donation card.");
    setData(d => ({ ...d, foods: d.foods.map(f => f.id === selectedFood ? { ...f, status: "Collected" } : f) }));
    setSelectedFood("");
    setPickupCode("");
    flash("Pickup confirmed in the demo!");
  }

  function submitPledge(e) {
    e.preventDefault();
    const need = needs.find(n => n.id === pledge.needId);
    const amount = Number(pledge.quantity);
    if (!need || !pledge.name.trim() || !Number.isFinite(amount) || amount <= 0) return flash("Enter your name and a valid quantity.");
    const item = {
      id: crypto.randomUUID(), needId: need.id, org: need.org,
      item: need.item, unit: need.unit, name: pledge.name.trim(),
      quantity: amount, status: "Pledged", created: Date.now()
    };
    setData(d => ({ ...d, pledges: [item, ...d.pledges] }));
    setPledge({ needId: need.id, name: "", quantity: "" });
    flash("Donation pledge saved. No payment or purchase was made.");
    setPage("Track Donations");
  }

  function advancePledge(id) {
    const stages = ["Pledged", "Arranged", "Delivered"];
    setData(d => ({ ...d, pledges: d.pledges.map(p => {
      if (p.id !== id) return p;
      return { ...p, status: stages[Math.min(stages.indexOf(p.status) + 1, 2)] };
    }) }));
  }

  function resetDemo() {
    if (!confirm("Reset all SharePlate demo data?")) return;
    setData({ foods: sampleFoods, needs: sampleNeeds, pledges: [], orgs: initialOrgs });
    setPage("Dashboard");
    setSearch("");
    setCategory("All");
    flash("Demo data reset.");
  }

  const nav = ["Dashboard", "Food Rescue", "Buy & Donate", "Organizations", "Track Donations"];

  return <div className="app">
    <aside className="sidebar">
      <a className="logo" href="#top" onClick={() => setPage("Dashboard")}><span>♧</span> SharePlate</a>
      <p className="nav-caption">WORKSPACE</p>
      {nav.map((n, i) => <button key={n} className={`nav-item ${page === n ? "active" : ""}`} onClick={() => setPage(n)}><span>{["▦", "🍱", "🛒", "🤝", "♡"][i]}</span>{n}</button>)}
      <div className="sidebar-bottom">
        <div className="side-heart">💚</div>
        <strong>Share more. Waste less.</strong>
        <p>Every little contribution can make a difference.</p>
        <button className="side-reset" onClick={resetDemo}>Reset demo data</button>
      </div>
      <div className="demo-label">DEMO MODE · LOCAL STORAGE</div>
    </aside>

    <main className="main" id="top">
      <header className="topbar">
        <div><span className="crumb">SHAREPLATE /</span><strong>{page}</strong></div>
        <button className="top-action" onClick={() => setPage("Donate Food")}>＋ List food</button>
      </header>

      <section className="welcome">
        <div><span className="eyebrow">GOOD FOOD. BETTER TOMORROW.</span>
          <h1>Small acts.<br/><span>Big impact.</span></h1>
          <p>Rescue surplus food, support community needs and make every contribution count.</p>
          <div className="welcome-actions">
            <button className="primary" onClick={() => setPage("Donate Food")}>＋ Donate surplus food</button>
            <button className="secondary" onClick={() => setPage("Buy & Donate")}>Support an organization ↗</button>
          </div>
        </div>
        <div className="welcome-art"><div className="art-circle">🥗</div><span className="art-bubble bubble-a">🌱 Less waste</span><span className="art-bubble bubble-b">💚 More hope</span></div>
      </section>

      <div className="stat-grid">
        {[["🍱", stats.listed, "Donations listed"], ["🟢", stats.available, "Available now"], ["🤝", stats.requested, "Awaiting collection"], ["💚", stats.collected, "Food rescues completed"]].map(s =>
          <article className="stat-card" key={s[2]}><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></article>
        )}
      </div>

      {page === "Dashboard" && <section className="content-grid">
        <article className="panel panel-wide">
          <div className="panel-heading"><div><span className="eyebrow">YOUR COMMUNITY</span><h2>Make a difference today</h2></div><span className="soft-pill">3 ways to help</span></div>
          <div className="action-grid">
            <button className="action-card" onClick={() => setPage("Donate Food")}><span className="action-icon peach">🍲</span><strong>Donate surplus food</strong><small>Share extra meals, bakery items or produce.</small><b>List food →</b></button>
            <button className="action-card" onClick={() => setPage("Buy & Donate")}><span className="action-icon blue">🛒</span><strong>Buy for donation</strong><small>Help meet an organization's food needs.</small><b>View needs →</b></button>
            <button className="action-card" onClick={() => setPage("Organizations")}><span className="action-icon lilac">🤝</span><strong>Find organizations</strong><small>Discover community groups and their needs.</small><b>Explore NGOs →</b></button>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">IMPACT SNAPSHOT</span><h2>Progress so far</h2></div><span>🌿</span></div>
          <div className="impact-line"><span>Food rescues completed</span><strong>{stats.collected}</strong></div>
          <div className="impact-line"><span>Support pledges</span><strong>{stats.pledges}</strong></div>
          <div className="impact-line"><span>Pledges delivered</span><strong>{stats.delivered}</strong></div>
          <p className="hint">These are demo records saved in this browser, not verified community impact.</p>
          <button className="text-button" onClick={() => setPage("Track Donations")}>View donation tracking →</button>
        </article>
        <article className="panel panel-wide">
          <div className="panel-heading"><div><span className="eyebrow">ENDING SOON</span><h2>Food that needs attention</h2></div><button className="text-button" onClick={() => setPage("Food Rescue")}>View all →</button></div>
          <div className="compact-list">{foods.filter(f => statusOf(f, now) === "Available").sort((a,b) => a.until-b.until).slice(0,3).map(f =>
            <div className="compact-row" key={f.id}><span className="food-mini">🍱</span><div className="grow"><strong>{f.name}</strong><small>{f.donor} · {f.location}</small></div><span className="time-pill">◷ {deadlineLabel(f.until, now)}</span></div>
          )}{!foods.some(f => statusOf(f, now) === "Available") && <p className="hint">No food currently available.</p>}</div>
        </article>
      </section>}

      {page === "Food Rescue" && <section className="page-section">
        <div className="page-title"><span className="eyebrow">SURPLUS FOOD SHARING</span><h2>Find food. Share hope.</h2><p>Search community donations and request items before their deadlines.</p></div>
        <div className="toolbar"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food, donor or location..."/><select value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{categories.map(c => <option key={c}>{c}</option>)}</select><select value={sort} onChange={e => setSort(e.target.value)}><option value="deadline">Ending soon</option><option value="newest">Newest first</option><option value="name">Food name</option></select></div>
        <div className="food-grid">{filteredFoods.map(f => {
          const status = statusOf(f, now);
          return <article className="food-card" key={f.id}><div className="food-art"><span>{({"Cooked Meals":"🍱","Bakery":"🥖","Fruits":"🍎","Vegetables":"🥦","Packaged Food":"🥫","Other":"🥗"})[f.category] || "🥗"}</span><b className={`badge ${status.toLowerCase()}`}>{status}</b></div><div className="food-body"><small>BY {f.donor}</small><h3>{f.name}</h3><p>{f.description}</p><div className="food-info"><span>📦 {f.quantity}</span><span>📍 {f.location}</span></div><div className="deadline"><span>◷ {status === "Expired" ? "Availability ended" : "Available until"}</span><strong>{deadlineLabel(f.until, now)}</strong></div>{f.status === "Requested" && <div className="code-box">Demo pickup code: <strong>{f.pickupCode}</strong><button onClick={() => {setSelectedFood(f.id);setPickupCode("");}}>Confirm pickup</button></div>}{f.status === "Collected" && <p className="success-text">✓ Collection completed</p>}<button disabled={status !== "Available"} className="primary full" onClick={() => requestFood(f.id)}>{status === "Available" ? "Request food →" : status}</button></div></article>;
        })}</div>
        {filteredFoods.length === 0 && <div className="empty">No food matches those filters.</div>}
        <p className="hint">Demo mode: requests and pickup codes are simulated in this browser.</p>
        {selectedFood && <form className="panel verify" onSubmit={confirmPickup}><h3>Confirm food collection</h3><p>Enter the six-digit demo code shown on the requested food card.</p><input value={pickupCode} onChange={e => setPickupCode(e.target.value)} pattern="[0-9]{6}" maxLength="6" required placeholder="Six-digit code"/><button className="primary">Confirm pickup</button><button type="button" className="secondary" onClick={() => setSelectedFood("")}>Cancel</button></form>}
      </section>}

      {page === "Donate Food" && <section className="page-section narrow"><div className="page-title"><span className="eyebrow">CONTRIBUTE SURPLUS FOOD</span><h2>Share what you can.</h2><p>List safe surplus food so a community organization can request it.</p></div>
        <form className="panel form" onSubmit={publishFood}>
          <label>Donor or organization name *<input required maxLength="100" value={donation.donor} onChange={e => setDonation({...donation, donor:e.target.value})} placeholder="e.g. Green Leaf Cafe"/></label>
          <label>Food name *<input required maxLength="100" value={donation.name} onChange={e => setDonation({...donation, name:e.target.value})} placeholder="e.g. Fresh vegetarian meals"/></label>
          <label>Description *<textarea required maxLength="500" value={donation.description} onChange={e => setDonation({...donation, description:e.target.value})} placeholder="Ingredients, storage and pickup notes"/></label>
          <div className="form-row"><label>Quantity *<input required value={donation.quantity} onChange={e => setDonation({...donation, quantity:e.target.value})} placeholder="e.g. 10 meal boxes"/></label><label>Category *<select value={donation.category} onChange={e => setDonation({...donation, category:e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
          <label>Pickup location *<input required value={donation.location} onChange={e => setDonation({...donation, location:e.target.value})} placeholder="Town or locality"/></label>
          <label>Available until *<input required type="datetime-local" min={new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)} value={donation.until} onChange={e => setDonation({...donation, until:e.target.value})}/></label>
          <button className="primary full">Publish donation ↗</button><p className="hint">Only list food that is safe to donate. Confirm collection details directly.</p>
        </form>
      </section>}

      {page === "Buy & Donate" && <section className="page-section"><div className="page-title"><span className="eyebrow">SUPPORT ORGANIZATION NEEDS</span><h2>Give what is needed.</h2><p>Choose a listed need and record a demo pledge. No payment is taken.</p></div>
        <div className="need-layout"><div className="need-grid">{needs.map(n => <article className="panel need-card" key={n.id}><span className="need-icon">🛒</span><span className="soft-pill">{n.status}</span><h3>{n.item}</h3><strong className="need-qty">{n.quantity} {n.unit}</strong><p>{n.description}</p><div className="need-org">🤝 {n.org}<small>📍 {n.location}</small></div><button className="primary full" onClick={() => setPledge({...pledge, needId:n.id})}>Support this need →</button></article>)}</div>
        <form className="panel form" onSubmit={submitPledge}><span className="eyebrow">YOUR CONTRIBUTION</span><h3>Make a food pledge</h3><p className="hint">This records your intention to donate an item. It does not buy or deliver anything.</p><label>Food need *<select value={pledge.needId} onChange={e => setPledge({...pledge, needId:e.target.value})}>{needs.map(n => <option key={n.id} value={n.id}>{n.item} — {n.org}</option>)}</select></label><label>Your name *<input required maxLength="100" value={pledge.name} onChange={e => setPledge({...pledge, name:e.target.value})} placeholder="Your name"/></label><label>Quantity *<input required type="number" min="1" step="1" value={pledge.quantity} onChange={e => setPledge({...pledge, quantity:e.target.value})} placeholder="e.g. 5"/></label><button className="primary full">Record pledge ↗</button></form></div>
      </section>}

      {page === "Organizations" && <section className="page-section"><div className="page-title"><span className="eyebrow">COMMUNITY PARTNERS</span><h2>Meet the organizations.</h2><p>Explore sample organizations and the food needs listed for this demonstration.</p></div><div className="org-grid">{orgs.map(o => <article className="panel org-card" key={o.id}><div className="org-banner">🤝</div><span className="soft-pill">Sample organization</span><h3>{o.name}</h3><p>📍 {o.location}</p><p>{o.description}</p><div className="org-needs"><small>FOOD NEEDS</small><strong>{o.needs}</strong></div><button className="secondary full" onClick={() => {setPledge({...pledge, needId: needs.find(n => n.org === o.name)?.id || needs[0]?.id || ""});setPage("Buy & Donate");}}>Support organization →</button></article>)}</div><p className="hint">These are fictional sample profiles, not verified registered NGOs.</p></section>}

      {page === "Track Donations" && <section className="page-section"><div className="page-title"><span className="eyebrow">YOUR CONTRIBUTIONS</span><h2>Every step counts.</h2><p>Follow surplus food requests and food-item pledges in this browser demo.</p></div><div className="track-summary"><div className="panel"><strong>{stats.requested}</strong><span>Food requests pending</span></div><div className="panel"><strong>{stats.collected}</strong><span>Food pickups completed</span></div><div className="panel"><strong>{stats.pledges}</strong><span>Food pledges recorded</span></div><div className="panel"><strong>{stats.delivered}</strong><span>Pledges marked delivered</span></div></div>
        <article className="panel tracking-panel"><h3>Surplus food tracking</h3>{foods.filter(f => ["Requested","Collected"].includes(f.status)).map(f => <div className="track-row" key={f.id}><span>🍱</span><div className="grow"><strong>{f.name}</strong><small>{f.donor} · {f.location}</small><div className="timeline"><i className="done"/> Listed <i className={f.status === "Collected" ? "done" : ""}/> Requested <i className={f.status === "Collected" ? "done" : ""}/> Collected</div></div><span className={`soft-pill ${f.status === "Collected" ? "delivered" : ""}`}>{f.status}</span></div>)}{!foods.some(f => ["Requested","Collected"].includes(f.status)) && <p className="hint">Your food requests will appear here.</p>}</article>
        <article className="panel tracking-panel"><h3>Buy-for-donation pledges</h3>{pledges.map(p => <div className="track-row" key={p.id}><span>🛒</span><div className="grow"><strong>{p.quantity} {p.unit} {p.item}</strong><small>{p.name} → {p.org}</small><div className="timeline"><i className="done"/> Pledged <i className={["Arranged","Delivered"].includes(p.status) ? "done" : ""}/> Arranged <i className={p.status === "Delivered" ? "done" : ""}/> Delivered</div></div><div className="status-action"><span className="soft-pill">{p.status}</span><button className="text-button" onClick={() => advancePledge(p.id)} disabled={p.status === "Delivered"}>{p.status === "Pledged" ? "Mark arranged" : p.status === "Arranged" ? "Mark delivered" : "Completed"}</button></div></div>)}{pledges.length === 0 && <p className="hint">Food pledges will appear here after you create one.</p>}</article>
        <p className="hint">Tracking updates are simulated by the person using this browser. Real organizations must verify receipt in a shared system.</p>
      </section>}

      <footer className="footer"><strong>♧ SharePlate</strong><span>Share more. Waste less. Build a caring community.</span><small>Hackathon prototype · Demo data only</small></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  </div>;
}
