import { notFound } from "next/navigation";
import { getMarketById } from "@/data/markets";
import MarketCardEmbed from "./ui/MarketCardEmbed";

export default async function MarketCardEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ marketId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { marketId } = await params;
  const sp = searchParams ? await searchParams : {};
  const apiBaseRaw = sp.apiBase;
  const apiBase =
    typeof apiBaseRaw === "string"
      ? apiBaseRaw
      : Array.isArray(apiBaseRaw)
        ? apiBaseRaw[0]
        : undefined;

  const market = getMarketById(marketId);
  if (!market) notFound();

  return (
    <div className="min-h-[180px] w-full bg-transparent p-0">
      <MarketCardEmbed marketId={market.id} apiBase={apiBase} />
    </div>
  );
}
