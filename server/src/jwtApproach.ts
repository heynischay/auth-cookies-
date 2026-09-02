import "dotenv/config";
import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const Secret = process.env.SECRET;

if (!Secret) {
  console.error("env vars not loaded");
  process.exit(1);
}

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// This file follows the stateless jwt + cookies approach

app.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    // validating step

    const alreadyExits = await prisma.user.findUnique({ where: { email } });

    if (alreadyExits) return res.status(409).json({ message: "email already exists" });

    const hashedPass = await bcrypt.hash(password, 10);

    await prisma.user.create({ data: { email, password: hashedPass } });

    return res.json({ message: "you are signed up" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/signin", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    // validating step

    const requiredCreds = await prisma.user.findUnique({ where: { email } });

    if (!requiredCreds) {
      return res.status(400).json({ message: "email not found" });
    }

    const correctPassword = await bcrypt.compare(password, requiredCreds.password);

    if (!correctPassword) {
      return res.status(401).json({ message: "incorrect Password" });
    }

    // we decode the token to save in the cookie

    const token = jwt.sign(
      {
        id: requiredCreds.id,
      },
      Secret,
    );

    res.cookie("Authorization", token, { httpOnly: true, sameSite: "lax" });

    // saving the token in the cookie

    res.json({ message: "you are signed in !!", user: { email: requiredCreds.email } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// auth guard
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.Authorization;

    console.log(req.cookies);

    const decoded = jwt.verify(token, Secret) as { id: number };

    // here we decode the token against the secret if its invalid it throws an error

    req.userId = decoded.id;

    next();
  } catch (error) {
    console.log("jwt error", error);
    res.status(401).json({ message: "Unauthorised user" });
  }
});

// mock authenticated route

app.post("/logout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("Authorization"); // clearing the cookie on logout in a prod that cookie would have an expiry to the token

    res.json({ message: "you are logged out" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Somwthing went wrong" });
  }
});

app.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.clearCookie("token");
      return res.status(401).json({ message: "Unauthorized User" });
    }

    res.json({ message: "user found ", user: { email: user.email } });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Somwthing went wrong" });
  }
});

app.post("/notes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body as { text: string };
    const userId = req.userId;

    if (!text || text.length === 0 || typeof text !== "string") {
      res.status(400).json({ error: "invalid title field" });
    }

    const note = await prisma.notes.create({ data: { text, userId } });

    return res.json({ message: `note added with text ${text}`, note });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/notes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const notes = await prisma.notes.findMany({ where: { userId } });

    if (!notes) return res.status(404).json({ message: "user has not created any notes" });

    res.json({ notes: notes });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(3001, () => {
  console.log("Server running at port 3001");
});
