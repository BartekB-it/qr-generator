// script.js – generator kodów QR dla dowolnego URL
// Uwaga: QR zawiera dokładnie ten tekst, który użytkownik poda w polu.
// Dzięki temu jest kompatybilny z Twoim obecnym skanerem, który oczekuje URL-a.

/**
 * Prosta normalizacja – obcina spacje z przodu/tyłu.
 * (Jeśli chcesz, możesz tutaj dodać bardziej zaawansowaną walidację/uzupełnianie https://)
 */
function normalizeInput(value) {
    return value.trim();
}

let qrInstance = null;

function initQr() {
    const container = document.getElementById("qr-container");
    if (!container) return;

    // Usuwamy placeholder (zostanie tylko przy braku adresu)
    const placeholder = document.getElementById("qr-placeholder");
    if (placeholder) {
        placeholder.remove();
    }

    qrInstance = new QRCode(container, {
        text: "https://gov.pl", // domyślny przykładowy adres (zostanie nadpisany)
        width: 220,
        height: 220,
        colorDark: "#111827",
        colorLight: "#fffaf1",
        correctLevel: QRCode.CorrectLevel.M
    });
}

function updateQr(text) {
    if (!qrInstance) {
        initQr();
    }
    if (!qrInstance) return;

    const value = normalizeInput(text);

    if (!value) {
        // Jeśli pole jest puste, czyścimy QR i pokazujemy placeholder
        const container = document.getElementById("qr-container");
        container.innerHTML =
            '<div id="qr-placeholder" class="qr-placeholder">Wklej adres URL powyżej, aby wygenerować kod QR</div>';
        qrInstance = null;
        return;
    }

    // W prototypie wpisujemy dokładnie to, co użytkownik podał
    // (dla pełnej produkcji można tu wprowadzić schemat z nonce + backendem).
    qrInstance.clear();
    qrInstance.makeCode(value);
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("url-input");

    // Generujemy kod QR przy wpisywaniu (z lekkim debounce)
    let debounceTimer = null;

    input.addEventListener("input", () => {
        const value = input.value;

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            updateQr(value);
        }, 400);
    });

    // Enter zatwierdza od razu (bez debounce)
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            updateQr(input.value);
        }
    });
});
