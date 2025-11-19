import "dotenv/config";
import { sendToBot } from "./src/handlers/messageHandler.ts";
import moment from "moment";

const date = moment().year(2025).month(9);
await sendToBot(date.toDate());
process.exit(1);
