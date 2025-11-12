import "dotenv/config";

import { launch } from "./src/handlers/queryHandler.ts";
import { Walker } from "./src/core/Walker.ts";

const walker = new Walker();
launch(walker);
