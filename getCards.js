"use strict";

require("dotenv").config();

const { launch } = require("./src/handlers/queryHandler");
const { Walker } = require("./src/core/Walker");

const walker = new Walker();
launch(walker);
