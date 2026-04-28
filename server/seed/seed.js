import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import Kitchen from "../models/Kitchen.js";
import Manager from "../models/Manager.js";

dotenv.config();
await connectDB();

const defaultMenu = [
  {
    name: "Margherita Pizza",
    description: "Classic pizza with mozzarella and basil",
    price: 12.99,
    category: "Main Course",
    image: "",
    available: true,
    vegetarian: true,
  },
  {
    name: "Cheeseburger",
    description: "Juicy beef patty with cheddar",
    price: 10.49,
    category: "Main Course",
    image: "",
    available: true,
    vegetarian: false,
  },
  {
    name: "Caesar Salad",
    description: "Crisp romaine with Caesar dressing",
    price: 8.99,
    category: "Appetizers",
    image: "",
    available: true,
    vegetarian: true,
  },
  {
    name: "Tiramisu",
    description: "Classic coffee-flavored dessert",
    price: 6.99,
    category: "Desserts",
    image: "",
    available: true,
    vegetarian: true,
  },
  {
    name: "Iced Coffee",
    description: "Cold brew with milk",
    price: 4.49,
    category: "Beverages",
    image: "",
    available: true,
    vegetarian: true,
  },
];

const defaultTables = Array.from({ length: 15 }, (_, i) => ({
  number: i + 1,
  status: "available",
  capacity: [2, 4, 6][i % 3],
}));

const seed = async () => {
  try {
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      await MenuItem.insertMany(defaultMenu);
      console.log("✅ Menu items seeded");
    }

    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      await Table.insertMany(defaultTables);
      console.log("✅ Tables seeded");
    }

    const kitchenCount = await Kitchen.countDocuments();
    if (kitchenCount === 0) {
      await Kitchen.create({
        email: "kitchen@roms.com",
        password: "kitchenpassword",
        name: "Head Chef",
      });
      console.log("✅ Kitchen user seeded (kitchen@roms.com / kitchenpassword)");
    }

    const managerCount = await Manager.countDocuments();
    if (managerCount === 0) {
      await Manager.create({
        email: "manager@roms.com",
        password: "managerpassword",
        name: "Main Manager",
        role: "manager",
      });
      console.log("✅ Manager user seeded (manager@roms.com / managerpassword)");
    }

    console.log("🌱 Seeding completed");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
