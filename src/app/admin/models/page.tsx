import { getDefaultModelSlug, listModels, parseInputTypes, parseReasoningEfforts } from "@/lib/models";
import { listProviders } from "@/lib/providers";
import { ModelsClient, type ModelView } from "./models-client";
import { ProvidersPanel } from "./providers-panel";

export default function AdminModelsPage() {
  const providers = listProviders();
  const providerNames = new Map(providers.map((provider) => [provider.id, provider.name]));
  const defaultSlug = getDefaultModelSlug();

  const models: ModelView[] = listModels().map((model) => ({
    id: model.id,
    slug: model.slug,
    name: model.name,
    family: model.family,
    vendor: model.vendor,
    contextWindow: model.context_window,
    maxOutput: model.max_output,
    inputPrice: model.input_price,
    outputPrice: model.output_price,
    speed: model.speed,
    status: model.status,
    description: model.description,
    featured: model.featured === 1,
    inputTypes: parseInputTypes(model.input_types),
    reasoningEfforts: parseReasoningEfforts(model.reasoning_efforts),
    released: new Date(model.released_at).toLocaleDateString("vi-VN"),
    isDefault: model.slug === defaultSlug,
    providerId: model.provider_id,
    externalId: model.external_id,
    source: (model.provider_id && providerNames.get(model.provider_id)) || "Chưa gắn nguồn",
  }));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Model</h1>
        <p className="mt-1 text-sm text-muted">
          Mọi model đều thuộc một nguồn: nguồn cung cấp danh mục qua API, và cấu hình harness lấy
          đúng danh mục đó từ <span className="font-mono text-xs">GET /api/v1/harness/config</span>.
        </p>
      </header>

      <ProvidersPanel initial={providers} />
      <ModelsClient
        initial={models}
        providers={providers.map((provider) => ({ id: provider.id, name: provider.name }))}
      />
    </div>
  );
}
