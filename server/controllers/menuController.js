import MenuItem from '../models/MenuItem.js';

// @desc    Get all menu items
// @route   GET /api/menu
export const listMenu = async (req, res) => {
  try {
    const items = await MenuItem.find().lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
export const getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new menu item
// @route   POST /api/menu
export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, available, vegetarian } = req.body;

    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image,
      available,
      vegetarian,
    });

    const createdItem = await menuItem.save();
    res.status(201).json(createdItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:id
export const updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, available, vegetarian } = req.body;

    const item = await MenuItem.findById(req.params.id);

    if (item) {
      item.name = name || item.name;
      item.description = description || item.description;
      item.price = price !== undefined ? price : item.price;
      item.category = category || item.category;
      item.image = image || item.image;
      item.available = available !== undefined ? available : item.available;
      item.vegetarian = vegetarian !== undefined ? vegetarian : item.vegetarian;

      const updatedItem = await item.save();
      res.json(updatedItem);
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (item) {
      await MenuItem.deleteOne({ _id: item._id });
      res.json({ message: 'Menu item removed' });
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
