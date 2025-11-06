// ✅ Backend base URL
const API_BASE_URL = "https://e-dealer-backend-production.up.railway.app/api";

// Utility: Show message
function showMessage(msg, isError = false) {
  const messageBox = document.getElementById("message");
  if (!messageBox) return;
  messageBox.textContent = msg;
  messageBox.style.color = isError ? "red" : "green";
  messageBox.style.display = "block";
  setTimeout(() => (messageBox.style.display = "none"), 4000);
}

// ✅ Add Property Function
async function addProperty(event) {
  event.preventDefault();

  const form = document.getElementById("addPropertyForm");
  const formData = new FormData(form);

  const propertyData = {
    title: formData.get("title"),
    description: formData.get("description"),
    price: parseFloat(formData.get("price")),
    city: formData.get("city"),
    address: formData.get("address"),
    bedrooms: parseInt(formData.get("bedrooms")),
    bathrooms: parseInt(formData.get("bathrooms")),
    area: parseFloat(formData.get("area")),
    type: formData.get("type"),
    amenities: formData.getAll("amenities"),
    imageUrls: formData.get("imageUrls")?.split(",").map((u) => u.trim()) || [],
  };

  try {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyData),
    });

    if (!response.ok) throw new Error("Failed to add property.");

    const data = await response.json();
    showMessage("✅ Property added successfully!");
    console.log("Property added:", data);

    form.reset();
  } catch (error) {
    console.error(error);
    showMessage("❌ Error adding property: " + error.message, true);
  }
}

// ✅ Fetch All Properties
async function loadProperties() {
  try {
    const response = await fetch(`${API_BASE_URL}/properties`);
    if (!response.ok) throw new Error("Failed to fetch properties.");

    const data = await response.json();
    const properties = data.properties || [];

    const container = document.getElementById("propertiesList");
    if (!container) return;

    container.innerHTML = properties
      .map(
        (prop) => `
      <div class="property-card">
        <img src="${prop.images?.[0] || "default.jpg"}" alt="${prop.title}" />
        <h3>${prop.title}</h3>
        <p>${prop.description}</p>
        <p><b>City:</b> ${prop.location?.city || "N/A"}</p>
        <p><b>Price:</b> ${prop.price} ${prop.currency || ""}</p>
      </div>`
      )
      .join("");
  } catch (error) {
    console.error(error);
    showMessage("❌ Error fetching properties.", true);
  }
}

// ✅ Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addPropertyForm");
  if (form) form.addEventListener("submit", addProperty);

  loadProperties();
});
