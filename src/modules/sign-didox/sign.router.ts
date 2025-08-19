import express from "express";
import { createSignDidoxDocument } from "./sign.controller";
import { validateApiKey } from "./../../middleware/auth";
import { ROUTES_SIGN } from "./sign.routes";

const router = express.Router();
router.post(ROUTES_SIGN.CREATE_DIDOX, validateApiKey, createSignDidoxDocument);

export const signRouter = router;