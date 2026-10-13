require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Starter data is stored in memory, not a database.
let foods = [
  {
    id: crypto.randomUUID(),
    donor: "Green Leaf Cafe",
    name: "Fresh vegetarian meals",
    description: "Freshly prepared meals. Confirm ingredients and storage before collection.",
    quantity: "8 meal boxes",
    category: "Cooked Meals",
    location: "Thrissur",
    availableUntil: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    status: "Available"
  },
  {
    id: crypto.randomUUID(),
    donor: "Sunrise Bakery",
    name: "Bread and buns",
    description: "Bakery surplus. Check freshness before collection.",
    quantity: "15 pieces",
    category: "Bakery",
    location: "Kochi",
    availableUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    status: "Available"
  }
];

function removeExpiredFoods() {
  const now = Date.now();
  foods = foods.filter(
    (food) => new Date(food.availableUntil).getTime() > now
  );
}

app.get("/", (req, res) => {
  res.json({
    name: "SharePlate API",
    status: "running",
    health: "/api/health",
    foods: "/api/foods"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SharePlate API is running" });
});

app.get("/api/foods", (req, res) => {
  removeExpiredFoods();
  res.json(foods);
});

app.post("/api/foods", (req, res) => {
  const {
    donor, name, description, quantity,
    category, location, availableUntil
  } = req.body;

  if (
    !donor || !name || !quantity || !category ||
    !location || !availableUntil
  ) {
    return res.status(400).json({
      message: "Please fill in all required donation fields."
    });
  }

  const deadline = new Date(availableUntil);

  if (
    Number.isNaN(deadline.getTime()) ||
    deadline.getTime() <= Date.now()
  ) {
    return res.status(400).json({
      message: "The availability deadline must be in the future."
    });
  }

  const food = {
    id: crypto.randomUUID(),
    donor: String(donor).trim(),
    name: String(name).trim(),
    description: String(description || "").trim(),
    quantity: String(quantity).trim(),
    category: String(category).trim(),
    location: String(location).trim(),
    availableUntil: deadline.toISOString(),
    status: "Available"
  };

  foods.unshift(food);
  res.status(201).json(food);
});

app.post("/api/foods/:id/request", (req, res) => {
  removeExpiredFoods();

  const food = foods.find((item) => item.id === req.params.id);

  if (!food) {
    return res.status(404).json({
      message: "This food listing is unavailable or expired."
    });
  }

  if (food.status !== "Available") {
    return res.status(409).json({
      message: "This food has already been requested."
    });
  }

  food.status = "Requested";

  res.json({
    message: "Food request recorded! Contact the donor to arrange pickup.",
    food
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.listen(PORT, () => {
  console.log(`SharePlate API running at http://localhost:${PORT}`);
});
