
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
