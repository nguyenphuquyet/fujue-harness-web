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

  // Đổi nguồn hay đồng bộ xong thì dựng lại bảng model từ dữ liệu máy chủ, để
  // model vừa chọn hiện ngay mà không phải tải lại trang.
  const catalogRevision = [
    providers
      .map((provider) => `${provider.id}:${provider.models}:${provider.last_synced_at ?? 0}`)
      .join(","),
    models.map((model) => model.id).join(","),
  ].join("|");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Model</h1>
        <p className="mt-1 text-sm text-muted">
          Mỗi model thuộc một nguồn. Đồng bộ để chọn đúng model từ nguồn đưa vào danh mục; cấu hình
          harness đọc danh mục đó từ{" "}
          <span className="font-mono text-xs">GET /api/v1/harness/config</span>.
        </p>
      </header>

      <ProvidersPanel initial={providers} />
      <ModelsClient
        key={catalogRevision}
        initial={models}
        providers={providers.map((provider) => ({ id: provider.id, name: provider.name }))}
      />
    </div>
  );
}
