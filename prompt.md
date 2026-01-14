
# wymagania
```
convert file @wymagania.pdf to markdown file and save in wymagania.md
```

# pytania
```
W pliku @wymagania.md znajdują się wymagania z przedmiotu informatyka do klasy 8. Spróbuj ułożyć pytania (jedno lub więcej) do każdego z wymagań, a do każdego z pytań podaj trzy odpowiedzi, gdzie tylko jedna będzie poprawna, a dwie błędne. Do niektórych wymagań, może nie dać się łatwo ułożyć tego typu pytań. Takie wymagania pomiń, ale poinform mnie o tym, które pomijasz. Ponumeruj kolejno pytania. Wynik zapisz w pliku pytania_sonnet.md
```

# json
```
W folderze projektu znajdują się 3 pliki o nazwach zaczynających się słowem `pytania_`. W każdym znajdują się
  pytania testowe, 3 odpowiedzi i informacja o tym, która odpowiedź jest poprawna. Wyciągnij pytania ze wszystkich
  plików i zapisz w pliku pytania.json, którego struktura będzie następująca:

  [
    {
      question: "treść pytania",
      answers: [
        "odpowiedź 1",
        "odpowiedź 2",
        "odpowiedź 3"
      ],
      correctAnswerIndex: 0
    }
  ]
```

# mieszanie
```
Pytania są w porządku, jednak poprawna odpowiedź w kolejnych pytaniach ma wielokrotnie kolejno ten sam index.
Przemieszaj kolejność odpowiedzi w `answers` we wszystkich pytaniach zmieniając adekwatnie `correctAnswerIndex`.
```

# wiarygodne odpowiedzi
błędne odpowiedzi w pliku pytania.json często są bardzo absurdalne, do tego stopnia, że łatwo jest odgadnąć
prawidłową. pozmieniaj tylko błędne odpowiedzi tak, żeby stopień trudności quizu był nieco wyższy

błędne odpowiedzi muszą "udawać", że odpowiadają na zadane pytanie. teraz nie koniecznie to widać, co bezpośrednio
wskazuje błędne odpowiedzi.

# create app
w folderze app stwórz prostą aplikację vue, której zadaniem będzie:
  -  załadowanie pliku z pytania.json i wyświetlanie po jednym pytaniu w formie formularza z możliwymi
  odpowiedziami.
  - pod formularzem będą 2 przyciski: "zatwierdź" i "następne pytanie".
  - użytkownik będzie wybierał jedną z odpowiedzi i klikał przycisk "zatwierdź" (drugi przycisk będzie wtedy
  nieaktywny). Po zatwierdzeniu poprawna odpowiedź będzie sprawdzana i wyścietlany komunikat o poprawności, a
  zaznaczona odpowiedź podświetli się na zielono jeśli jest prawidłowa lub czerwono w przeciwnym razie.
  - "Zatwierdź" stanie się nieaktywny, a "Następne pytanie" stanie się aktywne.
  - Kliknięcie drugiego przycisku spowoduje wylosowanie następnego pytania.

  Użyj najnowszego vue i vite. Skopiuj pytania.json do odpowiedniego folderu aplikacji.  Do warstwy UI użyj
  tailwindcss, aby zminimalizować konieczność pisania kodu CSS

# status bar
nad formularzem wyświetlaj status wiedzy, czyli
- na ile pytań odpowiedziano poprawnie
- na ile pytań odpowiedziano błędnie
- ile pytań zostało do odpowiedzenia (ilość wszystkich pomniejszona o poprawne odpowiedziane)

wytyczne
- do prezentacji stanu wiedzy użyj progress baru, który będzie miał odpowiedni 3 kolory (szary, zielony i
czerwony) w zależności od stanu
- do zapamiętywania udzielonych odpowiedzi użyj localStorage, aby stan formularza nie zminiał sie po opuszczeniu
strony
- jako nowe pytanie losu tylko z niodpowiedzianych i odpowiedzianych błędnia. jeśli wylosujesz błędnie
odpowiedziane, pokaż mały czerwony hint pod pytaniem informujący "Na to pytanie wcześniej odpowiedziałeś
błędnie. Spróbuj jeszcze raz!"

# poprawki
niech przycisk "następne pytanie" będzie jednak zawsze aktywny

# kategorie
z puli pytań wyciągnij kilka kategorii, których te pytania dotyczą, np. "Gimp", "Excel", "Bezpieczeństwo w
sieci" itp. i zbierz pytania w grupy kategorii. zmodyfikuj plik pytania.json tak, aby jago struktura wyglądała
następująco:

[
  {
    category: "Excel",
    questions: [
      {
        question: "treść pytania",
        answers: [
          "odpowiedź 1",
          "odpowiedź 2",
          "odpowiedź 3"
        ],
        correctAnswerIndex: 0
      }
    ]
  }
]

zmień aplikację tak, aby:
- pod tytułem znajdowała się lista kategorii do wyboru (może jedna linijka przycisków?)
- zaznaczenie kategorii podświetla ją i zapisuje stan w localstorage, a pytania są losowane tylko z wybranej kategorii, stan quizu pojazuje dane z wybranej kategorii

# wszystkie
w formularzu dodaj kategowię "Wszystko" jako pierwszą. Po jej wybraniu pytania i statystyki odnoszą się do
pytań zebranych ze wszystkich kategorii.

# trophy
Jeżeli na wszystkie pytania w danej kategorii odpowiedziano poprawnie, ukryj pytanie w formularzu i pokaż
komunikat "Odpowiedziałeś poprawnie na wszystkie pytania w [nazwa wybranej kategorii]. Wybierze inną
kategorię.". Ukryj przyciski "sprawdź" i "następne".

Jeżeli na wszystkie pytania we wszystkich kategoriach odpowiedziano poprawnie, zamiast pytań i przycisków, pokaż
dużą  ikonę trophy w odpowiednim triumfującym stylu i komunikat "Gratulacje! Rozwiązałeś poprawnie cały quiz.".
pod spodem pokaż zielony przycisk "Rozwiąż ponownie", który zresetuje odpowiedzi, wybierze kategorię "Wszystko"
i zacznie ponownie.
