import { createApiServer } from "./server.js";

const port = Number(process.env.PORT ?? 3001);
createApiServer().listen(port, () => console.info(`Astralis API listening on http://localhost:${port}`));
