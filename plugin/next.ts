// plugin/next.js
import fp from "fastify-plugin";
import nextJs from "@fastify/nextjs";

export default fp(async (fastify, opts) => {
  fastify.register(nextJs);
});