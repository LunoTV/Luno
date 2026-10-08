export async function testSourceRuntime(engine,item){
  const started=Date.now();
  if(!engine?.resolve)throw new Error("Source Engine is not initialized");
  if(!item)throw new Error("Content item is required");
  const streams=await engine.resolve(item);
  return {
    ok:Array.isArray(streams)&&streams.length>0,
    durationMs:Date.now()-started,
    count:Array.isArray(streams)?streams.length:0
  };
}
