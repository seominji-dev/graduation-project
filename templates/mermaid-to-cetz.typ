// Mermaid 다이어그램을 CeTZ로 변환하는 유틸리티
#import "@preview/cetz:0.3.4"

#let flowchart-lr(nodes, edges) = {
  cetz.canvas({
    import cetz.draw: *

    let x-offset = 3.5
    let y-offset = 2

    // 노드 그리기
    for (i, node) in nodes.enumerate() {
      let x = calc.rem(i, 4) * x-offset
      let y = -calc.floor(i / 4) * y-offset

      rect(
        (x - 1.2, y - 0.5),
        (x + 1.2, y + 0.5),
        fill: rgb("#e3f2fd"),
        stroke: rgb("#1976d2"),
        radius: 4pt,
        name: "node-" + str(i),
      )
      content((x, y), text(size: 9pt)[#node])
    }

    // 엣지 그리기
    for edge in edges {
      line(
        "node-" + str(edge.from) + ".east",
        "node-" + str(edge.to) + ".west",
        stroke: rgb("#666"),
        mark: (end: ">"),
      )
    }
  })
}

#let system-architecture(title, layers) = {
  figure(
    cetz.canvas({
      import cetz.draw: *

      let y = 0
      for (layer-name, components) in layers {
        // 레이어 배경
        rect(
          (-5, y - 0.8),
          (5, y + 0.8),
          fill: rgb("#f5f5f5"),
          stroke: rgb("#ddd"),
          radius: 4pt,
        )

        // 레이어 이름
        content((-4.5, y), text(size: 8pt, weight: "bold")[#layer-name], anchor: "west")

        // 컴포넌트들
        let comp-width = 8 / components.len()
        for (i, comp) in components.enumerate() {
          let cx = -3.5 + i * comp-width + comp-width / 2
          rect(
            (cx - 0.8, y - 0.4),
            (cx + 0.8, y + 0.4),
            fill: white,
            stroke: rgb("#1976d2"),
            radius: 2pt,
          )
          content((cx, y), text(size: 7pt)[#comp])
        }

        y -= 2
      }
    }),
    caption: title,
  )
}

// 간단한 박스 다이어그램
#let simple-boxes(items, columns: 3) = {
  cetz.canvas({
    import cetz.draw: *

    let col-width = 3
    let row-height = 1.5

    for (i, item) in items.enumerate() {
      let col = calc.rem(i, columns)
      let row = calc.floor(i / columns)
      let x = col * col-width
      let y = -row * row-height

      rect(
        (x - 1, y - 0.4),
        (x + 1, y + 0.4),
        fill: rgb("#e8f5e9"),
        stroke: rgb("#4caf50"),
        radius: 3pt,
      )
      content((x, y), text(size: 8pt)[#item])
    }
  })
}

// 계층 구조 다이어그램 (LR 방향)
#let hierarchy-lr(levels) = {
  cetz.canvas({
    import cetz.draw: *

    let x = 0
    let level-width = 4

    for (level-name, items) in levels {
      // 레벨 헤더
      rect(
        (x - 0.1, 1),
        (x + 2.5, 1.6),
        fill: rgb("#1976d2"),
        stroke: none,
        radius: 3pt,
      )
      content((x + 1.2, 1.3), text(size: 8pt, fill: white, weight: "bold")[#level-name])

      // 아이템들
      let y = 0
      for item in items {
        rect(
          (x, y - 0.3),
          (x + 2.4, y + 0.3),
          fill: rgb("#e3f2fd"),
          stroke: rgb("#1976d2"),
          radius: 2pt,
        )
        content((x + 1.2, y), text(size: 7pt)[#item])
        y -= 0.8
      }

      // 다음 레벨로 화살표
      if x > 0 {
        line(
          (x - 0.8, 0),
          (x - 0.2, 0),
          stroke: rgb("#666"),
          mark: (end: ">"),
        )
      }

      x += level-width
    }
  })
}
