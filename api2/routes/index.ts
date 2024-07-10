
import * as HyperExpress from "hyper-express";
import { successResponse, errorResponse, errorWrapper as ew } from "./utils";
import { readRouteData } from "../file-cache";
import { craftChartsResponse } from "../cron-task/storeCharts";
import { getStablecoinData } from "./getStableCoin";
import { craftChainDominanceResponse } from "./getChainDominance";
import { normalizeChain } from "../../src/utils/normalizeChain";

export default function setRoutes(router: HyperExpress.Router) {

  router.get("/config", defaultFileHandler);
  router.get("/rates", defaultFileHandler);
  router.get("/stablecoin", defaultFileHandler);
  router.get("/stablecoinprices", defaultFileHandler);
  router.get("/stablecoinchains", defaultFileHandler);
  router.get("/stablecoins", defaultFileHandler);
  router.get("/stablecoin/:stablecoin", defaultFileHandler);

  router.get("/stablecoindominance/:chain", ew(async (req: any, res: any) => {
    let { chain } = req.path_parameters;
    chain = normalizeChain(chain)
    return fileResponse('/stablecoindominance/'+chain, res);
  }))
  router.get("/stablecoincharts2/:chain", defaultFileHandler);
  router.get("/stablecoincharts2/all-llama-app", defaultFileHandler);
  router.get("/stablecoincharts2/all-dominance-chain-breakdown", defaultFileHandler);
  router.get("/stablecoincharts2/recent-protocol-data", defaultFileHandler);

  /* Ignore optional query parameters for now
  router.get("/stablecoins", ew(async (req: any, res: any) => {
    const { includePrices, includeChains } = req.query;
    const data = await readRouteData('stablecoins');
    if (includeChains?.toLowerCase() !== 'true')
      delete data.chains;
    if (includePrices?.toLowerCase() !== 'true') {
      data.peggedAssets.forEach((asset: any) => {
        delete asset.price;
      });
    }

    return successResponse(res, data);
  })); 

  router.get("/stablecoin/:stablecoin", ew(async (req: any, res: any) => {
    const { stablecoin } = req.path_parameters;

    return successResponse(res, getStablecoinData(stablecoin));
  }));

  router.get("/stablecoindominance/:chain", ew(async (req: any, res: any) => {
    const { chain } = req.path_parameters;

    return successResponse(res, craftChainDominanceResponse(chain.toLowerCase()));
  }));


  */


  // TOO: nuke this route to reduce load on the server
  router.get("/stablecoincharts/:chain", ew(async (req: any, res: any) => {
    const { chain } = req.path_parameters;
    let { stablecoin, starts, startts } = req.query;
    const peggedID = stablecoin?.toLowerCase()

    return successResponse(res, await craftChartsResponse({ chain, peggedID, startTimestamp: starts ?? startts }));
  }));

  function defaultFileHandler(req: HyperExpress.Request, res: HyperExpress.Response) {
    const fullPath = req.path;
    return fileResponse(fullPath, res);
  }

  async function fileResponse(filePath: string, res: HyperExpress.Response) {
    try {
      res.set('Cache-Control', 'public, max-age=1800'); // Set caching to 30 minutes
      res.json(await readRouteData(filePath))
    } catch (e) {
      console.error(e);
      return errorResponse(res, 'Internal server error', { statusCode: 500 })
    }
  }

}
