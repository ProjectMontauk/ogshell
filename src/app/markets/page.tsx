import { redirect } from "next/navigation";

/** Markets index lives on the homepage; keep /markets as a redirect for old links. */
export default function MarketsPage() {
  redirect("/");
}
