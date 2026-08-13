const chartTypeMap: { [key: string]: (text: string) => string } = {
  xychart: (text: string) => {
    return `---
config:
    xyChart:
        showDataLabel: true
        showDataLabelOutsideBar: true
        height: 400
        titlePadding: 20
---
${text}
            `
  }
}

function chartConfig(text: string) {
  let newText = text;
  for (const key in chartTypeMap) {
    if (text.includes(key)) {
      const func = chartTypeMap[key]
      if (func(newText)) {
        newText = func(newText)
      }
    }
  }

  return newText;
}

export default chartConfig