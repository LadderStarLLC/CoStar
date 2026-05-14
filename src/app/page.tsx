import HomePageClient from "@/components/HomePageClient";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { defaultHomepageContent } from "@/lib/homepageContent";
import { getPublishedHomepageContent } from "@/lib/homepageContentServer";

export const dynamic = "force-dynamic";

export default async function Home() {
  let content = defaultHomepageContent;

  try {
    content = await getPublishedHomepageContent(getAdminDb());
  } catch (err) {
    console.error("[homepage] Failed to load published content.", err);
  }

  return <HomePageClient content={content} />;
}
