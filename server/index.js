import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import managerRoutes from "./routes/managerRoutes.js";
import menuRoutes from "./routes/menu.js";
import tablesRoutes from "./routes/tables.js";
import ordersRoutes from "./routes/orders.js";
import settingsRoutes from "./routes/settings.js";
import metricsRoutes from "./routes/metrics.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import morgan from "morgan";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Database
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/manager", managerRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/metrics", metricsRoutes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});

// Make io available in route handlers/controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  // Optional: join rooms by role/view if needed in future
  socket.on('disconnect', () => {});
});

server.listen(PORT, () => console.log(`Server + Socket.IO running on port ${PORT}`));
