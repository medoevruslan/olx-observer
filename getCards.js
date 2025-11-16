import "dotenv/config";

import { getCards } from "./src/handlers/queryHandler.ts";
import { Walker } from "./src/core/Walker.ts";

const walker = new Walker();
getCards(walker);
