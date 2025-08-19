import 'dotenv/config'; 
import bodyParser from "body-parser";
import express from "express";
import { ROUTES_SIGN, signRouter } from "./modules/sign-didox";
import { EImzoSession } from "./modules/e-imzo";
import { runAutoItScript } from './script/auto-it';
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from './utils/swagger';

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Подключаем Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

runAutoItScript("src/script/auto-it/auto-sign-demon.au3", true)
  .then(() => console.log("AutoIt-демон завершился (неожиданно)"))
  .catch(err => console.error("Ошибка демона AutoIt:", err));

export const eImzo = new EImzoSession();

// Инициализация сессии при старте сервера
eImzo.init().catch(console.error);

app.get("/", (req, res) => {
    res.send("SERVER IS STARTED");
});

app.use(ROUTES_SIGN.BASE, signRouter);

const port = Number(process.env.PORT) || 3000;

app.listen(port, "0.0.0.0",  () => {
    console.log(`Server is running on port ${port}`);
});