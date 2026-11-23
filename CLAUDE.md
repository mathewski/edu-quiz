# edu-quiz

Quiz wielokrotnego wyboru dla uczniów szkoły podstawowej i liceum, opublikowany na
https://mathewski.github.io/edu-quiz/. Pytania generuje AI na podstawie oficjalnych
wymagań z danego przedmiotu. Aplikacja jest w całości statyczna (GitHub Pages):
brak serwera i bazy danych, postęp ucznia zapisywany jest w `localStorage`.

Interfejs i treść pytań są po polsku (UTF-8, polskie znaki).

## Struktura

```
app/                      aplikacja Vue 3 + Vite + TypeScript + Tailwind 3
  public/quizzes.json     lista dostępnych zestawów (plik + nazwa wyświetlana)
  public/<przedmiot>-<klasa>.json   zestawy pytań, np. informatyka-8.json, wos-8.json
  src/composables/        logika (dane, stan, losowanie, localStorage) + testy w __tests__/
  src/components/         komponenty UI
  src/types.ts            typy danych
.github/workflows/deploy.yml   push na main → testy → build → gałąź gh-pages
```

## Komendy (w katalogu `app/`)

```bash
npm run dev          # serwer deweloperski
npm run test -- --run   # testy (vitest), uruchamiane też w CI przed deployem
npm run build        # vue-tsc + vite build
```

Deploy dzieje się automatycznie po pushu na `main`. `vite.config.ts` ma
`base: '/edu-quiz/'`, a pliki JSON są pobierane przez `import.meta.env.BASE_URL` –
nie zmieniaj tego, bo zepsuje się ścieżka na GitHub Pages.

## Format zestawu pytań

```json
[
  {
    "category": "Excel",
    "questions": [
      {
        "question": "Treść pytania",
        "answers": ["odpowiedź A", "odpowiedź B", "odpowiedź C"],
        "correctAnswerIndex": 1
      }
    ]
  }
]
```

- Zawsze dokładnie 3 odpowiedzi, jedna poprawna.
- Kategoria `"Wszystko"` jest zarezerwowana – aplikacja dodaje ją sama jako pierwszą.
- Postęp w `localStorage` jest kluczowany **treścią pytania**. Zmiana treści
  istniejącego pytania resetuje jego postęp u uczniów; treść pytań musi być unikalna
  w obrębie zestawu.

## Dodawanie nowego przedmiotu

1. Źródło: plik z wymaganiami (zwykle PDF z podstawy programowej). Najpierw
   skonwertuj go do markdown, żeby łatwo odnosić się do konkretnych wymagań.
2. Ułóż pytania do każdego wymagania (jedno lub więcej). Wymagania, do których nie da
   się sensownie ułożyć pytania zamkniętego (np. praktyczne „uczeń tworzy…”), pomiń
   i wypisz użytkownikowi listę pominiętych.
3. Pogrupuj pytania w 6–12 tematycznych kategorii (jak np. „Excel”, „Bezpieczeństwo
   i netykieta”).
4. Zapisz jako `app/public/<przedmiot>-<klasa>.json` (np. `biologia-7.json`,
   `informatyka-2lo.json`) i dopisz wpis do `app/public/quizzes.json`, np.
   `{ "file": "biologia-7.json", "name": "Biologia - 7" }`. Dla liceum podawaj poziom:
   `"Informatyka - 2 LO (poziom rozszerzony)"`.
5. Zweryfikuj plik (patrz niżej) i uruchom testy.

Pliki pośrednie (PDF, markdown z wymaganiami, robocze listy pytań) nie trafiają do
repozytorium – w repo jest tylko gotowy JSON.

### Jakość pytań – wymagania

- **Poprawna odpowiedź równomiernie rozłożona** na indeksy 0/1/2 i bez długich serii
  tego samego indeksu z rzędu. Po wygenerowaniu przetasuj odpowiedzi, aktualizując
  `correctAnswerIndex`.
- **Wiarygodne dystraktory**: błędne odpowiedzi muszą „udawać”, że odpowiadają na
  pytanie – ta sama dziedzina, podobna forma i długość. Bez absurdów i żartów, które
  zdradzają poprawną odpowiedź.
- Poprawna odpowiedź nie może się wyróżniać (np. być wyraźnie najdłuższa lub jedyna
  szczegółowa); unikaj „wszystkie powyższe” / „żadna z powyższych”.
- Język i poziom trudności dopasowane do wieku ucznia; jednoznaczna, merytorycznie
  poprawna odpowiedź.

### Weryfikacja zestawu

```bash
python3 -c "
import json, collections, sys
d = json.load(open(sys.argv[1]))
qs = [q for c in d for q in c['questions']]
assert all(len(q['answers']) == 3 and q['correctAnswerIndex'] in (0, 1, 2) for q in qs)
assert len({q['question'] for q in qs}) == len(qs), 'zduplikowane pytania'
assert 'Wszystko' not in [c['category'] for c in d]
print(len(d), 'kategorii,', len(qs), 'pytań,', collections.Counter(q['correctAnswerIndex'] for q in qs))
" app/public/NAZWA.json
```
