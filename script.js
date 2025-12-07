// script.js – generator kodów QR z wykorzystaniem backendu (nonce + sesja)

const API_BASE = ""; 
// "" = ten sam origin co backend (np. gdy generator stoi za tym samym Flaskiem).
// Jeśli backend będzie gdzie indziej, ustaw tu pełny URL, np. "https://verifier.gov.pl".

let qrInstance = null;

/**
 * Prosta normalizacja – obcina spacje.
 * Tutaj można dodać dodatkową walidację / wymuszanie https.
 */
function normalizeInput(value) {
    return value.trim();
}

/**
 * Czyści kontener QR i wyświetla prostą wiadomość.
 */
function showPlaceholder(message) {
    const container = document.getElementById("qr-container");
    if (!container) return;

    container.innerHTML =
        `<div id="qr-placeholder" class="qr-placeholder">${message}</div>`;
    qrInstance = null;
}

/**
 * Tworzy instancję QRCode, jeśli jeszcze nie istnieje.
 */
function ensureQrInstance() {
    if (qrInstance) {
        return qrInstance;
    }
    const container = document.getElementById("qr-container");
    if (!container) return null;

    container.innerHTML = "";
    qrInstance = new QRCode(container, {
        text: "",
        width: 220,
        height: 220,
        colorDark: "#111827",
        colorLight: "#fffaf1",
        correctLevel: QRCode.CorrectLevel.M
    });
    return qrInstance;
}

/**
 * Wywołuje backend, żeby utworzyć sesję (nonce) dla danego URL
 * i generuje QR na podstawie zwróconego qr_payload.
 */
async function createSessionAndUpdateQr(rawUrl) {
    const value = normalizeInput(rawUrl);

    if (!value) {
        showPlaceholder("Wklej adres URL powyżej, aby wygenerować kod QR");
        return;
    }

    showPlaceholder("Tworzę sesję weryfikacji i generuję kod QR...");

    try {
        const resp = await fetch(`${API_BASE}/api/create-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: value })
        });

        if (!resp.ok) {
            let msg = `Błąd serwera (status ${resp.status})`;
            try {
                const data = await resp.json();
                if (data && data.error) {
                    msg = data.error;
                }
            } catch (e) {
                // ignorujemy
            }
            showPlaceholder(`Nie udało się utworzyć sesji: ${msg}`);
            return;
        }

        const data = await resp.json();
        if (!data.ok) {
            showPlaceholder(`Nie udało się utworzyć sesji: ${data.error || "Nieznany błąd"}`);
            return;
        }

        const qrPayload = data.qr_payload;
        const token = data.token;

        const inst = ensureQrInstance();
        if (!inst) {
            showPlaceholder("Nie udało się zainicjalizować generatora kodów QR");
            return;
        }

        inst.clear();
        inst.makeCode(qrPayload);

        // (Opcjonalnie) możesz gdzieś w UI pokazać token / status ważności:
        // console.log("Nowa sesja:", token, "ważna (s) =", data.expires_in);

    } catch (err) {
        showPlaceholder(`Nie udało się utworzyć sesji: ${err.message || err}`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("url-input");
    if (!input) return;

    // Domyślny placeholder
    showPlaceholder("Wklej adres URL powyżej, aby wygenerować kod QR");

    let debounceTimer = null;

    // Generujemy kod QR przy wpisywaniu (z lekkim debounce)
    input.addEventListener("input", () => {
        const value = input.value;

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            createSessionAndUpdateQr(value);
        }, 400);
    });

    // Enter = natychmiastowe wygenerowanie sesji
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            createSessionAndUpdateQr(input.value);
        }
    });
});
