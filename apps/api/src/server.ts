import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import authRoutes from "./routes/auth";
import brokerRoutes from "./routes/brokers";
import invoiceRoutes from "./routes/invoices";
import loadRoutes from "./routes/loads";

const app = Fastify({ logger: true });

app.register(cors);
app.register(jwt, { secret: process.env.JWT_SECRET! });

app.decorate("authenticate", async function authenticate(req: any) {
  await req.jwtVerify();
});

app.register(authRoutes, { prefix: "/auth" });
app.register(loadRoutes, { prefix: "/loads" });
app.register(brokerRoutes, { prefix: "/brokers" });
app.register(invoiceRoutes, { prefix: "/invoices" });

app.listen({ port: Number(process.env.PORT || 3000), host: "0.0.0.0" });
