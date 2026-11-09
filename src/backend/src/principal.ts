import { criarServidor } from "./aplicacao.js";
import { criarPool } from "./db.js";
import { criarRepositorioPg } from "./repositorio.js";

const porta = Number(process.env.PORT ?? 3000);
const pool = criarPool();
const servidor = criarServidor(criarRepositorioPg(pool));

servidor.listen(porta, "0.0.0.0", () => {
  console.log(`Almanak API em http://0.0.0.0:${porta}`);
});

async function encerrar(): Promise<void> {
  servidor.close();
  await pool.end();
}

process.on("SIGINT", () => {
  void encerrar().finally(() => process.exit(0));
});
process.on("SIGTERM", () => {
  void encerrar().finally(() => process.exit(0));
});
