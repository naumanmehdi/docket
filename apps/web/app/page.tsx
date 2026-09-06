import { getStore } from "@/lib/store";
import Landing from "./_components/Landing";
import { toRow } from "@/lib/listing";

export const dynamic = "force-dynamic";

async function getRows() {
  try {
    const rows = await getStore().searchListings({ limit: 200 });
    return rows.map(toRow);
  } catch (err) {
    console.error("board unavailable", err);
    return [];
  }
}

export default async function HomePage() {
  const rows = await getRows();
  return <Landing rows={rows} />;
}
