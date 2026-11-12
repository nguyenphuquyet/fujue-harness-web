import { currentUser } from "@/lib/auth";
import { getDefaultModelSlug, listModels, parseInputTypes, parseReasoningEfforts } from "@/lib/models";
import { usageByModel } from "@/lib/usage";
import { walletSummary, vndPerUsd } from "@/lib/wallet";
import { ModelsClient, type ModelCard } from "./models-client";

export default async function DashboardModelsPage() {
  const user = await currentUser();
  if (!user) return null;

  const defaultSlug = getDefaultModelSlug();
  const usage = new Map(usageByModel(user.id, 30).map((row) => [row.model_slug, row]));
  const wallet = walletSummary(user.id);

  const models: ModelCard[] = listModels()
    .filter((model) => model.status !== "retired")
    .map((model) => {
      const row = usage.get(model.slug);
      const reasoning = parseReasoningEfforts(model.reasoning_efforts);
      return {
        slug: model.slug,
        name: model.name,
        vendor: model.vendor,
        contextWindow: model.context_window,
        maxOutput: model.max_output,
        inputPrice: model.input_price,
        outputPrice: model.output_price,
        inputTypes: parseInputTypes(model.input_types),
        reasoningLevels: reasoning ? Object.keys(reasoning) : [],
        status: model.status,
        isDefault: model.slug === defaultSlug,
        requests: row?.requests ?? 0,
        tokens: (row?.tokens_in ?? 0) + (row?.tokens_out ?? 0),
        costVnd: row?.cost_vnd ?? 0,
      };
    });

  return <ModelsClient models={models} balanceVnd={wallet.balanceVnd} vndPerUsd={vndPerUsd()} />;
}
