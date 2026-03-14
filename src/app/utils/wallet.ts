export const getCurrentQuarter = () => {

  const now = new Date()

  const month = now.getMonth() + 1

  const quarter = Math.ceil(month / 3)

  const year = now.getFullYear()

  return { quarter, year }

}