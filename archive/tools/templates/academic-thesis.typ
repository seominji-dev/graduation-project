// 홍익대학교 졸업프로젝트 학술 문서 템플릿
// Typst v0.14.2 호환

#let academic-thesis(
  title: "",
  subtitle: "",
  author: "",
  affiliation: "홍익대학교 컴퓨터공학과",
  date: datetime.today(),
  abstract: none,
  keywords: (),
  body,
) = {
  // 문서 기본 설정
  set document(title: title, author: author)

  // 페이지 설정 - A4 세로
  set page(
    paper: "a4",
    margin: (top: 3cm, bottom: 2.5cm, left: 2.5cm, right: 2.5cm),
    header: context {
      if counter(page).get().first() > 1 [
        #set text(size: 9pt, fill: gray)
        #title
        #h(1fr)
        #author
      ]
    },
    footer: context {
      set align(center)
      set text(size: 10pt)
      counter(page).display("1")
    },
  )

  // 폰트 설정
  set text(
    font: ("Pretendard", "Noto Sans KR", "Malgun Gothic"),
    size: 11pt,
    lang: "ko",
  )

  // 제목 스타일
  set heading(numbering: "1.1")
  show heading.where(level: 1): it => {
    set text(size: 16pt, weight: "bold")
    v(1em)
    it
    v(0.5em)
  }
  show heading.where(level: 2): it => {
    set text(size: 14pt, weight: "bold")
    v(0.8em)
    it
    v(0.4em)
  }
  show heading.where(level: 3): it => {
    set text(size: 12pt, weight: "bold")
    v(0.6em)
    it
    v(0.3em)
  }

  // 단락 설정
  set par(
    justify: true,
    leading: 1.2em,
    first-line-indent: 1em,
  )

  // 코드 블록 스타일
  show raw.where(block: true): it => {
    set text(size: 9pt)
    block(
      fill: rgb("#f5f5f5"),
      inset: 10pt,
      radius: 4pt,
      width: 100%,
      it,
    )
  }

  // 인라인 코드
  show raw.where(block: false): box.with(
    fill: rgb("#f0f0f0"),
    inset: (x: 3pt, y: 0pt),
    outset: (y: 3pt),
    radius: 2pt,
  )

  // 표 스타일
  set table(
    stroke: 0.5pt + black,
    inset: 8pt,
  )
  show table: set text(size: 10pt)

  // 그림 스타일
  show figure: it => {
    set align(center)
    v(1em)
    it
    v(1em)
  }
  show figure.caption: it => {
    set text(size: 10pt)
    it
  }

  // ===== 표지 =====
  align(center)[
    #v(3cm)
    #text(size: 12pt)[#affiliation]
    #v(1cm)
    #text(size: 24pt, weight: "bold")[#title]
    #if subtitle != "" {
      v(0.5cm)
      text(size: 16pt)[#subtitle]
    }
    #v(2cm)
    #text(size: 14pt)[#author]
    #v(1cm)
    #text(size: 12pt)[#date.display("[year]년 [month]월 [day]일")]
  ]

  pagebreak()

  // ===== 초록 =====
  if abstract != none {
    heading(level: 1, numbering: none)[초록]
    abstract

    if keywords.len() > 0 {
      v(1em)
      text(weight: "bold")[키워드: ]
      keywords.join(", ")
    }
    pagebreak()
  }

  // ===== 목차 =====
  heading(level: 1, numbering: none)[목차]
  outline(
    title: none,
    indent: 1.5em,
    depth: 3,
  )
  pagebreak()

  // ===== 본문 =====
  body
}

// 유틸리티 함수들
#let note(body) = {
  block(
    fill: rgb("#e3f2fd"),
    inset: 10pt,
    radius: 4pt,
    width: 100%,
    [*참고:* #body],
  )
}

#let warning(body) = {
  block(
    fill: rgb("#fff3e0"),
    inset: 10pt,
    radius: 4pt,
    width: 100%,
    [*주의:* #body],
  )
}

#let info-table(..items) = {
  table(
    columns: (1fr, 2fr),
    align: (left, left),
    ..items.pos().flatten()
  )
}
