"use strict";

require("dotenv").config();

const { launchScrap } = require("./handlers/queryHandler");
const { Scrapper } = require("./handlers/scrapper");

const scrapper = new Scrapper();
launchScrap(scrapper);
