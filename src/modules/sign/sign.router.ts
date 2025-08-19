import express from "express";
import { createSignDocument } from "./sign.controller";
import { ROUTES_SIGN } from "./sign.routes";

const router = express.Router();

router.post(ROUTES_SIGN.CREATE, createSignDocument);

export default router ;