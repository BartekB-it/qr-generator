# Prawda w sieci – Generator kodów QR dla stron gov.pl

DEMO: [https://bartekb-it.github.io/qr-generator/](https://bartekb-it.github.io/qr-generator/)

Prosty generator kodów QR, stylizowany na interfejs administracji publicznej / mObywatel.  
**Docelowo działa jako widżet umieszczony bezpośrednio na stronach `gov.pl` (np. kafelek z boku lub popup na telefonie), który generuje kod QR powiązany z aktualną stroną.**
Kod ten obywatel może zeskanować w aplikacji mObywatel (moduł Verifier), żeby upewnić się, że strona jest potwierdzonym serwisem administracji publicznej.

W wersji frontend-only (np. na GitHub Pages):

- użytkownik wkleja **adres URL**,
- aplikacja generuje **kod QR** z tego adresu (z automatycznym `https://`),
- kod może zostać zeskanowany przez naszą aplikację **Verifier**, która sprawdzi:
  - domenę `.gov.pl`,
  - TLS/SSL,
  - obecność na oficjalnej liście domen.

---

## Architektura

- **Frontend:** HTML + CSS + vanilla JS
- **QR:** biblioteka JavaScript (`qrcode.js`) działająca w przeglądarce
- **Backend:** brak w wersji hostowanej na GitHub Pages  
  (w trybie „pełnym” może korzystać z backendu verifera, patrz niżej)

Struktura repozytorium:

```text
.
├── index.html    # Interfejs generatora (formularz + podgląd kodu QR)
├── script.js     # Logika: normalizacja URL, generowanie QR
├── style.css     # Stylizacja (mock panelu administracji / mObywatel)
└── README.md     # Ten plik
```

---

## Funkcje

### 1. Wklej adres → wygeneruj kod QR

- Użytkownik widzi pole:

  > „Tu wklej dowolny adres URL”

- Przy wpisywaniu:
  - JS przycina whitespace,
  - gdy user wpisze np. `gov.pl` → logika dokleja `https://` (czyli QR będzie zawierał `https://gov.pl`),
  - po krótkim opóźnieniu (`debounce`) albo po wciśnięciu Enter wywoływana jest funkcja:

    ```js
    createSessionAndUpdateQr(value);
    ```

- W wersji „light” (front-only):

  ```js
  function createSessionAndUpdateQr(rawUrl) {
      const value = normalizeInput(rawUrl);

      if (!value) {
          showPlaceholder("Wklej adres URL powyżej, aby wygenerować kod QR");
          return;
      }

      let urlToEncode = value;
      if (!/^https?:\/\//i.test(urlToEncode)) {
          urlToEncode = "https://" + urlToEncode;
      }

      const inst = ensureQrInstance();
      if (!inst) {
          showPlaceholder("Nie udało się zainicjalizować generatora kodów QR");
          return;
      }

      inst.clear();
      inst.makeCode(urlToEncode);
  }
  ```

- W efekcie użytkownik od razu widzi kod QR odpowiadający wklejonemu adresowi.

### 2. Współpraca z Verifierem

Ten projekt jest zaprojektowany tak, żeby współpracować z aplikacją **Verifier**:

- kod QR generowany z adresu gov.pl,
- obywatel skanuje go w aplikacji verifier (lub docelowo mObywatel),
- verifier:
  - sprawdza domenę,
  - sprawdza TLS/SSL,
  - sprawdza obecność na białej liście.

Dzięki temu:

- generator QR może być umieszczony np. w **panelu CMS urzędu**,
- a logika bezpieczeństwa zostaje po stronie **Verifiera** (i backendu).

---

## Tryb „pełny” – z backendem (nonce / sesje)

W docelowej, bardziej zaawansowanej wersji generator zamiast wkładać do QR „goły” URL, mógłby korzystać z backendu verifera:

1. Generator wywołuje:

   ```http
   POST /api/create-session
   {
     "url": "https://example.gov.pl/jakas-usluga"
   }
   ```

2. Backend:
   - waliduje URL,
   - tworzy jednorazową sesję z tokenem (`token`, `qr_payload`, `expires_in`),
   - odsyła np.:

     ```json
     {
       "ok": true,
       "token": "ABC123...",
       "qr_payload": "https://prawda-w-sieci-verifier.onrender.com/verify?token=ABC123...",
       "expires_in": 120
     }
     ```

3. Generator kodów QR:
   - generuje QR na podstawie `qr_payload`,
   - dzięki temu w kodzie QR jest **jednorazowy link do sesji**, a nie surowy adres.

W obecnej wersji (np. na GitHub Pages) ten tryb jest wyłączony, żeby aplikacja nie zależała od backendu.  
Zamiast tego używany jest prosty tryb „bezpośredni URL → QR”.

---

## Uruchomienie lokalne

Wersja front-only:

1. Sklonuj repozytorium:

   ```bash
   git clone https://github.com/TWOJ-USER/prawda-w-sieci-qr-generator.git
   cd prawda-w-sieci-qr-generator
   ```

2. Otwórz `index.html` w przeglądarce:

   - możesz po prostu dwukliknąć plik,
   - albo uruchomić prosty serwer HTTP (np. Python):

     ```bash
     python -m http.server 8000
     ```

     i wejść na `http://127.0.0.1:8000`.

---

## Bezpieczeństwo

- Generator sam **nie weryfikuje bezpieczeństwa adresu** – jego rolą jest tylko wygenerowanie QR.
- W prezentowanym rozwiązaniu logika bezpieczeństwa:
  - walidacja domen,
  - TLS/SSL,
  - biała lista stron rządowych,

  znajduje się w aplikacji **Verifier**, która interpretuje kod QR. W naszym scenariuszu to właśnie Verifier osadzony w mObywatel sprawdza domenę `gov.pl`, certyfikat TLS oraz oficjalną listę domen, a generator pełni rolę wygodnego widżetu na stronie gov, który wystawia kod do zeskanowania.

- W pełnym wdrożeniu:
  - generator byłby umieszczony za logowaniem w panelu administracyjnym (np. tylko dla urzędników),
  - integracja z `/api/create-session` backendu Verifiera pozwalałaby tworzyć **jednorazowe QR-y** powiązane z sesją i polityką bezpieczeństwa.

---

## Licencja

Prototyp na potrzeby wyzwania „Prawda w sieci”.  
Możesz dodać np. licencję MIT lub Apache-2.0 według własnych potrzeb.
