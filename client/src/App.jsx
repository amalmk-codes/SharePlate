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
  // SP_RESCUE_RADAR_IMPACT_V1: location preference for demo matching
  const [radarLocation, setRadarLocation] = useState("");
  // SP_GUIDE_UPGRADE_V1: first-visit onboarding and local natural-language helper
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem("shareplate_onboarding_complete_v1") !== "yes"; }
    catch { return false; }
  });
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([
    { role: "assistant", text: "Hi! I’m SharePlate Guide. Tell me what you want to do, for example: ‘I have 10 meals to donate.’ I can prepare the right form for you." }
  ]);
  const [userRole, setUserRole] = useState("donor");


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

  // SP_GUIDE_UPGRADE_V1
  function finishOnboarding(role = userRole, destination = "Dashboard") {
    setUserRole(role);
    try {
      localStorage.setItem("shareplate_onboarding_complete_v1", "yes");
      localStorage.setItem("shareplate_user_role_v1", role);
    } catch { /* The guide still works for this session if storage is disabled. */ }
    setShowOnboarding(false);
    setPage(destination);
    if (destination !== "Dashboard") setAssistantOpen(false);
  }

  function interpretSharePlateMessage(rawText) {
    const text = rawText.toLowerCase().trim();
    const amountMatch = text.match(/\b(\d{1,4})\b/);
    const amount = amountMatch ? amountMatch[1] : "";
    const mealWord = /\b(meals?|meal boxes?|portions?|servings?)\b/.test(text);
    const bakeryWord = /\b(bread|buns?|bakery|sandwich(?:es)?)\b/.test(text);
    const fruitWord = /\b(fruit|fruits|banana|bananas|apple|apples|orange|oranges)\b/.test(text);
    const vegetableWord = /\b(vegetables?|veggies|carrots?|potatoes?|tomatoes?)\b/.test(text);
    const packagedWord = /\b(packaged|canned|tinned)\b/.test(text);
    const wantsDonate = /\b(donat|donation|give away|share|surplus|leftover|extra food|i have|we have|offer food)\b/.test(text);
    const wantsFind = /\b(find food|need food|looking for food|request food|available food|food rescue|hungry)\b/.test(text);
    const wantsOrg = /\b(organization|organisation|ngo|charity|community group|food bank)\b/.test(text);
    const wantsTrack = /\b(track|tracking|my donation|donation status|pickup status|collection status)\b/.test(text);
    const wantsPledge = /\b(pledge|buy for|support an organization|support an organisation|contribute money|food needs)\b/.test(text);

    if (wantsDonate) {
      let category = "Other";
      let name = "Surplus food donation";
      if (mealWord) { category = "Cooked Meals"; name = "Fresh meal donation"; }
      else if (bakeryWord) { category = "Bakery"; name = "Bakery food donation"; }
      else if (fruitWord) { category = "Fruits"; name = "Fresh fruit donation"; }
      else if (vegetableWord) { category = "Vegetables"; name = "Fresh vegetable donation"; }
      else if (packagedWord) { category = "Packaged Food"; name = "Packaged food donation"; }
      const unit = mealWord ? "meals" : bakeryWord ? "pieces" : fruitWord ? "pieces" : vegetableWord ? "kg" : "items";
      return { type: "donate", category, name, quantity: amount ? `${amount} ${unit}` : "", reply: `I’ll open the donation form${amount ? ` and fill in ${amount} ${unit}` : ""}. Please add your donor name, pickup location, availability deadline, and any ingredient/storage details before publishing.` };
    }
    if (wantsFind) return { type: "find", reply: "I’ll take you to Food Rescue, where you can search listings, filter by category, and request available food." };
    if (wantsOrg) return { type: "orgs", reply: "I’ll open Organizations so you can explore the sample community partners and their listed needs." };
    if (wantsTrack) return { type: "track", reply: "I’ll open Track Donations to review demo food requests, pickups, and pledges saved in this browser." };
    if (wantsPledge) return { type: "pledge", reply: "I’ll open Buy & Donate. Choose an organization need and record a demo pledge. No payment is taken." };
    if (/\b(hello|hi|hey|help|start|how do i use|what can you do)\b/.test(text)) {
      return { type: "help", reply: "I can guide you to the right place. Try ‘I have 10 meals to donate’, ‘I need food’, ‘Find an NGO’, ‘I want to support rice needs’, or ‘Track my donation’. This helper runs locally and does not call an external AI service." };
    }
    return { type: "help", reply: "I’m not sure which workflow you mean yet. Try ‘I have 10 meals to donate’, ‘Find food’, ‘Find organizations’, ‘Support an organization’, or ‘Track donations’. This is a local intent-based helper, not a cloud AI model." };
  }

  function sendAssistantMessage(e) {
    e.preventDefault();
    const message = assistantInput.trim();
    if (!message) return;
    const result = interpretSharePlateMessage(message);
    setAssistantMessages(messages => [
      ...messages,
      { role: "user", text: message },
      { role: "assistant", text: result.reply }
    ]);
    setAssistantInput("");

    if (result.type === "donate") {
      setDonation(current => ({
        ...current,
        name: result.name || current.name,
        quantity: result.quantity || current.quantity,
        category: result.category || current.category,
        description: current.description || "Please add ingredients, preparation time, storage conditions, and collection notes."
      }));
      setPage("Donate Food");
      setAssistantOpen(false);
    } else if (result.type === "find") {
      setPage("Food Rescue");
      setAssistantOpen(false);
    } else if (result.type === "orgs") {
      setPage("Organizations");
      setAssistantOpen(false);
    } else if (result.type === "track") {
      setPage("Track Donations");
      setAssistantOpen(false);
    } else if (result.type === "pledge") {
      setPage("Buy & Donate");
      setAssistantOpen(false);
    }
  }

  function reopenGuide() {
    setShowOnboarding(true);
    setAssistantOpen(false);
  }

  const nav = ["Dashboard", "Food Rescue", "Rescue Radar", "Buy & Donate", "Organizations", "Track Donations", "Impact Passport"];

  return <div className="app">
    <aside className="sidebar">
      <a className="logo" href="#top" onClick={() => setPage("Dashboard")}><span>♧</span> SharePlate</a>
      <p className="nav-caption">WORKSPACE</p>
      {nav.map((n, i) => <button key={n} className={`nav-item ${page === n ? "active" : ""}`} onClick={() => setPage(n)}><span>{["▦", "🍱", "✦", "🛒", "🤝", "♡", "✺"][i]}</span>{n}</button>)}
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
        <div className="topbar-actions"><button className="top-quiet" onClick={() => setPage("Rescue Radar")}>✦ Rescue Radar</button><button className="top-action" onClick={() => setPage("Donate Food")}>＋ List food</button></div>
      </header>

      <section className="welcome">
        <div><span className="eyebrow">GOOD FOOD. BETTER TOMORROW.</span>
          <h1>Small acts.<br/><span>Big impact.</span></h1>
          <p>Rescue surplus food, support community needs and make every contribution count.</p>
          <div className="welcome-actions">
            <button className="primary" onClick={() => setPage("Donate Food")}>＋ Donate surplus food</button>
            <button className="secondary" onClick={() => setPage("Buy & Donate")}>Support an organization ↗</button>
            <button className="radar-hero-button" onClick={() => setPage("Rescue Radar")}>✦ Open Rescue Radar</button>
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


      {/* SP_RESCUE_RADAR_IMPACT_V1: Rescue Radar */}
      {page === "Rescue Radar" && <section className="page-section radar-page">
        <div className="radar-hero">
          <div>
            <span className="eyebrow radar-eyebrow">SHAREPLATE INTELLIGENCE</span>
            <h2>Rescue Radar<span>.</span></h2>
            <p>Find the next best rescue. Listings are ranked by urgency first, with a location match when you enter your town.</p>
            <div className="radar-tags"><span>✦ Deadline-aware</span><span>⌖ Location-aware</span><span>♡ Community-first</span></div>
          </div>
          <div className="radar-orbit" aria-hidden="true"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-core">🍃</div><span className="orbit-dot dot-one"/><span className="orbit-dot dot-two"/><span className="orbit-dot dot-three"/></div>
        </div>
        <div className="radar-controls panel">
          <label><span>YOUR TOWN / AREA</span><input value={radarLocation} onChange={e => setRadarLocation(e.target.value)} placeholder="e.g. Thrissur or Irinjalakuda" /></label>
          <div className="radar-live"><i/> {foods.filter(f => statusOf(f, now) === "Available").length} available listings scanned</div>
          <button className="secondary" onClick={() => setRadarLocation("")}>Clear location</button>
        </div>
        <div className="radar-summary">
          <article><span>01</span><strong>Urgency first</strong><small>Food with the shortest time remaining rises to the top.</small></article>
          <article><span>02</span><strong>Local relevance</strong><small>Matching town names receive a location-match label.</small></article>
          <article><span>03</span><strong>Actionable next step</strong><small>Request available food directly from a recommendation.</small></article>
        </div>
        <div className="radar-list-heading"><div><span className="eyebrow">YOUR RESCUE QUEUE</span><h3>Best opportunities right now</h3></div><span className="radar-count">{foods.filter(f => statusOf(f, now) === "Available").length} available</span></div>
        <div className="radar-results">
          {[...foods].filter(f => statusOf(f, now) === "Available").sort((a, b) => {
            const aLocal = radarLocation.trim() && String(a.location || "").toLowerCase().includes(radarLocation.trim().toLowerCase()) ? 1 : 0;
            const bLocal = radarLocation.trim() && String(b.location || "").toLowerCase().includes(radarLocation.trim().toLowerCase()) ? 1 : 0;
            return bLocal - aLocal || Number(a.until) - Number(b.until);
          }).map((f, index) => {
            const localMatch = radarLocation.trim() && String(f.location || "").toLowerCase().includes(radarLocation.trim().toLowerCase());
            const msLeft = Number(f.until) - now;
            const urgency = msLeft <= 2 * 3600000 ? "Act soon" : msLeft <= 6 * 3600000 ? "Plan pickup" : "Time available";
            const emoji = ({"Cooked Meals":"🍱","Bakery":"🥖","Fruits":"🍎","Vegetables":"🥦","Packaged Food":"🥫","Other":"🥗"})[f.category] || "🥗";
            return <article className="radar-result" key={f.id}>
              <div className="radar-rank">{String(index + 1).padStart(2, "0")}<small>PRIORITY</small></div>
              <div className="radar-food-icon">{emoji}</div>
              <div className="radar-result-main"><div className="radar-labels"><span className={msLeft <= 2 * 3600000 ? "urgent-label" : "normal-label"}>{urgency}</span>{localMatch && <span className="local-label">⌖ Matches your area</span>}</div><h3>{f.name}</h3><p>{f.donor} · {f.location} · {f.quantity}</p><small>{f.description}</small></div>
              <div className="radar-deadline"><small>TIME LEFT</small><strong>{deadlineLabel(f.until, now)}</strong><button className="primary" onClick={() => requestFood(f.id)}>Request rescue →</button></div>
            </article>;
          })}
          {!foods.some(f => statusOf(f, now) === "Available") && <div className="empty">No available listings right now. Check again later or list surplus food.</div>}
        </div>
        <p className="hint">Recommendation logic runs locally in this browser. Location matching uses the text you enter; it does not use GPS or calculate real distance.</p>
      </section>}

      {/* SP_RESCUE_RADAR_IMPACT_V1: Impact Passport */}
      {page === "Impact Passport" && <section className="page-section impact-page">
        <div className="passport-hero">
          <div><span className="eyebrow">YOUR SHAREPLATE STORY</span><h2>Small acts.<br/><em>Lasting impact.</em></h2><p>Your Impact Passport collects the activity recorded in this browser demo. Real-world impact is not independently verified.</p></div>
          <div className="passport-seal"><span>✦</span><strong>SHARE</strong><small>WITH CARE</small><span>♧</span></div>
        </div>
        <div className="passport-metrics">
          <article><span>🍱</span><strong>{stats.collected}</strong><small>Food rescues completed</small></article>
          <article><span>🤝</span><strong>{stats.pledges}</strong><small>Support pledges recorded</small></article>
          <article><span>✓</span><strong>{stats.delivered}</strong><small>Pledges marked delivered</small></article>
          <article><span>🌱</span><strong>{stats.listed}</strong><small>Listings created / seeded</small></article>
        </div>
        <div className="passport-columns">
          <article className="panel passport-achievements"><span className="eyebrow">MILESTONE WALL</span><h3>Your community badges</h3>
            <div className={`achievement ${stats.listed > 0 ? "earned" : ""}`}><span>🌱</span><div><strong>First seed</strong><small>Food listings are part of the rescue journey.</small></div><b>{stats.listed > 0 ? "UNLOCKED" : "LOCKED"}</b></div>
            <div className={`achievement ${stats.requested + stats.collected > 0 ? "earned" : ""}`}><span>🧭</span><div><strong>Rescue explorer</strong><small>Record a food request or completed pickup.</small></div><b>{stats.requested + stats.collected > 0 ? "UNLOCKED" : "LOCKED"}</b></div>
            <div className={`achievement ${stats.collected > 0 ? "earned" : ""}`}><span>💚</span><div><strong>Rescue in action</strong><small>Confirm at least one demo pickup.</small></div><b>{stats.collected > 0 ? "UNLOCKED" : "LOCKED"}</b></div>
            <div className={`achievement ${stats.delivered > 0 ? "earned" : ""}`}><span>🏅</span><div><strong>Promise kept</strong><small>Mark a demo pledge as delivered.</small></div><b>{stats.delivered > 0 ? "UNLOCKED" : "LOCKED"}</b></div>
          </article>
          <article className="panel passport-history"><span className="eyebrow">ACTIVITY LOG</span><h3>Recent rescue activity</h3>
            {[...foods.filter(f => ["Requested","Collected"].includes(f.status)).map(f => ({id:f.id, icon:"🍱", title:f.name, detail:`${f.donor} · ${f.location}`, status:f.status, created:f.created || 0})), ...pledges.map(p => ({id:p.id, icon:"🤝", title:`${p.quantity} ${p.unit} ${p.item}`, detail:`${p.name} · ${p.org}`, status:p.status, created:p.created || 0}))].sort((a,b) => b.created-a.created).slice(0,8).map(item => <div className="passport-history-row" key={item.id}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><b>{item.status}</b></div>)}
            {!foods.some(f => ["Requested","Collected"].includes(f.status)) && pledges.length === 0 && <p className="hint">Your rescue and pledge activity will appear here as you use the demo.</p>}
            <button className="primary full" onClick={() => setPage("Track Donations")}>Open full tracking →</button>
          </article>
        </div>
        <div className="passport-share"><div><span className="eyebrow">KEEP THE GOOD GOING</span><h3>Your next action matters.</h3><p>Every listing and confirmed pickup helps demonstrate how a shared food-rescue workflow could work.</p></div><div className="passport-share-actions"><button className="primary" onClick={() => setPage("Donate Food")}>＋ List food</button><button className="secondary" onClick={() => setPage("Rescue Radar")}>Explore Rescue Radar ↗</button></div></div>
        <p className="hint">Demo transparency: some initial listings are sample data. Counts are not equivalent to verified meals served, emissions avoided, or people helped.</p>
      </section>}

      {/* SP_GUIDE_UPGRADE_V1: onboarding modal */}
      {showOnboarding && <div className="sp-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="sp-guide-title">
        <section className="sp-guide-modal">
          <button className="sp-guide-close" type="button" aria-label="Close welcome guide" onClick={() => finishOnboarding(userRole, "Dashboard")}>×</button>
          <div className="sp-guide-mark">🌱</div>
          <span className="eyebrow">WELCOME TO SHAREPLATE</span>
          <h2 id="sp-guide-title">Share more. Waste less.</h2>
          <p className="sp-guide-intro">Choose what brings you here. We’ll point you to the right place and help you get started.</p>
          <div className="sp-guide-roles">
            <button type="button" className={`sp-guide-role ${userRole === "donor" ? "selected" : ""}`} onClick={() => setUserRole("donor")}><span>🍲</span><strong>I have food to share</strong><small>List surplus meals, bakery items or produce.</small></button>
            <button type="button" className={`sp-guide-role ${userRole === "community" ? "selected" : ""}`} onClick={() => setUserRole("community")}><span>🤝</span><strong>I need food / represent a group</strong><small>Find available food and community partners.</small></button>
            <button type="button" className={`sp-guide-role ${userRole === "supporter" ? "selected" : ""}`} onClick={() => setUserRole("supporter")}><span>💚</span><strong>I want to support</strong><small>Explore organization needs and track pledges.</small></button>
          </div>
          <div className="sp-guide-steps"><strong>Your quick start</strong><span><b>1</b> Choose your goal</span><span><b>2</b> Follow the guided form</span><span><b>3</b> Save your demo activity in this browser</span></div>
          <div className="sp-guide-actions">
            <button className="primary" type="button" onClick={() => finishOnboarding(userRole, userRole === "donor" ? "Donate Food" : userRole === "community" ? "Food Rescue" : "Buy & Donate")}>Start my guided workflow →</button>
            <button className="secondary" type="button" onClick={() => { finishOnboarding(userRole, "Dashboard"); setAssistantOpen(true); }}>Ask SharePlate Guide</button>
          </div>
          <p className="sp-guide-note">Demo only: data is saved in this browser. Sample organizations are not verified, and no real payment or pickup is made.</p>
        </section>
      </div>}

      {/* SP_GUIDE_UPGRADE_V1: floating assistant */}
      <button className="sp-guide-launcher" type="button" onClick={() => setAssistantOpen(open => !open)} aria-label="Open SharePlate Guide">{assistantOpen ? "×" : "✦"}<span>{assistantOpen ? "Close guide" : "Ask SharePlate Guide"}</span></button>
      {assistantOpen && <section className="sp-guide-chat" aria-label="SharePlate Guide assistant">
        <header className="sp-guide-chat-head"><div className="sp-guide-avatar">✦</div><div><strong>SharePlate Guide</strong><small>Local workflow assistant · Demo mode</small></div><button type="button" onClick={() => setAssistantOpen(false)} aria-label="Close assistant">×</button></header>
        <div className="sp-guide-chat-body" aria-live="polite">
          {assistantMessages.map((message, index) => <div key={`${index}-${message.role}`} className={`sp-guide-message ${message.role}`}>{message.text}</div>)}
          <div className="sp-guide-suggestions"><button type="button" onClick={() => setAssistantInput("I have 10 meals to donate")}>I have 10 meals to donate</button><button type="button" onClick={() => setAssistantInput("I need food")}>I need food</button><button type="button" onClick={() => setAssistantInput("Find an NGO")}>Find an NGO</button><button type="button" onClick={() => setAssistantInput("Track my donation")}>Track my donation</button></div>
        </div>
        <form className="sp-guide-chat-form" onSubmit={sendAssistantMessage}><input value={assistantInput} onChange={e => setAssistantInput(e.target.value)} aria-label="Message SharePlate Guide" placeholder="Tell me what you want to do…" maxLength={500}/><button className="primary" type="submit" aria-label="Send message">➤</button></form>
        <button className="sp-guide-restart" type="button" onClick={reopenGuide}>Show first-time guide again</button>
      </section>}

      <footer className="footer"><strong>♧ SharePlate</strong><span>Share more. Waste less. Build a caring community.</span><small>Hackathon prototype · Demo data only</small></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  </div>;
}
