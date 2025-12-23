const grid = document.getElementById("productGrid");
const searchBox = document.getElementById("searchBox");
const categoryFilter = document.getElementById("categoryFilter");
const sortPrice = document.getElementById("sortPrice");

let products = [];
let categories = [];

// Fetch from Fake Store API
const fetchProducts = async () => {
  const res = await fetch("https://fakestoreapi.com/products");
  products = await res.json();

  const catRes = await fetch("https://fakestoreapi.com/products/categories");
  categories = await catRes.json();

  renderCategoryOptions();
  render(products);
};

// Build category dropdown
const renderCategoryOptions = () => {
  categoryFilter.innerHTML =
    `<option value="all">All Categories</option>` +
    categories.map(c => `<option value="${c}">${c}</option>`).join("");
};

// Render on screen
const render = (items) => {
  grid.innerHTML = items
    .map(({ title, price, category, image }) => `
      <div class="card">
        <img src="${image}">
        <h3>${title}</h3>
        <p class="price">$${price.toFixed(2)}</p>
        <p>${category}</p>
      </div>
    `)
    .join("");
};

// Apply search + filter + sort in combination
const applyFilters = () => {
  let result = [...products];

  // Search
  const search = searchBox.value.toLowerCase();
  result = result.filter(p =>
    p.title.toLowerCase().includes(search)
  );

  // Category Filter
  if (categoryFilter.value !== "all") {
    result = result.filter(p =>
      p.category === categoryFilter.value
    );
  }

  // Sort
  if (sortPrice.value === "asc") {
    result.sort((a, b) => a.price - b.price);
  } else if (sortPrice.value === "desc") {
    result.sort((a, b) => b.price - a.price);
  }

  render(result);
};

// Event listeners
searchBox.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
sortPrice.addEventListener("change", applyFilters);

// Load initial data
fetchProducts();
