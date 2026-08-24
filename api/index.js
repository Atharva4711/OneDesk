import { createRequire } from "module";
const require = createRequire(import.meta.url);
const app = require("../backend/server.cjs");

export default app;
