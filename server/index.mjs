import app from "./app.mjs";
const port=Number(process.env.PORT||3001);
const server=app.listen(port,"127.0.0.1",()=>console.log(`Muktalent Admin: http://127.0.0.1:${port}/admin/`));
function shutdown(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();}
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
