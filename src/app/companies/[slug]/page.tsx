import { redirect } from "next/navigation";

export default function LegacyBusinessProfileRedirect({ params }: { params: { slug: string } }) {
  redirect(`/business/${params.slug}`);
}
