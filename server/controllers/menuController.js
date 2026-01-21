import MenuItem from '../models/MenuItem.js'

export const listMenu = async (req, res) => {
  const items = await MenuItem.find().lean()
  res.json(items)
}
