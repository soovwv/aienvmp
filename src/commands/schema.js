import { schemaContract } from "../contract.js";

export async function schemaWorkspace(args = {}) {
  const schema = schemaContract();
  if (args.json) {
    console.log(JSON.stringify(schema, null, 2));
  } else {
    console.log("aienvmp contract");
    console.log(`schema: ${schema.name} v${schema.schemaVersion}`);
    console.log(`status: ${schema.outputs.status.command}`);
    console.log(`context: ${schema.outputs.context.command}`);
    console.log(`handoff: ${schema.outputs.handoff.command}`);
    console.log(`rule: ${schema.compatibility.consumerRule}`);
  }
  return schema;
}
