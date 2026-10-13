import { useEffect, useState } from "react";
import axios from "axios";

const categories = [
  "Cooked Meals",
  "Bakery",
  "Fruits",
  "Vegetables",
  "Packaged Food",
  "Other"
];

const emptyForm = {
  donor: "",
  name: "",
  description: "",
  quantity: "",
  category: "Cooked Meals",
  location: "",
  availableUntil: ""
};

export default function App() {
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadFoods() {
    try {
      const response = await axios.get("/api/foods");
      setFoods(response.data);
      setMessage("");
    } catch {
      setMessage(
        "Cannot connect to the server. Start the backend first."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  function updateForm(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function submitDonation(event) {
    event.preventDefault();
    setMessage("");

    try {
      await axios.post("/api/foods", form);
      setForm(emptyForm);
      setMessage("Your food donation was added successfully!");
      await loadFoods();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Could not add the donation. Please try again."
      );
    }
  }

  async function requestFood(id) {
    try {
      const response = await axios.post(
        `/api/foods/${id}/request`
      );
      setMessage(response.data.message);
      await loadFoods();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Could not request this donation."
      );
    }
  }

  const visibleFoods = foods.filter((food) => {
    const text = [
      food.name,
      food.category,
      food.location,
      food.donor
    ].join(" ").toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">♧</span>
          SharePlate
        </a>
        <nav>
          <a href="#how">How it works</a>
          <a href="#food">Available food</a>
          <a href="#donate" className="nav-button">
            Donate food
          </a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              GOOD FOOD. BETTER TOMORROW.
            </span>
            <h1>
              Share more.
              <br />
              <span>Waste less.</span>
            </h1>
            <p>
              Surplus food can make a real difference.
              Connect with your community and help food
              reach people who need it.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#donate">
                Donate surplus food
              </a>
              <a className="secondary-button" href="#food">
                Find available food
              </a>
            </div>
            <div className="hero-note">
              A community platform for sharing food responsibly.
            </div>
          </div>

          <div className="hero-art" aria-label="Food sharing">
            <div className="art-circle">
              <span className="food-emoji">🥗</span>
            </div>
            <div className="floating-card">
              <span>💚</span>
              <div>
                <strong>Food with a purpose</strong>
                <small>Share with your community</small>
              </div>
            </div>
          </div>
        </section>

        <section className="steps-section" id="how">
          <div className="section-heading">
            <span className="eyebrow">SIMPLE AND MEANINGFUL</span>
            <h2>How SharePlate works</h2>
            <p>Three simple steps to make surplus food useful.</p>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <div className="step-icon">🍲</div>
              <h3>1. Share food</h3>
              <p>
                Restaurants, bakeries and individuals list
                surplus food with pickup details.
              </p>
            </article>
            <article className="step-card">
              <div className="step-icon">🤝</div>
              <h3>2. Connect</h3>
              <p>
                NGOs and community groups discover available
                donations and request them.
              </p>
            </article>
            <article className="step-card">
              <div className="step-icon">💚</div>
              <h3>3. Collect responsibly</h3>
              <p>
                Coordinate collection and handle food safely
                before its availability deadline.
              </p>
            </article>
          </div>
        </section>

        <section className="food-section" id="food">
          <div className="section-heading">
            <span className="eyebrow">COMMUNITY DONATIONS</span>
            <h2>Available food</h2>
            <p>Explore donations shared by the community.</p>
          </div>

          <input
            className="search-input"
            aria-label="Search donations"
            placeholder="Search by food, category, donor or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {message && (
            <p className="notice" role="status">{message}</p>
          )}

          {loading ? (
            <p className="empty-state">Loading food listings...</p>
          ) : visibleFoods.length === 0 ? (
            <p className="empty-state">
              No matching donations yet. You can add one below.
            </p>
          ) : (
            <div className="food-grid">
              {visibleFoods.map((food) => (
                <article className="food-card" key={food.id}>
                  <div className="food-card-top">
                    <span className="food-symbol">🍱</span>
                    <span className="category-tag">
                      {food.category}
                    </span>
                  </div>
                  <h3>{food.name}</h3>
                  <p>{food.description || "Food donation"}</p>
                  <div className="food-details">
                    <span>📦 {food.quantity}</span>
                    <span>📍 {food.location}</span>
                    <span>👤 {food.donor}</span>
                    <span>
                      ⏰ Available until:{" "}
                      {new Date(food.availableUntil).toLocaleString()}
                    </span>
                  </div>
                  <button
                    className="request-button"
                    onClick={() => requestFood(food.id)}
                    disabled={food.status !== "Available"}
                  >
                    {food.status === "Available"
                      ? "Request food"
                      : food.status}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="donate-section" id="donate">
          <div className="donate-intro">
            <span className="eyebrow">MAKE A DIFFERENCE</span>
            <h2>Have extra food?</h2>
            <p>
              Add your donation so an NGO or community group
              can find it and arrange collection.
            </p>
            <div className="safety-note">
              <strong>Food safety matters</strong>
              <p>
                Share accurate ingredients, storage information,
                pickup times and a safe consumption deadline.
                Do not list spoiled or unsafe food.
              </p>
            </div>
          </div>

          <form className="donate-form" onSubmit={submitDonation}>
            <h3>List a food donation</h3>

            <label>
              Donor or organization name *
              <input
                name="donor"
                value={form.donor}
                onChange={updateForm}
                placeholder="Restaurant, bakery or your name"
                required
              />
            </label>

            <label>
              Food name *
              <input
                name="name"
                value={form.name}
                onChange={updateForm}
                placeholder="e.g. Fresh vegetable meals"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="Ingredients, storage details or notes"
                rows="3"
              />
            </label>

            <div className="form-row">
              <label>
                Quantity *
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={updateForm}
                  placeholder="e.g. 10 meal boxes"
                  required
                />
              </label>
              <label>
                Category *
                <select
                  name="category"
                  value={form.category}
                  onChange={updateForm}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Pickup location *
              <input
                name="location"
                value={form.location}
                onChange={updateForm}
                placeholder="Area, town or pickup address"
                required
              />
            </label>

            <label>
              Available until *
              <input
                name="availableUntil"
                type="datetime-local"
                value={form.availableUntil}
                onChange={updateForm}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString().slice(0, 16)}
                required
              />
            </label>

            <button className="primary-button submit-button" type="submit">
              Publish donation
            </button>
          </form>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#home">
          SharePlate
        </a>
        <p>Share more. Waste less. Build a caring community.</p>
        <small>
          Starter project for food sharing. Coordinate pickup
          and food safety directly with the donor.
        </small>
      </footer>
    </>
  );
}
