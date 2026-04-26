// Tiny script. Big ambitions.

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

// handle github showing filename in URL
if (window.location.pathname.endsWith("/index.html")) {
  window.history.replaceState(null, "", window.location.pathname.replace("/index.html", "/"));
}
